const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require('./mapLoader'); //call the module

const SPEED = 3; // how fast players move
const BULLETS_SPEED = 7;
const TICK_RATE = 60; //how fast do we want to refresh the server
const TILE_SIZE = 32;

function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}
function isCollidingWithObjects(player, map){
    for (let row = map.length/2; row < map.length*0.75; row++) {
        for (let col = 0; col < map[0].length; col++){
            const tile = map[row][col];
            if (
                tile &&
                isColliding(
                {
                    x: player.x,
                    y: player.y,
                    w:32,
                    h:32,
                },
                {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    w: TILE_SIZE,
                    h: TILE_SIZE,
                }
                )
            )   {
                return true;
            }
        }
    }
    return false;
}

function tick(delta, map) {
    for (const player of players) { //loops players
        const inputs = inputMap[player.id]; //checks players input
        const previousY = player.y;
        const previousX = player.x;

        // check when player move diagonaly
        if (inputs.right && inputs.up){
            player.x += SPEED / 1.5;
            player.y -= SPEED / 1.5;
            player.inMovement = true;
            continue;
        }

        if (inputs.right && inputs.down){
            player.x += SPEED / 1.5;
            player.y += SPEED / 1.5;
            player.inMovement = true;
            continue;
        }

        if (inputs.left && inputs.up){
            player.x -= SPEED / 1.5;
            player.y -= SPEED / 1.5;
            player.inMovement = true;
            continue;
        }

        if (inputs.left && inputs.down){
            player.x -= SPEED / 1.5;
            player.y += SPEED / 1.5;
            player.inMovement = true;
            continue;
        }

        // ortogonal movemnets
        if(inputs.up){
            player.y -= SPEED;
            player.orientation = "up";
            player.inMovement = true;
        } else if(inputs.down){
            player.y += SPEED;
            player.orientation = "down";
            player.inMovement = true;
        }

        if (isCollidingWithObjects(player, map)){
            player.y = previousY;
            player.x = previousX;
        }

        if(inputs.right){
            player.x += SPEED;
            player.orientation = "right";
            player.inMovement = true;
        } else if(inputs.left){
            player.x -= SPEED;
            player.orientation = "left";
            player.inMovement = true;
        }

        // player standing still
        if(!inputs.right && !inputs.left && !inputs.up && !inputs.down){
            player.inMovement = false;
        }

        // handles weapons pick-ups
        for(const weapon of weapons){
            if((player.x >= weapon.x -20 && player.x <= weapon.x + 20) && (player.y >= weapon.y -20 && player.y <= weapon.y + 20)){
                player.weapon = weapon.type;
                weapons = weapons.filter(w => w !== weapon);
            }
        }
    }

    for (const bullet of bullets){
        bullet.x += Math.cos(bullet.angle) * BULLETS_SPEED;
        bullet.y += Math.sin(bullet.angle) * BULLETS_SPEED;
        bullet.timeToLive -= delta; // decrease by delta every tick

        // check if someone got shot
        for (const player of players) {
            const distance = Math.sqrt((player.x - bullet.x + 10) ** 2 + (player.y - bullet.y + 10) ** 2);
            if (distance < 8 && bullet.shooter !== player.id) { // player got shot
                player.health -= 30;
                if (player.health <= 0){
                    player.x = 0;
                    player.y = 0;
                    player.health = 100; // restore the health
                    const shooter = players.find((player) => player.id === bullet.shooter);
                    shooter.score += 1; // update the score after every kill
                }
                bullet.timeToLive = 0; // destroy bullet after it lands
            }
        }
    }

    bullets = bullets.filter((bullet) => bullet.timeToLive > 0); // remove bullets that are at a certain distance (timeToLive has reached 0)

    io.emit("players", players); // send players to clients
    io.emit("bullets", bullets); // send bullets to clients
    io.emit("weapons", weapons); // send weapons to clients
}

const inputMap = {}; // empty object
let players = []; //keeps track of players
let bullets = []; //keeps track of bullets
let weapons = []; //keeps track of weapons

async function main(){

    const map2D = await loadMap(); // load the map

    io.on("connect", (socket) => { // check if someone connected
        console.log("user connected", socket.id);

        inputMap[socket.id] = {
            "up": false,
            "down": false,
            "left": false,
            "right": false
        }

        players.push({
            id: socket.id,
            x: 0,
            y: 0,
            orientation: "right",
            score: 0,
            inMovement: false,
            health: 100,
            weapon: "pistol",  // default weapon
            canShoot: true
        }); // store players

        socket.emit("map", map2D); // send the map to clients

        socket.on("input", (input) => {
            inputMap[socket.id] = input; 
        }); // store the input and the player

        socket.on("disconnect", () =>{
            players = players.filter((player) => player.id !== socket.id);
        }); // remove players from the array when they disconnect (and consequently from the map when the server sends it to clients)

        socket.on("weapons", (x, y, type) => {

            weapons.push({
                x, y, // where to place it
                type,
            });
        }); // store weapons on screen

        socket.on("bullets", (angle) => {
            const player = players.find((player) => player.id === socket.id); // find the shooter

            if (!player.canShoot) {
                return;
            }

            player.canShoot = false; // delay beetween shots
            let waitTime;

            if (player.weapon === "pistol") {
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 200 // bullets hit close target
                });
                waitTime = 1000;
            }
            else if (player.weapon === "rifle"){
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 500 // bullets reach farther
                });  
                waitTime = 300;
            }

            else if (player.weapon === "shotgun"){
                var numBullets = 5; // number of bullets firet each shot
                var angleOffset = Math.PI / 8; // space beetween bullets
                var centralAngle = angle - angleOffset * (numBullets / 2);

                for (var i = 0; i < numBullets; i++) {
                    var angle = centralAngle + (i * angleOffset);
                    bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 200 // you have to be realy close to land shots
                    });
                    waitTime = 1000;
                }
            }

            else if (player.weapon === "sniper"){
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 1500 // bullets reach far away
                    });
                    waitTime = 1500;
            }

            setTimeout(() => {
                player.canShoot = true;
            }, waitTime);
        }); // handles bullets and wait times
    }); 
    
    app.use(express.static("public"));
    
    httpServer.listen(5000);
    
    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta, map2D);
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}

main()
