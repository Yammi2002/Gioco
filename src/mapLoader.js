const tmx = require('tmx-parser');
const { Client } = require('pg');
const fs = require('fs');


// Configurazione del client PostgreSQL
const client = new Client({
    user: 'giammi',      
    database: 'mappe',
    password: 'giammi2002'   
});

/*client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack)); 

async function uploadMap() {
    await client.connect();

    const mapName = 'newmap.tmx';
    const mapData = fs.readFileSync(`./src/${mapName}`);

    const query = 'INSERT INTO maps (name, data) VALUES ($1, $2)';
    const values = [mapName, mapData];

    await client.query(query, values);

    await client.end();
}
    
uploadMap().catch(console.error); */

async function retrieveMapData(){
    try {
        await client.connect();
        console.log('Connected to the database successfully.');

        const query = 'SELECT data FROM maps WHERE name = $1';
        const values = ['newmap.tmx'];

        const res = await client.query(query, values);
        if (res.rows.length === 0) {
            throw new Error('Map not found in the database.');
        }

        const mapData = res.rows[0].data;
        console.log('Map data retrieved from the database.');
        return mapData;

    } catch (err) {
        console.error('Error occurred:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}
/*
async function loadMap() {
    const map = await new Promise((resolve, reject) =>{
        tmx.parseFile("./src/newmap.tmx", function(err, loadedMap) {
            if (err) return reject(err);
            resolve(loadedMap);
        }); //load the map
    });

    const map2D = [];
    
    for (let layerIndex = 0; layerIndex < map.layers.length; layerIndex++) {
        for (let layerIndex = 0; layerIndex < map.layers.length; layerIndex++) {
            const layer = map.layers[layerIndex];
            const tiles = layer.tiles;
        
            for (let row = 0; row < map.height; row++) {
                const tileRow = [];
                for (let col = 0; col < map.width; col++) {
                    const tileIndex = row * map.width + col;
                    const tile = tiles[tileIndex];
                    
                    if (layerIndex === 0 || (layerIndex === 1 && tile) || (layerIndex === 3 && tile)) {
                        tileRow.push({ id: tile.id, gid: tile.gid, layer: layerIndex, collide: false });
                    } else if (layerIndex === 2 && tile){
                        tileRow.push({ id: tile.id, gid: tile.gid, layer: layerIndex, collide: true });
                    } else {
                        tileRow.push(null);
                    }
                }
                map2D.push(tileRow);
            }
        }
    return map2D;
}
}
*/

const path = require('path');

async function loadMap() {
    try {
        // Ottieni i dati della mappa dal database
        const mapData = await retrieveMapData();

        // Salva i dati della mappa in un file temporaneo
        const tempMapFilePath = path.join(__dirname, 'tempMap.tmx');
        await new Promise((resolve, reject) => {
            fs.writeFile(tempMapFilePath, mapData, 'utf8', (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Carica la mappa usando il percorso del file temporaneo
        const map = await new Promise((resolve, reject) =>{
            tmx.parseFile(tempMapFilePath, function(err, loadedMap) {
                // Elimina il file temporaneo dopo aver caricato la mappa
                fs.unlink(tempMapFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting temporary map file:', unlinkErr);
                });

                if (err) return reject(err);
                resolve(loadedMap);
            });
        });

        const map2D = [];

        for (let layerIndex = 0; layerIndex < map.layers.length; layerIndex++) {
            const layer = map.layers[layerIndex];
            const tiles = layer.tiles;
        
            for (let row = 0; row < map.height; row++) {
                const tileRow = [];
                for (let col = 0; col < map.width; col++) {
                    const tileIndex = row * map.width + col;
                    const tile = tiles[tileIndex];
                    
                    if (layerIndex === 0 || (layerIndex === 1 && tile) || (layerIndex === 3 && tile)) {
                        tileRow.push({ id: tile.id, gid: tile.gid, layer: layerIndex, collide: false });
                    } else if (layerIndex === 2 && tile){
                        tileRow.push({ id: tile.id, gid: tile.gid, layer: layerIndex, collide: true });
                    } else {
                        tileRow.push(null);
                    }
                }
                map2D.push(tileRow);
            }
        }

        // Restituisci la mappa caricata come array 2D
        return map2D;
        
    } catch (err) {
        console.error('Error occurred while loading the map:', err);
        throw err; // Rilancia l'errore per gestirlo all'esterno se necessario
    }
}




module.exports = loadMap;