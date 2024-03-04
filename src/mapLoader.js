const tmx = require('tmx-parser');

async function loadMap() {
    const map = await new Promise((resolve, reject) =>{
        tmx.parseFile("./src/map.tmx", function(err, loadedMap) {
            if (err) return reject(err);
            resolve(loadedMap);
        }); //load the map in asyncronous way(?) 
    });

    const map2D = [];
    
    for (let layerIndex = 0; layerIndex < map.layers.length; layerIndex++) {
        const layer = map.layers[layerIndex];
        const tiles = layer.tiles;
    
        const tileRow = [];
        for (let layerIndex = 0; layerIndex < map.layers.length; layerIndex++) {
            const layer = map.layers[layerIndex];
            const tiles = layer.tiles;
        
            for (let row = 0; row < map.height; row++) {
                const tileRow = [];
                for (let col = 0; col < map.width; col++) {
                    const tileIndex = row * map.width + col;
                    const tile = tiles[tileIndex];
                    
                    if (layerIndex === 0 || (layerIndex === 1 && tile)) {
                        tileRow.push({ id: tile.id, gid: tile.gid, layer: layerIndex });
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
module.exports = loadMap;