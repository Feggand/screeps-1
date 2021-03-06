// Role Name
module.exports.role = 'energyMiner';
// Roster
module.exports.roster = {
    1:2, 2:2, 3:2, 4:2, 5:2, 6:2, 7:2, 8:2,
};
// Body parts
module.exports.body = {
    1 : [ WORK,WORK,WORK,MOVE ],
    2 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    3 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    4 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    5 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    6 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    7 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
    8 : [ WORK,WORK,WORK,WORK,WORK,MOVE ],
};
// Is this role enabled?
module.exports.enabled = function (room, debug=false) {
    // If the room is not a room, make it a room
    if (!room instanceof Room) { room = Game.rooms[room]; }
    // If the controller is above level 1 and required miners
    if (room.controller && room.controller.level > 1 && room.memory.minersNeeded && room.memory.minersNeeded > 0) {
        // Get a list of creeps with this role in this room
        let list = _.filter(Game.creeps, (c) => c.memory.role === this.role && c.memory.roomName === room.name && !c.memory.dying);
        // If the list is less than what we need
        if (list.length < room.memory.minersNeeded) {
            // Return true
            return true;
        }
    }
    // Return false
    return false;
}
// Run it
module.exports.run = function (creep, debug=false) {
    // If Creep has no state, set to spawning
    if (!creep.state) { creep.state = STATE_SPAWNING; }
    // Switch based on state
    switch(creep.state) {
        // Spawning
        case STATE_SPAWNING:
            // Run the spawnRoutine
            creep.spawnRoutine(this.role);
            break;
        // Moving
        case STATE_MOVING:
            // Move to target
            creep.moveRoutine(STATE_MINING_ENERGY);
            break;
        // Mining energy
        case STATE_MINING_ENERGY:
            // Mining a source
            creep.energyMiningRoutine();
            break;
        default:
            console.log('[CREEP][' + creep.name + '][' + creep.memory.role + '] in an invalid state');
            delete this.memory.init;
            creep.state = STATE_SPAWNING;
            break;
    }
}

/**
 * Run this script to setup rooms ready for assigned miners
 */
module.exports.setup = function (debug = false) {
    // Loop through the game rooms we have
    for (var name in Game.rooms) {
        if (debug) { console.log('Setting up room ' + name); }
        var theRoom = Game.rooms[name];
        // Clear Assigned Sources
        delete theRoom.memory.assignedSources;
        // Get all the sources available
        var sources = theRoom.find(FIND_SOURCES);
        // Make sure we set the minersNeeded of the room
        theRoom.memory.minersNeeded = sources.length;
        // Make an array / object thing
        var array = {};
        // Loop through sources
        for (var i=0; i<=sources.length-1; i++) {
            if (debug) { console.log(sources[i].id); }
            // Set it to null
            array[sources[i].id] = null;
        }
        // Loop through the sources again
        for (var i=0; i<=sources.length-1; i++) {
            // Get the source so we can use it's id
            var source = sources[i];
            // Make found false by default
            var found = false;
            var creepId = null;
            var sourceId = source.id;
            // Loop through the miners
            for (var creepName in Game.creeps) {
                // Define the creep
                var creep = Game.creeps[creepName];
                if (!creep.memory.role === this.role || creep.memory.dying) {
                    continue;
                }
                // If this creep has the assigned Source, we found it
                if (creep.memory.assignedSource === sourceId) {
                    found = true;
                    creepId = creep.id;
                    break;
                }
            }
            // we found it
            if (found) {
                if (debug) { console.log(sourceId + ' set to ' + creepId); }
                array[sourceId] = creepId;
            }
        }

        // Set the room's assigned Sources to be the object
        theRoom.memory.assignedSources = array;
    }
    return '++Energy Miner Setup Complete++';
}
