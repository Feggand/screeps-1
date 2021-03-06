/* Specialist Miner Drone */
module.exports.role = 'miner';
/* SType */
module.exports.sType = 'specialist';
/* Spawn Roster */
module.exports.roster = {
    1: 2,
    2: 2,
    3: 2,
    4: 2,
    5: 2,
    6: 2,
    7: 2,
    8: 2,
};
/* Costs */
module.exports.cost = {
    1 : 350,
    2 : 550,
    3 : 550,
    4 : 550,
    5 : 550,
    6 : 550,
    7 : 550,
    8 : 550,
};
/* Body Parts at each RCL */
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

/**
 * Individual check for a room to check if this creep type should be enabled or not
 */
module.exports.enabled = function (room, debug = false) {
    var _room = Game.rooms[room];
    if (_room.controller && _room.controller.level > 1 && _room.memory.minersNeeded && _room.memory.minersNeeded > 0) {
        // Now count the creeps
        var list = _.filter(Game.creeps, (creep) => creep.memory.role === this.role && creep.memory.roomName === room && !creep.memory.dying);
        if (list.length < _room.memory.minersNeeded) {
            return true;
        }
    }
    return false;
}

// Set a time for this creep to 'expire' at
module.exports.expiry = 75;

/* Run method */
module.exports.run = function (creep, debug = false) {
    if (creep.isTired()) { return; }
    // Okay, health check
       if (!creep.memory.dying && creep.ticksToLive <= 150) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner Dying Making sure we spawn a new one'); }
        // set dying to true and set the sourceId to null in room memory
        creep.memory.dying = true;
        var sourceId = creep.memory.assignedSource;
        creep.room.memory.assignedSources[sourceId] = null;
    }

    // Alright if it's dying, output the timer
    if (creep.memory.dying) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner Dying, ticking down'); }
        creep.say(creep.ticksToLive);
        // If it's less than 10 creep.ticksToLive, drop what we have
        if (creep.ticksToLive < 10) {
            if (debug) { console.log('Creep[' + creep.name + '] Miner about to die'); }
            creep.say('!!' + creep.ticksToLive + '!!');
        }
    }

    // Only do this if we don't have an assigned Source
    if (!creep.memory.assignedSource) {
        this.setup();
        if (debug) { console.log('Creep[' + creep.name + '] Miner without assigned Source, assigning'); }
        // Okay lets get the room memory for assigned sources
        var sourceId = false;
        var sources = creep.room.find(FIND_SOURCES);
        var assigned = creep.room.memory.assignedSources;
        // Can't loop through sources to just to an i = loop to get them
        for (var i=0;i<=sources.length-1;i++) {
            var source = sources[i];
            if (assigned[source.id] === null) {
                sourceId = source.id;
                creep.room.memory.assignedSources[sourceId] = creep.id;
                creep.memory.assignedSource = sourceId;
                // Make sure we break out so we don't break the next source too
                break;
            }
        }
        // Do we have a sourceId?
        if (sourceId === false) {
            if (debug) { console.log('Creep[' + creep.name + '] Miner cannot find source!!'); }
            // Game.notify(Game.time + ' Miner Creep unable to assign a source');
        }
    }

    // Are we full?
    if (creep.energy === creep.carryCapacity) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner full, dropping!'); }
        creep.memory.dropping = true;
    } else {
        creep.memory.dropping = false;
    }

    // Are we dropping?
    if (creep.memory.dropping) {
        // This may need to change, depends if the drop costs fatigue or if dropping goes into a container
        console.log(creep.drop(RESOURCE_ENERGY));
        creep.memory.dropping = false;
        creep.say('V');

        // DANGER we just drop resources here... This could leave a pile of resources if our transfer dudes aren't keeping up

        // // This is just here incase it's needed fast (saves me writing it in a panic)
        // var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        //     filter: (i) => {
        //         return (i.structureType == STRUCTURE_CONTAINER) && (_.sum(i.store) < i.storeCapacity)
        //     }
        // });
        // if (container) {
        //     try {
        //         for (var resource in creep.carry) {
        //             creep.transfer(container, resource);
        //         }
        //     } catch (ERR_NOT_IN_RANGE) {
        //         if (debug) { console.log('Creep[' + creep.name + '] Miner cannot transfer resources'); }
        //     }
        // } else {
        //     creep.say('No Drop');
        //     if (debug) { console.log('Creep[' + creep.name + '] Miner unable to transfer resources is full!'); }
        // }
    }

    if (!creep.memory.dropping) {
        // Alright if we're not dropping, we're harvesting lets try harvesting our assigned source
        var source = Game.getObjectById(creep.memory.assignedSource);
        if (source) {
            // Okay we have a source, lets trying harvesting it!
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                if (debug) { console.log('Creep[' + creep.name + '] Miner not in range, moving into range'); }
                // We're not at the thing! Lets go there!
                creep.travelTo(source);
                // Moving make a say
                creep.say('>>')
            } else {
                // Mining say we're mining
                if (!creep.memory.dying) {
                    creep.say('d(^-^)b');
                }
            }
        } else {
            if (debug) { console.log('Creep[' + creep.name + '] Miner cannot find source!!'); }
            creep.say('WTF?');
            Game.notify(Game.time + ' Miner Creep unable to assign a source');
        }
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
                if (!creep.memory.role === 'miner' || creep.memory.dying) {
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
    return '++Miner Setup Complete++';
}
