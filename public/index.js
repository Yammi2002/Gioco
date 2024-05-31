const socket = io(`ws://10.161.1.2:5000`); //to be filled with serverPC ip address

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


const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d"); //using this to render 

let map2D = [[]]; //initialize the mapp
let players = []; //keeps track of players
let bullets = []; //keeps track of bullets
let weapons = []; //keeps track of weapons on screen
let powerup = []; //keeps track of power ups on screen

const weaponImages = {
    rifle: new Image(),
    shotgun: new Image(),
    sniper: new Image(),
    pistol: new Image(),
    // Aggiungi qui tutte le altre immagini delle armi
};

weaponImages.rifle.src = "./images/rifle.png"

weaponImages.shotgun.src = "./images/shotgun.png"

weaponImages.sniper.src = "./images/sniper.png"

weaponImages.pistol.src = "./images/pistol.png"

const puImages = {
    health: new Image(),
    speed: new Image(),
};

puImages.health.src = "./images/32heart.png"
puImages.speed.src = "./images/32potion.png"


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
    bullets = serverBullets;
});

socket.on("weapons", (serverWeapons) => {
    weapons = serverWeapons;
}); //update weapons on screen

socket.on("powerups", (serverPu) => {
    powerup = serverPu;
}); 

socket.on("death", () => {
    let deathSound = new Audio("./audios/death.mp3");
    deathSound.volume = 0.2;
    deathSound.currentTime = 0;
    deathSound.play();
});

socket.on("speed", () => {
    let speedSound = new Audio('./audios/speed.mp3');
    speedSound.currentTime = 0;
    speedSound.volume = 1.5;
    speedSound.play();
});

socket.on("health", () => {
    let healthSound = new Audio('./audios/health.mp3');
    healthSound.currentTime = 0;
    healthSound.volume = 0.3;
    healthSound.play();
});

socket.on("gun_pickup", () => {
    let gunPickupSound = new Audio('./audios/gun.mp3');
    gunPickupSound.currentTime = 0;
    gunPickupSound.volume = 0.8;
    gunPickupSound.play();
});

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

function handleInteraction(e) {
    //let mySound = new Audio('./audios/Donkey Kong Country Returns.mp3');
    //mySound.loop = true;
    //ySound.play();
}

const events = ['click', 'keydown', 'mousemove', 'touchstart', 'mousedown'];

events.forEach(event => {
    window.addEventListener(event, handleInteraction, {once: true});
}); // add soundtrack as soon as an interaction happens

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

let border1 = false;
let border2 = false;
let border3 = false;
let border4 = false;
let cameraSaveX = 0;
let cameraSaveY = 0;

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
        // block the camera at borders
        //LEFT BORDER
        if (player_tile_x <= 25) {
            if (player_tile_x == 25) {
                cameraSaveX = cameraX;
            }
            player_tile_x = 25;
            cameraX = cameraSaveX;
        } else if (player_tile_x >= 76) {
            //RIGHT BORDER
            if (player_tile_x == 76) {
                cameraSaveX = cameraX;
            }
            player_tile_x = 76;
            cameraX = cameraSaveX;
        }

        //UP BORDER
        if (player_tile_y <= 12) {
            if (player_tile_y == 12) {
                cameraSaveY = cameraY;
            }
            player_tile_y = 12;
            cameraY = cameraSaveY;
        } else if (player_tile_y >= 87) {
            //DOWN BORDER
            if (player_tile_y == 87) {
                cameraSaveY = cameraY;
            }
            player_tile_y = 87;
            cameraY = cameraSaveY;
        }
    }
    const TILES_IN_ROW_GROUND = 10; // tiles in image row
    const TILES_IN_ROW_STREETS = 4;
    const TILES_IN_ROW_COLLISION = 28;
    const TILES_IN_ROW_DECOR = 19;

    // ground

    for (let row = Math.max(0, player_tile_y - 15); row < Math.min(map2D.length, player_tile_y + 15); row++) {
        for (let col = Math.max(0, player_tile_x - 30); col < Math.min(map2D[row].length, player_tile_x + 30); col++) {
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
                TILE_SIZE
            );
        }
    }
    
    
    // drawing the street layer
    for (let row = Math.max(map2D.length/4, (map2D.length/4) + player_tile_y - 15); row < Math.min(map2D.length/2, (map2D.length/4) + player_tile_y + 15); row++) {
        for (let col = Math.max(0, player_tile_x - 30); col < Math.min(map2D[0].length, player_tile_x + 30); col++) {
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
    for (let row = Math.max(map2D.length*0.75, (map2D.length*0.75) + player_tile_y - 15); row < Math.min( map2D.length, (map2D.length*0.75) + player_tile_y + 15); row++) {
        for (let col = Math.max(0, player_tile_x - 30); col < Math.min(map2D[0].length, player_tile_x + 30); col++) {
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
                    playerImage = marioLeft;
                } else {
                    playerImage = marioLeft2;
                }
                break;
            case "right":
                if (alternateImage && player.inMovement) {
                    playerImage = marioRight;
                } else {
                    playerImage = marioRight2;
                }
                break;
            default:
                playerImage = marioDown; // default image when the orientation cannot be determined
                break;
        }
        canvas.drawImage(playerImage, player.x - cameraX, player.y - cameraY); // draw players on the canvas
    }
        
    // drawing the collision_objects layer
    for (let row = Math.max( map2D.length/2, ( map2D.length/2) + player_tile_y - 15); row < Math.min(map2D.length*0.75, ( map2D.length/2) + player_tile_y + 15); row++) {
        for (let col = Math.max(0, player_tile_x - 30); col < Math.min(map2D[0].length, player_tile_x + 30); col++) {
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
    timer++;

    if (myPlayer) { //hud
        darwHealtbar(myPlayer, cameraX, cameraY, timer);

        canvas.fillStyle = 'white';
        canvas.fillRect(canvasEl.width - 100, canvasEl.height -200, 70, 23);
        canvas.fillRect(canvasEl.width - 100, canvasEl.height -220, 70, 20);

        
        // Imposta il colore del bordo a nero
        canvas.strokeStyle = 'black';
        // Disegna il bordo del rettangolo
        canvas.strokeRect(canvasEl.width - 100, canvasEl.height -200, 70, 23);
        canvas.strokeRect(canvasEl.width - 100, canvasEl.height -220, 70, 20);
        canvas.fillStyle = 'black'; 
        canvas.font = "15px Calibri"
        canvas.fillText(myPlayer.score + " Kills", canvasEl.width - 83, canvasEl.height - 205); // show the number of kills on screen

        let playerWeapon = weaponImages[myPlayer.weapon];
        canvas.drawImage(playerWeapon, canvasEl.width -70 - playerWeapon.width / 2,canvasEl.height - 208 + playerWeapon.height / 2);
    }

    for (const bullet of bullets) {

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
    };

    for (const weapon of weapons) {
        // Ottieni l'immagine dell'arma usando l'oggetto weaponImages
        let weaponImage = weaponImages[weapon.type];
    
        // Disegna l'immagine dell'arma sulla canvas
        canvas.drawImage(weaponImage, weapon.x - cameraX, weapon.y - cameraY);
    }    

    for (const pu of powerup) {
        // Ottieni l'immagine dell'arma usando l'oggetto weaponImages
        let puImage = puImages[pu.type];
    
        // Disegna l'immagine dell'arma sulla canvas
        canvas.drawImage(puImage, pu.x - cameraX, pu.y - cameraY);
    }    
    window.requestAnimationFrame(loop);
}  
window.requestAnimationFrame(loop);