const socket = io(`ws://localhost:5000`);

// load images
const mapImage = new Image();
mapImage.src = "./images/ground.png"

const mapImage2 = new Image();
mapImage2.src = "./images/streets.png";

const mapImage3 = new Image();
mapImage3.src = "./images/collision_obj_templates.png";

const mapImage4 = new Image();
mapImage4.src = "./images/ground_decor.png";

const marioLeft = new Image();
marioLeft.src = "./images/mario(left).png";

const marioLeft2 = new Image();
marioLeft2.src = "./images/mario(left2).png";

const marioDown = new Image();
marioDown.src = "./images/mario(down).png";

const marioDown1 = new Image();
marioDown1.src = "./images/mario(down1).png";

const marioDown2 = new Image();
marioDown2.src = "./images/mario(down2).png";

const marioUp = new Image();
marioUp.src = "./images/mario(up).png";

const marioUp1 = new Image();
marioUp1.src = "./images/mario(up1).png";

const marioUp2 = new Image();
marioUp2.src = "./images/mario(up2).png";

const marioRight = new Image();
marioRight.src = "./images/mario(right).png";

const marioRight2 = new Image();
marioRight2.src = "./images/mario(right2).png";

const bulletImage = new Image();
bulletImage.src = "./images/bullet.png"

const rifleImage = new Image();
rifleImage.src = "./images/rifle.png"

const shotgunImage = new Image();
shotgunImage.src = "./images/shotgun.png"

const sniperImage = new Image();
sniperImage.src = "./images/sniper.png"

const pistolImage = new Image();
pistolImage.src = "./images/pistol.png"

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d"); //using this to render 

let map2D = [[]]; //initialize the mapp
let players = []; //keeps track of players
let bullets = new Map();
let weapons = []; //keeps track of weapons on screen
let possibleWeapons = ["shotgun", "rifle", "pistol", "sniper"]; // all weapons that can spawn
const TILE_SIZE = 32; //pixels
let timer = 1;
let alternateImage = false;

socket.on("connect", () => {
    console.log("connected");
});

socket.on("map", (loadedMap) => {
    map2D = loadedMap;
}); //set the map

socket.on("players", (serverPlayers) => {
    players = serverPlayers;
}); //update players

socket.on("bullets", (serverBullets) => {
    bullets = new Map(JSON.parse(serverBullets));}
);

socket.on("weapons", (serverWeapons) => {
    weapons = serverWeapons;
}); //update weapons on screen

const input = {
    "up": false,
    "down": false,
    "left": false,
    "right": false
} // defines all inputs available

window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        input["up"] = true;
    } else if (e.key === "s") {
        input["down"] = true;
    } else if (e.key === "d") {
        input["right"] = true;
    } else if (e.key === "a") {
        input["left"] = true;
    }
    socket.emit("input", input);
}); // check keyboard inputs and send to the server

window.addEventListener("keyup", (e) => {
    if (e.key === "w") {
        input["up"] = false;
    } else if (e.key === "s") {
        input["down"] = false;
    } else if (e.key === "d") {
        input["right"] = false;
    } else if (e.key === "a") {
        input["left"] = false;
    }
    socket.emit("input", input);
}); // check when inputs stop and send to the server

window.addEventListener("click", (e) => {
    const angle = Math.atan2(
        e.clientY - canvasEl.height / 2,
        e.clientX - canvasEl.width / 2
    );
    socket.emit("bullets", angle);
}); // check when the player clicks and send to the server

function darwHealtbar(player, cameraX, cameraY) {
    const barWidth = 20; // Larghezza della barra
    const barHeight = 3; // Altezza della barra
    const maxHealth = 100; // Salute massima del giocatore

    // Calcola la lunghezza della barra in base alla salute attuale del giocatore
    const filledWidth = (player.health / maxHealth) * barWidth;

    // barra bianca in sottofondo
    canvas.fillStyle = "white";
    canvas.fillRect(player.x - cameraX - 4.5, player.y - cameraY - 4, filledWidth + 3, barHeight + 2);

    if (player.health > 50) {
        canvas.fillStyle = "green"; // Colore verde per la salute alta
    } else if (player.health > 20) {
        canvas.fillStyle = "yellow"; // Colore giallo per la salute media
    } else {
        canvas.fillStyle = "red"; // Colore rosso per la salute bassa
    }
    canvas.fillRect(player.x - cameraX - 3, player.y - cameraY - 3, filledWidth, barHeight);
} // draws the health bar


function loop() {

    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height); // to update the canvas every frame

    const myPlayer = players.find((player) => player.id === socket.id); // find current player

    // camera settings
    let cameraX = 0;
    let cameraY = 0;
    let player_tile_x = 10;
    let player_tile_y = 10;
    if (myPlayer) {
        cameraX = myPlayer.x - canvasEl.width / 2;
        cameraY = myPlayer.y - canvasEl.height / 2;
        player_tile_x = Math.floor(myPlayer.x / TILE_SIZE);
        player_tile_y = Math.floor(myPlayer.y / TILE_SIZE);
        if(player_tile_y < 10) player_tile_y = 10;
    }
    const TILES_IN_ROW_GROUND = 10; // tiles in image row
    const TILES_IN_ROW_STREETS = 4;
    const TILES_IN_ROW_COLLISION = 28;
    const TILES_IN_ROW_DECOR = 19;

     // drawing the ground layer    
     for (let row = player_tile_y - 10; row < map2D.length/4 - player_tile_y - 10; row++) {
        for (let col = player_tile_x -15; col < player_tile_x +15; col++){
            const tile = map2D[row][col];
            if (!tile) continue;
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW_GROUND);
            const imageCol = id % TILES_IN_ROW_GROUND;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }
    
    // drawing the street layer
    for (let row = map2D.length/4; row < map2D.length/2; row++) {
        for (let col = 0; col < map2D[0].length; col++){
            const tile = map2D[row][col];
            if (!tile) continue; // when the tile is empty
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW_STREETS);
            const imageCol = id % TILES_IN_ROW_STREETS;
            canvas.drawImage(
                mapImage2,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                (row-map2D.length/4) * TILE_SIZE - cameraY, // correct the index in order to have the layer on the other
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }

    // drawing the ground_decor layer
    for (let row = map2D.length*0.75; row < map2D.length; row++) {
        for (let col = 0; col < map2D[0].length; col++){
            const tile = map2D[row][col];
            if (!tile) continue; // when the tile is empty
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW_DECOR);
            const imageCol = id % TILES_IN_ROW_DECOR;
            canvas.drawImage(
                mapImage4,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                (row-map2D.length*0.75) * TILE_SIZE - cameraY, // correct the index in order to have the layer on the other
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }

    for (const player of players) {

        // chose proper image
        let playerImage;
        switch (player.orientation) {
            case "up":
                if (alternateImage && player.inMovement) {
                    playerImage = marioUp1;
                } else if (!(player.inMovement)) {
                    playerImage = marioUp;
                } else {
                    playerImage = marioUp2;
                }
                break;
            case "down":
                if (alternateImage && player.inMovement) {
                    playerImage = marioDown1;
                } else if (!(player.inMovement)) {
                    playerImage = marioDown;
                } else {
                    playerImage = marioDown2;
                }
                break;
            case "left":
                if (alternateImage && player.inMovement) {
                    playerImage = marioLeft2;
                } else {
                    playerImage = marioLeft;
                }
                break;
            case "right":
                if (alternateImage && player.inMovement) {
                    playerImage = marioRight2;
                } else {
                    playerImage = marioRight;
                }
                break;
            default:
                playerImage = marioDown; // default image when the orientation cannot be determined
                break;
        }
        canvas.drawImage(playerImage, player.x - cameraX, player.y - cameraY); // draw players on the canvas
    }
        
    // drawing the collision_objects layer
    for (let row = map2D.length/2; row < map2D.length*0.75; row++) {
        for (let col = 0; col < map2D[0].length; col++){
            const tile = map2D[row][col];
            if (!tile) continue; // when the tile is empty
            const { id } = tile;
            const imageRow = parseInt(id / TILES_IN_ROW_COLLISION);
            const imageCol = id % TILES_IN_ROW_COLLISION;
            canvas.drawImage(
                mapImage3,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX - 8,
                (row-map2D.length/2) * TILE_SIZE - cameraY, // correct the index in order to have the layer on the other
                TILE_SIZE,
                TILE_SIZE,
                );
        }
    }

    //animation
    if (timer % 20 == 0) {
        alternateImage = !alternateImage;
    }

    // weapons spawn (need to add locations)
    if (timer % 1000 == 0) {
        const x = Math.floor(Math.random() * canvasEl.width);
        const y = Math.floor(Math.random() * canvasEl.height);
        const row = Math.round(x / TILE_SIZE);
        const col = Math.round(y / TILE_SIZE);
        if (map2D[row][col].layer != 2){
        const type = possibleWeapons[Math.floor(Math.random() * possibleWeapons.length)];
        socket.emit("weapons", x, y, type);
        }
    }

    timer++;
    if (myPlayer) {
        canvas.fillText(myPlayer.score + " Kills", canvasEl.width - 100, 100); // show the number of kills on screen
        darwHealtbar(myPlayer, cameraX, cameraY, timer);
    }

    bullets.forEach((bullet) => {

        // Salva lo stato corrente della canvas
        canvas.save();

        // Trasla la canvas al punto di origine dell'immagine ruotata
        canvas.translate(bullet.x - cameraX, bullet.y - cameraY);

        // Ruota la canvas sull'angolo desiderato (in radianti)
        canvas.rotate(bullet.angle);

        // Disegna l'immagine (che sarà ruotata)
        canvas.drawImage(bulletImage, -bulletImage.width / 2, -bulletImage.height / 2);

        // Ripristina lo stato precedente della canvas
        canvas.restore();
    });

    for (const weapon of weapons) {
        // choose weapon image
        let weaponImage;
        switch (weapon.type) {
            case "rifle":
                weaponImage = rifleImage;
                break;
            case "shotgun":
                weaponImage = shotgunImage;
                break;
            case "sniper":
                weaponImage = sniperImage;
                break;
            case "pistol":
                weaponImage = pistolImage;
        }

        canvas.drawImage(weaponImage, weapon.x - cameraX, weapon.y - cameraY);
    }
    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);