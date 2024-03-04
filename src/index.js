const express = require('express');
const {createServer} = require('http');
const {Server} = require('socket.io')

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require('./mapLoader'); //call the module

const SPEED = 3; // how fast players move
const TICK_RATE = 60; //how fast do we want to refresh the server
function tick() {
    for (const player of players) { //loops players
        const inputs = inputMap[player.id]; //checks players input
        if(inputs.up){
            player.y -= SPEED;
            player.orientation = "up";
        } else if(inputs.down){
            player.y += SPEED;
            player.orientation = "down";
        }

        if(inputs.right){
            player.x += SPEED;
            player.orientation = "right";
        } else if(inputs.left){
            player.x -= SPEED;
            player.orientation = "left";
        }
    }

    io.emit("players", players); // send players to clients
}

const inputMap = {}; // empty object
let players = []; //keeps track of players

async function main(){

    const map2D = await loadMap(); //get the map
    io.on("connect", (socket) => { //check if someone connected
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
            orientation: "right"
        }); // store players

        socket.emit("map", map2D); // send the map to clients

        socket.on("input", (input) => {
            inputMap[socket.id] = input; 
        }); //store the input and the player

        socket.on("disconnect", () =>{
            players = players.filter((player) => player.id !== socket.id);
        }); // remove players from the array when they disconnect (and consequently from the map when the server sends it to clients)
    }); 
    
    app.use(express.static("public"));
    
    httpServer.listen(5000);
    
    setInterval(tick, 1000 / TICK_RATE);
}

main()
