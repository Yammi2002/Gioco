export const weaponImages = {
    rifle: new Image(),
    shotgun: new Image(),
    sniper: new Image(),
    pistol: new Image(),
    // Aggiungi qui tutte le altre immagini delle armi
};

weaponImages.rifle.src = "./images/rifle.png";

weaponImages.shotgun.src = "./images/shotgun.png";

weaponImages.sniper.src = "./images/sniper.png";

weaponImages.pistol.src = "./images/pistol.png";

export const puImages = {
    health: new Image(),
    speed: new Image(),
};

puImages.health.src = "./images/32heart.png";
puImages.speed.src = "./images/32potion.png";

export const marioImages = {
    marioLeft: new Image(),
    marioLeft2: new Image(),
    marioDown: new Image(),
    marioDown1: new Image(),
    marioDown2: new Image(),
    marioUp: new Image(),
    marioUp1: new Image(),
    marioUp2: new Image(),
    marioRight: new Image(),
    marioRight2: new Image()
}

marioImages.marioLeft.src = "./images/mario(left).png";
marioImages.marioLeft2.src = "./images/mario(left2).png";
marioImages.marioRight.src = "./images/mario(right).png";
marioImages.marioRight2.src = "./images/mario(right2).png";
marioImages.marioUp.src = "./images/mario(up).png";
marioImages.marioUp1.src = "./images/mario(up1).png";
marioImages.marioUp2.src = "./images/mario(up2).png";
marioImages.marioDown.src = "./images/mario(down).png";
marioImages.marioDown1.src = "./images/mario(down1).png";
marioImages.marioDown2.src = "./images/mario(down2).png";

export const mapImages = {
    mapImage: new Image(),
    mapImage2: new Image(),
    mapImage3: new Image(),
    mapImage4: new Image()
}

mapImages.mapImage.src = "./images/ground.png";
mapImages.mapImage2.src = "./images/streets.png";
mapImages.mapImage3.src = "./images/collision_obj_templates.png";
mapImages.mapImage4.src = "./images/ground_decor.png";

export const bulletImage = new Image();
bulletImage.src = "./images/bullet.png";
