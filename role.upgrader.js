/* Upgrader drone */
module.exports.role = 'upgrader';
/* sType */
module.exports.sType = 'normal';
/* Costs */
module.exports.cost = {
    1 : 300,
    2 : 550,
    3 : 800,
    4 : 1300,
    5 : 1300,
    6 : 1300,
    7 : 1300,
    8 : 1300,
}
/* Body Parts at each RCL */
module.exports.body = {
    1 : [
        WORK,WORK,
        MOVE,
        CARRY
    ],
    2 : [
        WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE
    ],
    3 : [
        WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE,MOVE,MOVE
    ],
    4 : [
        WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE
    ],
    5 : [
        WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE
    ],
    6 : [
        WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE
    ],
    7 : [
        WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE
    ],
    8 : [
        WORK,WORK,WORK,WORK,WORK,
        WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,
        MOVE,MOVE,MOVE,MOVE
    ],
}
/* Spawn Roster */
module.exports.roster = {
    1: 2,
    2: 4,
    3: 4,
    4: 3,
    5: 3,
    6: 3,
    7: 2,
    8: 1,
}
module.exports.enabled = function (room, debug = false) {
    var _room = Game.rooms[room];
    // Turn off normal upgraders while supergraders are on
    if (_room.memory.roles['supergrader'] == true) {
        return false;
    }
    return true;
}
/**
 * Big Harvester Role
 */
module.exports.run = function(creep) {
    if (creep.spawning) { return; }
    if (creep.fatigue > 0) {
        creep.say('Zzz');
        return;
    }

    // If supergrader is enabled, switch to it, no need for upgraders while supergraders are on
    if (creep.room.memory.roles['supergrader'] == true) {
        creep.memory.role = 'supergrader';
        return;
    }

    // If we have only a few ticks to live, swap it to harvest mode so it seeks home
    var ticks = creep.ticksToLive;
    if (ticks < 100) {
        creep.say('!!');
        creep.memory.dying = true;
    }

    // if (creep.room.memory.emergency) {
    //     delete creep.memory.upgrading;
    //     delete creep.memory.idle;
    //     creep.memory.role = 'harvester';
    //     return
    // }

    if(creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
        creep.say('GET');
    }
    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
        creep.say('PUT');
    }

    if(creep.memory.upgrading) {
        // if (Game.rooms[creep.memory.roomName].controller.sign != 'Room Claimed by Subodai - [Ypsilon Pact]') {
        //     if (creep.pos.getRangeTo(Game.rooms[creep.memory.roomName].controller) > 1) {
        //         creep.moveTo(Game.rooms[creep.memory.roomName].controller);
        //         return;
        //     } else {
        //         creep.signController(creep.room.controller, 'Room Claimed by Subodai - [Ypsilon Pact]');
        //         return;
        //     }
        // }
        if(creep.upgradeController(Game.rooms[creep.memory.roomName].controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(Game.rooms[creep.memory.roomName].controller, {
                visualizePathStyle: {
                    stroke: global.colourUpgrade,
                    opacity: global.pathOpacity
                }
            });
        } else {
            creep.say('(>.<)');
        }
    } else {
        if (creep.getNearbyEnergy(true) == ERR_FULL) {
            delete creep.memory.energyPickup;
            creep.memory.upgrading = true;
            return;
        }
    }
}
