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
const spawn_points = [
    [600,400],   //
    [1000,400],  //
    [1000,800],  //           //Array of coordinates [x,y]
    [700,1500],
    [1500,1000],
    [1000,1500],
];


function tick(delta, map2D) {

    for (const player of players) { //loops players

        const inputs = inputMap[player.id]; //checks players input

        if(!(inputs.right || inputs.left || inputs.down || inputs.up)) {
            player.inMovement = false;
            continue // if the player is still, don't check anything'
        }
        let desiredX = player.x;
        let desiredY = player.y;

        // Check when players want to move diagonaly
        if (inputs.right && inputs.up) {
            desiredX += SPEED / 1.5;
            desiredY -= SPEED / 1.5;
        } else if (inputs.right && inputs.down) {
            desiredX += SPEED / 1.5;
            desiredY += SPEED / 1.5;
        } else if (inputs.left && inputs.up) {
            desiredX -= SPEED / 1.5;
            desiredY -= SPEED / 1.5;
        } else if (inputs.left && inputs.down) {
            desiredX -= SPEED / 1.5;
            desiredY += SPEED / 1.5;
        } else if (inputs.up) {
            desiredY -= SPEED;
            player.orientation="up";
        } else if (inputs.down) {
            desiredY += SPEED;
            player.orientation="down";
        } else if (inputs.right) {
            desiredX += SPEED;
            player.orientation="right";
        } else if (inputs.left) {
            desiredX -= SPEED;
            player.orientation="left";
        } 

        player.inMovement= true;

        // Check the tile the player is standing of
        const newRow = map2D.length / 2 + Math.round(desiredY / TILE_SIZE);
        const newCol = Math.round(desiredX / TILE_SIZE);
        const newRow2 = Math.round(desiredY / TILE_SIZE);
        const newCol2 = Math.round(desiredX / TILE_SIZE);
        // checks for collisions and map border
        if ((!map2D[newRow][newCol] && !map2D[newRow][newCol ]) ) {
            if ((newCol2>0 && newCol2<100 ) && (newRow2>0 && newRow2<100)){
                // if the move is valid, move the player 
                player.x = desiredX;
                player.y = desiredY;
            }
        } 


        // handles weapons pick-ups
        for(const weapon of weapons){
            if((player.x >= weapon.x -20 && player.x <= weapon.x + 20) && (player.y >= weapon.y -20 && player.y <= weapon.y + 20)){
                player.weapon = weapon.type;
                weapons = weapons.filter(w => w !== weapon);
            }
        }
    }
    bullets = bullets.filter((bullet) => bullet.timeToLive > 0); // remove bullets that are at a certain distance (timeToLive has reached 0)

    for (const bullet of bullets){

        bullet.x += Math.cos(bullet.angle) * BULLETS_SPEED;
        bullet.y += Math.sin(bullet.angle) * BULLETS_SPEED;
        bullet.timeToLive -= delta; // decrease by delta every tick

        const row = Math.round(bullet.y /TILE_SIZE) + map2D.length / 2;
        const col = Math.round(bullet.x /TILE_SIZE);

        if(map2D[row][col]){
        if(map2D[row][col].layer == 2){
            bullet.timeToLive = 0;
        }
    }

        // check if someone got shot
        for (const player of players) {
            const distance = Math.sqrt((player.x - bullet.x + 10) ** 2 + (player.y - bullet.y + 10) ** 2);
            if (distance < 8 && bullet.shooter !== player.id) { // player got shot
                player.health -= 30;
                if (player.health <= 0){
                    let randomIndex = Math.floor(Math.random() * spawn_points.length); // select a random spawn point
                    player.x = spawn_points[randomIndex][0];
                    player.y = spawn_points[randomIndex][1];
                    player.health = 100; // restore the health
                    const shooter = players.find((player) => player.id === bullet.shooter);
                    shooter.score += 1; // update the score after every kill
                }
                bullet.timeToLive = 0; // destroy bullet after it lands
            }
        }
    }

    io.emit("players", players); // send players to clients
    io.emit("bullets", bullets);
    io.emit("weapons", weapons); // send weapons to clients
}

const inputMap = {}; // empty object
let players = []; //keeps track of players
let bullets = [] //keeps track of bullets
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

        let randomIndex = Math.floor(Math.random() * spawn_points.length); // select a random spawn point
        players.push({
            id: socket.id,
            x: spawn_points[randomIndex][0],
            y: spawn_points[randomIndex][1],
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
                    timeToLive: 500 // bullets hit close target
                });
                waitTime = 1000;
            }
            else if (player.weapon === "rifle"){
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 1000 // bullets reach farther
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
                    timeToLive: 300 // you have to be realy close to land shots
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
    
    //httpServer.listen(5000);
    httpServer.listen(5000, () => {
        console.log('Server is running on http://0.0.0.0:5000');
    });    
    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta, map2D);
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}

main()
