const socket = io(`ws://localhost:5000`);

const mapImage = new Image();
mapImage.src = "./forest_.png"

const mapImage2 = new Image();
mapImage2.src = "./forest_ [resources].png";

const marioLeft = new Image();
marioLeft.src = "./mario(left).png";

const marioDown = new Image();
marioDown.src = "./mario(down).png";

const marioUp = new Image();
marioUp.src = "./mario(up).png";

const marioRight = new Image();
marioRight.src = "./mario(right).png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d"); //using this to render 

let map = [[]]; //initialize the mapp
let players = []; //keeps track of players
const TILE_SIZE = 16; //pixels

socket.on("connect", () => {
    console.log("connected");
});

socket.on ("map", (loadedMap) => {
    map = loadedMap;
}); //set the map

socket.on("players", (serverPlayers) => {
    players = serverPlayers; 
}); //update players

const input = {
    "up": false,
    "down": false,
    "left": false,
    "right": false
}


window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        input["up"] = true;
    } else if (e.key === "s"){
        input["down"] = true;
    } else if (e.key === "d"){
        input["right"] = true;
    } else if (e.key === "a"){
        input["left"] = true;
    }
    socket.emit("input", input);
}); // check keyboard inputs and send to the server

window.addEventListener("keyup", (e) => {
    if (e.key === "w") {
        input["up"] = false;
    } else if (e.key === "s"){
        input["down"] = false;
    } else if (e.key === "d"){
        input["right"] = false;
    } else if (e.key === "a"){
        input["left"] = false;
    }
    socket.emit("input", input);
}); // check when inputs stop and send to the server

function loop() {
    canvas.clearRect (0, 0, canvas.width, canvas.height); //to update the canvas every frame
    const TILES_IN_ROW = 22; // tiles in image row
    const TILES_IN_ROW2 = 12;

    // drawing the lower leyer
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++){
            const tile = map[row][col];
            if (!tile) continue;
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE,
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }
    
    // darwing the upper layer
    for (let row = 50; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++){
            const tile = map[row][col];
            if (!tile) continue; // when the tile is empty
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW2);
            const imageCol = id % TILES_IN_ROW2;
            canvas.drawImage(
                mapImage2,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE,
                (row-50) * TILE_SIZE, // correct the index in order to have the layer on the other
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }

    for (const player of players) {
        let playerImage;
        switch (player.orientation) {
            case "up":
                playerImage = marioUp;
                break;
            case "down":
                playerImage = marioDown;
                break;
            case "left":
                playerImage = marioLeft;
                break;
            case "right":
                playerImage = marioRight;
                break;
            default:
                playerImage = marioDown; // Imposta un'immagine predefinita nel caso in cui l'orientamento non sia valido
                break;
        }
        canvas.drawImage(playerImage, player.x, player.y); // draw players on the canvas
    }
    
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);