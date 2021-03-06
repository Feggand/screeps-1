/* Specialist Miner Drone */
module.exports.role = 'scout';
/* SType */
module.exports.sType = 'specialist';
/* This role requires a flag to be set */
module.exports.flagRequirement = 'scout';
/* Spawn Roster */
module.exports.roster = {
    1: 0,
    2: 0,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
};
/* Costs */
module.exports.cost = {
    1 : 0,
    2 : 0,
    3 : 650,
    4 : 900,
    5 : 1550,
    6 : 1550,
    7 : 1550,
    8 : 1550,
};
/* Body Parts at each RCL */
module.exports.body = {
    1 : [],
    2 : [],
    3 : [
        MOVE,                 // 1 MOVE  = 50
        CLAIM                 // 1 CLAIM = 600
    ],
    4 : [
        MOVE,MOVE,MOVE,       // 3 MOVE = 150
        CLAIM,                // 1 CLAIM = 600
        CARRY,                // 1 CARRY = 50
        WORK                  // 1 WORK = 100
    ],
    5 : [
        MOVE,MOVE,MOVE,MOVE,  // 4 MOVE = 200
        CLAIM,CLAIM,          // 2 CLAIM = 1200
        CARRY,                // 1 CARRY = 50
        WORK                  // 1 WORK = 100
    ],
    6 : [
        MOVE,MOVE,MOVE,MOVE,  // 4 MOVE = 200
        CLAIM,CLAIM,          // 2 CLAIM = 1200
        CARRY,                // 1 CARRY = 50
        WORK                  // 1 WORK = 100
    ],
    7 : [
        MOVE,MOVE,MOVE,MOVE,  // 4 MOVE = 200
        CLAIM,CLAIM,          // 2 CLAIM = 1200
        CARRY,                // 1 CARRY = 50
        WORK                  // 1 WORK = 100
    ],
    8 : [
        MOVE,MOVE,MOVE,MOVE,  // 4 MOVE = 200
        CLAIM,CLAIM,          // 2 CLAIM = 1200
        CARRY,                // 1 CARRY = 50
        WORK                  // 1 WORK = 100
    ],
};


module.exports.enabled = function (room, debug = false) {
    // Get all reserve flags without an assigned creep
    var flags = _.filter(Game.flags, (flag) => flag.color === global.flagColor['claim'] && !flag.memory.assignedCreep);
    // If we don't have any return a false
    return (flags.length > 0);
}

module.exports.expiry = 300;

/* Okay, lets code the creep */
module.exports.run = function (creep, debug = false) {
    // First, have we been assigned a flag?
    if (!creep.memory.flagName) {
        // Lets find a flag without a creep assigned
        var flags = _.filter(Game.flags, (flag) => flag.color === global.flagColor['claim'] && !flag.memory.assignedCreep);
        // If we found any
        if (flags.length > 0) {
            // Get the first one
            var flag = flags[0];
            flag.memory.assignedCreep = creep.id;
            creep.memory.flagName = flag.name;
            creep.memory.roomName = flag.pos.roomName;
        } else {
            console.log('Something went wrong, ' + this.role + ' creep ' + creep.name + ' cannot find a valid flag');
            return;
        }
    }
    if (creep.isTired()) { return; }
    // If ticks is less than our expiry time, set creep to dying
    if (!creep.memory.dying && creep.ticksToLive <= this.expiry) {
        // Creep is dying, flag for a replacement
        creep.memory.dying = true;
        var flag = Game.flags[creep.memory.flagName];
        delete flag.memory.assignedCreep;
    }
    // Alright, did we already make it to the room with the flag?
    if (!creep.memory.arrived) {
        // We didn't, alright lets go get the flag's position and head to it!
        var flag = Game.flags[creep.memory.flagName];
        if (!flag) { creep.memory.role = 'upgrader'; return; }
        // If our POS is not the flags
        if (creep.pos.roomName === flag.pos.roomName) {
            // We have arrived!
            creep.memory.arrived = true;
        } else {
            var result = creep.travelTo(flag);
            return;
        }
    }

    // Have we arrived?
    if (creep.memory.arrived) {
        var flag = Game.flags[creep.memory.flagName];
        if (flag) { flag.remove(); }
        // Get the controller of the room we're meant to be in
        if (creep.room.controller) {
            // Okay, attempt to run reserve on the controller
            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                // Move to the controller instead
                creep.travelTo(creep.room.controller);
            } else {
                creep.signController(creep.room.controller, 'Room Claimed by Subodai - [Ypsilon Pact]');
                creep.say('MINE');
                creep.memory.role = 'upgrader';
            }
        }
    }
}
