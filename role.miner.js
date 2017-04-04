/* Specialist Miner Drone */
module.exports.role = 'miner';

/* SType */
module.exports.sType = 'specialist';

/* Parts *//* ANY MORE THAN 5 WORKS WON'T LET THE SOURCE REGENERATE */
module.exports.parts = [WORK,WORK,WORK,WORK,WORK,MOVE];

/* Energy Cost */
module.exports.energyCost = 550;

/* Run method */
module.exports.run = function (creep, debug = false) {
    // Fatigue Check
    if (creep.fatigue > 0) {
        if (debug) { console.log('Creep[' + creep.name + '] Fatgiued ' + creep.fatigue); }
        creep.say('💤');
        return;
    }

    // Okay, health check
    var ticks = creep.ticksToLive;
    if (ticks <= 100 && !creep.memory.dying) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner Dying Making sure we spawn a new one'); }
        // set dying to true and set the sourceId to null in room memory
        creep.memory.dying = true;
        var sourceId = creep.memory.assignedSource;
        creep.room.memory.assignedSources[sourceId] = null;
    }

    // Alright if it's dying, output the timer
    if (creep.memory.dying) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner Dying, ticking down'); }
        creep.say('🕛 ' + ticks);
        // If it's less than 10 ticks, drop what we have
        if (ticks < 10) {
            if (debug) { console.log('Creep[' + creep.name + '] Miner about to die'); }
            creep.say('☠️ ' + ticks);
        }
    }

    // Only do this if we don't have an assigned Source
    if (!creep.memory.assignedSource) {
        if (debug) { console.log('Creep[' + creep.name + '] Miner without assigned Source, assigning'); }
        // Okay lets get the room memory for assigned sources
        var sourceId = false;
        var sources = creep.room.find(FIND_SOURCES);
        var assigned = creep.room.memory.assignedSources;
        // Can't loop through sources to just to an i = loop to get them
        for (var i=0;i<=sources.length-1;i++) {
            var source = sources[i];
            if (assigned[source.id] == null) {
                sourceId = source.id;
                creep.room.memory.assignedSources[sourceId] = creep.name;
                creep.memory.assignedSource = sourceId;
            }
        }
        // Do we have a sourceId?
        if (sourceId == false) {
            if (debug) { console.log('Creep[' + creep.name + '] Miner cannot find source!!'); }
            creep.say('WTF?');
            Game.notify('Miner Creep unable to assign a source');
        }
    }

    // Are we full?
    if (creep.energy == creep.carryCapacity) {
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
        creep.say('⛹️');

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
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                if (debug) { console.log('Creep[' + creep.name + '] Miner not in range, moving into range'); }
                // We're not at the thing! Lets go there!
                creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#ff5555',
                        opacity: .5
                    },
                    reusePath:5
                });
                // Moving make a say
                creep.say('▶️')
            } else {
                // Mining say we're mining
                if (!creep.memory.dying) {
                    creep.say('⛏️');
                }
            }
        } else {
            if (debug) { console.log('Creep[' + creep.name + '] Miner cannot find source!!'); }
            creep.say('WTF?');
            Game.notify('Miner Creep unable to assign a source');
        }
    }
}