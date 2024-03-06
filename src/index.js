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

function tick(delta) {
    for (const player of players) { //loops players
        const inputs = inputMap[player.id]; //checks players input

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

        if(inputs.right){
            player.x += SPEED;
            player.orientation = "right";
            player.inMovement = true;
        } else if(inputs.left){
            player.x -= SPEED;
            player.orientation = "left";
            player.inMovement = true;
        }

        if(!inputs.right && !inputs.left && !inputs.up && !inputs.down){
            player.inMovement = false;
        }


        for(const weapon of weapons){
            console.log(weapon.x, weapon.y);
            console.log(player.x, player.y);
            if((player.x >= weapon.x -100 && player.x == weapon.x + 100) && (player.y >= weapon.y -100 && player.y == weapon.y + 100)){
                player.weapon = weapon.type;
                const weaponToRemove = weapons.find((weapon) => weapon.x === player.x && weapon.y === player.y);
                weapons = weapons.filter(weapon => weapon !== weaponToRemove);
                console.log("rimossa", weaponToRemove);
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
            weapon: "pistol"  // default weapon
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
                type
            });
        });

        socket.on("bullets", (angle) => {
            const player = players.find((player) => player.id === socket.id);
            if (player.weapon === "pistol") {
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 200
                });
            }
            else if (player.weapon === "rifle"){
                bullets.push({
                    angle,
                    x: player.x,
                    y: player.y + 8, // spawn bullets in th right place
                    shooter: socket.id,
                    timeToLive: 500
                });  
            }
        });
    }); 
    
    app.use(express.static("public"));
    
    httpServer.listen(5000);
    
    let lastUpdate = Date.now();
    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
    }, 1000 / TICK_RATE);
}

main()
