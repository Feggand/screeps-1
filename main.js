'use strict';
// Requires
require('require');
console.log('[LOADED] Bootstrapping Screeps AI');
// DEFAULT
var runAI = function() {
    if (Game.cpu.bucket < 2 * Game.cpu.tickLimit) {
        console.log('Skipping tick ' + Game.time + ' due to lack of CPU');
        throw new Error('Bucket Drained');
        return;
    }

    try {

    } catch (e) {
        console.log('Exception', e);
        Game.notify('Exception', e);
    }
}

// const profiler = require('screeps-profiler');
// profiler.enable();
/**
 * Main game loop, call all other functions from here
 */
module.exports.loop = function () {
//profiler.wrap(function() { // Start of profiler wrapper
    var debug = false;
    // Only need these once every 10 ticks
    if (Game.time % 10 == 0) {
        cleaner.run(debug);
        if (feedEnabled) {
            counter.runRoomFeed();
        } else {
            counter.clearRoomFeed();
        }
    }
    // Run the source setups once every 50 ticks
    if (Game.time % 50 == 0) {
        var miner = require('role.energyMiner');
        var extractor = require('role.extractor');
        pause(52);
        miner.setup();
        pause(54);
        extractor.setup();
    }
    // Only need these once every 5 ticks
    if (Game.time % 5 == 0) {
        // Setup rooms before we run the spawner
        pause(60);
        counter.setupRoomRoles(debug);
        console.log(Game.time + ':CPU:{' + Game.cpu.tickLimit + '} ' + '{' +  Game.cpu.bucket + '}' + counter.run(debug) + ' {' + Game.cpu.getUsed().toFixed(3) + '}');
        let Before = Game.cpu.getUsed();
        pause(64);
        if (global.Queue.process()) { console.log('Queue spawned a creep'); } else { console.log('Running old spawner'); spawner.run(debug); }
        let After = Game.cpu.getUsed() - Before;
        console.log('Spawners used:' + After + ' CPU');
        pause(68);
        global.haulerSetup();
        pause(70);
    }
    pause(72);
    movement.run(debug);
    pause(74);
    towers.run(debug);
    pause(76);
    screepsplus.collect_stats();
    Memory.stats.cpu.used = Game.cpu.getUsed();
    pause(79);
    console.log(Game.time + ':CPU:{' + Game.cpu.tickLimit + '} ' + '{' +  Game.cpu.bucket + '} {' + Game.cpu.getUsed().toFixed(3) + '}');
//}); // End of profiler wrapper
}
