
// Change to true to enable debugging
const DBG = false;
/**
 * Find and collect nearby energy
 *
 * @param useStorage bool
 * @param emergency bool
 * @param options object
 */
Creep.prototype.getNearbyEnergy = function(useStorage = false, emergency = false, options = {}) {
    // First, are we full?
    if (_.sum(this.carry) == this.carryCapacity) {
        DBG && console.log('[' + this.name + '] Creep Full Cannot Get Nearby Energy');
        // Clear our pickup target
        delete this.memory.energyPickup;
        return ERR_FULL;
    }
    // Are we near a link with memory of receiver limit to only upgraders or supergraders, otherwise refillers become.. interesting
    if (!this.memory.energyPickup && (this.memory.role == 'upgrader' || this.memory.role == 'supergrader')) {
        DBG && console.log('[' + this.name + '] Checking for Links');
        // If we're in our own room, with our own controller, above level 5 (should have links)
        if (this.room.controller && this.room.controller.my && this.room.controller.level >= 5) {
            DBG && console.log('[' + this.name + '] Links available');
            // Lets find the nearest link with energy that has the right flag
            var links = this.room.find(FIND_STRUCTURES, {
                filter: (i) => i.structureType == STRUCTURE_LINK && i.memory.linkType == 'receiver' && i.energy > 0 && i.pos.inRangeTo(this,7)
            });
            if (links.length > 0) {
                DBG && console.log('[' + this.name + '] Found a link, using it');
                this.memory.energyPickup = links[0].id;
            }
        }
    }

    // Storage override
    if (!this.memory.energyPickup) {
        if (useStorage && this.room.terminal) {
            if (this.room.terminal.store[RESOURCE_ENERGY] > 0) {
                this.memory.energyPickup = this.room.terminal.id;
            }
        }

        if (!this.memory.energyPickup) {
            if (useStorage && this.room.storage) {
                if (this.room.storage.store[RESOURCE_ENERGY] > 1000) {
                    this.memory.energyPickup = this.room.storage.id;
                }
            }
        }
    }
    if (!this.memory.energyPickup) {
        DBG && console.log('[' + this.name + '] Creep has no memory, finding stuff to pickup');
        // If this is an emergency we should be going for the terminal, then storage
        if (emergency) {
            // TODO EMPTY TERMINAL AND STORAGE HERE PLEASE
        }
        // Get dropped resources in the room
        var resources = this.room.find(FIND_DROPPED_RESOURCES, {
            filter: (i) => i.resourceType == RESOURCE_ENERGY && i.amount > (this.carryCapacity - _.sum(this.carry))/4
        });
        // Get Containers in the room
        var containers = this.room.find(FIND_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_CONTAINER && i.store[RESOURCE_ENERGY] > (this.carryCapacity - _.sum(this.carry))/4
        });
        // False some things
        var resource = container = false;
        const thisCreep = this;
        // If we have resources
        if (resources.length > 0) {
            DBG && console.log('[' + this.name + '] Found ' + resources.length + ' resource piles');
            // Sort the resources
            resources.sort(function(a,b) {
                const aPerMove = a.amount / thisCreep.pos.getRangeTo(a);
                const bPerMove = b.amount / thisCreep.pos.getRangeTo(b);
                if (aPerMove > bPerMove) {
                    return -1;
                } else if (bPerMove > aPerMove) {
                    return 1;
                }
                return 0;
                // return (a.amount / thisCreep.pos.getRangeTo(a)) - (b.amoumt / thisCreep.pos.getRangeTo(b));
            });
            // Now get the nearest one
            var resource = resources[0];
        }
        // if we have containers
        if (containers.length > 0) {
            DBG && console.log('[' + this.name + '] Found ' + containers.length + ' containers');
            // Sort the containers
            containers.sort(function(a,b) {
                const aPerMove = a.store[RESOURCE_ENERGY] / thisCreep.pos.getRangeTo(a);
                const bPerMove = b.store[RESOURCE_ENERGY] / thisCreep.pos.getRangeTo(b);
                if (aPerMove > bPerMove) {
                    return -1;
                } else if (bPerMove > aPerMove) {
                    return 1;
                }
                return 0;
                // return thisCreep.pos.getRangeTo(a) - thisCreep.pos.getRangeTo(b);
            });
            var container = containers[0];
        }
        // If we have both we need to pick the closest one
        if (resource && container) {
            // If the resource is closer
            if (this.pos.getRangeTo(resource) < this.pos.getRangeTo(container)) {
                DBG && console.log('[' + this.name + '] Stored resource pile ' + resource.id + ' in creep memory');
                this.memory.energyPickup = resource.id;
            } else {
                DBG && console.log('[' + this.name + '] Stored container ' + container.id + ' in creep memory');
                this.memory.energyPickup = container.id;
            }
        } else if (resource) {
            DBG && console.log('[' + this.name + '] Stored resource pile ' + resource.id + ' in creep memory');
            this.memory.energyPickup = resource.id;
        } else if (container) {
            DBG && console.log('[' + this.name + '] Stored container ' + container.id + ' in creep memory');
            this.memory.energyPickup = container.id;
        }
        // Nothing found? lets try finding available sources
        if (!this.memory.energyPickup) {
            // Can this creep work?
            if (this.canWork()) {
                DBG && console.log('[' + this.name + '] Can work finding sources');
                const source = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE, {
                    filter: function (i) {
                        if (i.energy > 0 || i.ticksToRegeneration < 10) {
                            const space = thisCreep.findSpaceAtSource(i);
                            return space;
                        } else {
                            return false;
                        }
                    }
                });
                if (source) {
                    DBG && console.log('[' + this.name + '] Stored Source ' + container.id + ' in creep memory');
                    this.memory.energyPickup = source.id;
                }
            }
        }
    }
    // Do we have a target?
    if (this.memory.energyPickup) {
        DBG && console.log('[' + this.name + '] Found Energy source in creeps memory ' + this.memory.energyPickup);
        // We do! let's grab it
        const target = Game.getObjectById(this.memory.energyPickup);
        if (options == {}) {
            var options = {
                visualizePathStyle: {
                    stroke: global.colourPickupRes,
                    opacity: global.pathOpacity
                },
                reusePath:this.pos.getRangeTo(target) // Use the range to the object we're after as the reusePath opt
            };
        }
        var pickupSuccess = true;
        // Alright what is it?
        if (target instanceof Resource) { // Resource
            DBG && console.log('[' + this.name + '] Target is a Resource');
            // Is there still enough of it?
            if (target.amount < (this.carryCapacity - _.sum(this.carry))/4) {
                DBG && console.log('[' + this.name + '] Resource no longer viable clearing memory');
                // Target has gone, clear memory
                delete this.memory.energyPickup;
                return ERR_INVALID_TARGET;
            }
            // Only bother trying to pick up if we're within 1 range
            if (this.pos.inRangeTo(target,1)) {
                DBG && console.log('[' + this.name + '] Target should be in range, attempting pickup');
                // First attempt to pickitup
                if (this.pickup(target) == ERR_NOT_IN_RANGE) {
                    DBG && console.log('[' + this.name + '] Pickup failed');
                    var pickupSuccess = false;
                }
            } else {
                DBG && console.log('[' + this.name + '] Target not in range');
                var pickupSuccess = false;
            }

        } else if (target instanceof StructureContainer || target instanceof StructureStorage || target instanceof StructureTerminal) { // Container, Storage, Terminal
            DBG && console.log('[' + this.name + '] Target is a Container, Storage, or Terminal');
            // Check the container still has the energy
            if (target.store[RESOURCE_ENERGY] < (this.carryCapacity - _.sum(this.carry))/4) {
                DBG && console.log('[' + this.name + '] Target no longer has enough energy clearing memory');
                // Clear memory and return invalid target
                delete this.memory.energyPickup;
                return ERR_INVALID_TARGET;
            }
            // Only bother trying to pick up if we're within 1 range
            if (this.pos.inRangeTo(target,1)) {
                DBG && console.log('[' + this.name + '] Target should be in range, attempting withdraw');
                // Lets attempt to withdraw
                if (this.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    DBG && console.log('[' + this.name + '] Withdraw failed');
                    var pickupSuccess = false;
                }
            } else {
                DBG && console.log('[' + this.name + '] Target not in range');
                var pickupSuccess = false;
            }
        } else if (target instanceof StructureLink) { // Link
            DBG && console.log('[' + this.name + '] Target is a Link');
            // Check the container still has the energy
            if (target.energy == 0) {
                DBG && console.log('[' + this.name + '] Target no longer has enough energy clearing memory');
                // Clear memory and return invalid target
                delete this.memory.energyPickup;
                return ERR_INVALID_TARGET;
            }
            // Only bother trying to pick up if we're within 1 range
            if (this.pos.inRangeTo(target,1)) {
                DBG && console.log('[' + this.name + '] Target should be in range, attempting withdraw');
                // Lets attempt to withdraw
                if (this.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    DBG && console.log('[' + this.name + '] Withdraw failed');
                    var pickupSuccess = false;
                }
            } else {
                DBG && console.log('[' + this.name + '] Target not in range');
                var pickupSuccess = false;
            }
        } else if (target instanceof Source) { // Source
            // Does it still have energy ?
            if (target.energy == 0) {
                DBG && console.log('[' + this.name + '] Source no longer has energy, clearing memory');
                // no clear the memory
                delete this.memory.energyPickup;
                return ERR_INVALID_TARGET;
            }
            // Check for space
            if (!this.findSpaceAtSource(target)) {
                DBG && console.log('[' + this.name + '] Source no longer has space, clearing memory');
                // no clear the memory
                delete this.memory.energyPickup;
                return ERR_INVALID_TARGET;
            }
            // Only bother trying to pick up if we're within 1 range
            if (this.pos.inRangeTo(target,1)) {
                DBG && console.log('[' + this.name + '] Target should be in range, attempting harvest');
                // Alright lets try harvesting it
                if (this.harvest(target) == ERR_NOT_IN_RANGE) {
                    DBG && console.log('[' + this.name + '] Harvest failed');
                    var pickupSuccess = false;
                }
            } else {
                DBG && console.log('[' + this.name + '] Target not in range');
                var pickupSuccess = false;
            }
        } else {
            // Something went wrong, or what we wanted to pickup has disapeared...
            delete this.memory.energyPickup;
            return ERR_INVALID_TARGET;
        }
        // Did we successfully pick up the thing
        if (pickupSuccess) {
            DBG && console.log('[' + this.name + '] Successfully gathered resources');
            this.say(global.sayWithdraw);
            // Are we now full?
            if (this.carry.energy == this.carryCapacity) {
                DBG && console.log('[' + this.name + '] Creep is now full clearing pickup memory');
                // Alright we're full clear memory and return full
                delete this.memory.energyPickup;
                return ERR_FULL;
            }
            // Just return OK, we're not full yet
            return OK;
        } else {
            DBG && console.log('[' + this.name + '] Moving closer to target');
            // We probably need to move
            this.moveTo(target, options);
            // Say!
            this.say(global.sayMove);
            return OK;
        }
    }
}

Creep.prototype.deliverEnergy = function() {
    DBG && console.log('[' + this.name + '] Creep attempting to deliver energy');
    // First of all are we empty?
    if (_.sum(creep.carry) == 0) {
        delete this.memory.deliveryTarget;
        return ERR_NOT_ENOUGH_RESOURCES;
    }

    if (creep.carry.energy == 0) {

    }
}

Creep.prototype.canWork = function() {
    // Has this creep already been flagged as a worker? and at full health (if it's been hit we should check it's parts again)
    if (!this.memory.canWork && this.hits == this.hitsMax) {
        // If we got hit, clear the memory
        if (this.hits != this.hitsMax) { delete this.memory.canWork; }
        // Use the activeBodyparts method.. sigh
        if (this.getActiveBodyparts(WORK) > 0) {
            this.memory.canWork = 'yes';
        }
        // Is it set at this point?
        if (!this.memory.canWork) {
            // Set it to no
            this.memory.canWork = 'no';
        }
    }
    // Can this creep work?
    return this.memory.canWork == 'yes';
}

Creep.prototype.findSpaceAtSource = function(source) {
    if (source.id == '5982fecbb097071b4adc1835') {
        // this.DBG = true;
    }
    if (this.pos.getRangeTo(source) == 1) {
        this.DBG && console.log('We are already at the source');
        return true;
    }
    this.DBG && console.log('Checking for space at source ' + source.id);
    // return true;
    // Make sure to initialise the source's last check memory
    if (!source.memory.lastSpaceCheck) {
        source.memory.lastSpaceCheck = 0;
    }
    // If we checked the space this tick and there's no space left, we don't need to check again we just need to decrement the spaces
    if (source.memory.lastSpaceCheck == Game.time) {
        this.DBG && console.log('Last Check was this tick');
        if (source.memory.spaces == 0) {
            this.DBG && console.log('No more spaces');
            return false
        } else {

            // Decrement the spaces left
            source.memory.spaces = source.memory.spaces -1;
            this.DBG && console.log('Found a space there are ' + source.memory.spaces + ' spaces left');
            return true;
        }
    }

    this.DBG && console.log('First check for space at source');
    var spaces = 1;
    var n  = new RoomPosition(source.pos.x,   source.pos.y-1, source.pos.roomName);
    if (this.checkEmptyAtPos(n,  this)) { spaces++; }
    var ne = new RoomPosition(source.pos.x+1, source.pos.y-1, source.pos.roomName);
    if (this.checkEmptyAtPos(ne, this)) { spaces++; }
    var e  = new RoomPosition(source.pos.x+1, source.pos.y,   source.pos.roomName);
    if (this.checkEmptyAtPos(e,  this)) { spaces++; }
    var se = new RoomPosition(source.pos.x+1, source.pos.y+1, source.pos.roomName);
    if (this.checkEmptyAtPos(se, this)) { spaces++; }
    var s  = new RoomPosition(source.pos.x,   source.pos.y+1, source.pos.roomName);
    if (this.checkEmptyAtPos(s,  this)) { spaces++; }
    var sw = new RoomPosition(source.pos.x-1, source.pos.y+1, source.pos.roomName);
    if (this.checkEmptyAtPos(sw, this)) { spaces++; }
    var w  = new RoomPosition(source.pos.x-1, source.pos.y,   source.pos.roomName);
    if (this.checkEmptyAtPos(w,  this)) { spaces++; }
    var nw = new RoomPosition(source.pos.x-1, source.pos.y-1, source.pos.roomName);
    if (this.checkEmptyAtPos(nw, this)) { spaces++; }
    this.DBG && console.log('We found ' + spaces + ' Spaces at source ' + source.id);
    // Set our memory
    source.memory.lastSpaceCheck = Game.time;
    source.memory.spaces = spaces;
    // If it's 0 there's no space
    if (source.memory.spaces == 0) {
        return false;
    } else {
        // If it's not 0, there is a space, lets take one off our count and return true
        // Decrement the spaces left
        source.memory.spaces = source.memory.spaces -1;
        return true;
    }
}

Creep.prototype.checkEmptyAtPos = function(pos) {
    const terrain = Game.map.getTerrainAt(pos);
    if (terrain == 'wall') {
        this.DBG && console.log('wall found at ' + JSON.stringify(pos));
        return false;
    } else {
        let creeps = pos.lookFor(LOOK_CREEPS);
        if (creeps.length == 0) {
            this.DBG && console.log('Space found at ' + JSON.stringify(pos));
            return true;
        } else {
            // is this, the creep we're trying to find a space for
            if (creeps[0] == this) {
                this.DBG && console.log('We are at ' + JSON.stringify(pos));
                return true;
            } else {
                this.DBG && console.log('Other creep [' + creeps[0].name + '] found at' + JSON.stringify(pos));
                return false;
            }
        }
    }
}

Creep.prototype.roadCheck = function(work = false) {
    var road = false;
    var site = false;
    var flag = false;
    // Don't lay roads no room edges
    if (this.pos.isRoomEdge()) { return ;}
    let obj = this.room.lookForAt(LOOK_STRUCTURES, this.pos);
    if (obj.length > 0) {
        for (let i in obj) {
            if (obj[i].structureType == STRUCTURE_ROAD) {
                this.DBG && console.log(this.name + ' Already road here');
                road = obj[i];
                break;
            }
        }
    }
    if (road && work && this.carry.energy > 0) {
        if (road.hits < road.hitsMax) {
            this.DBG && console.log(this.name + ' Repairing existing road');
            this.repair(road);
            this.say(global.sayRepair);
            return;
        } else {
            this.DBG && console.log(this.name + ' Road good to go');
            return;
        }
    }
    if (road) {
        this.DBG && console.log(this.name + ' Already road no action to perform');
        return
    }
    // No road?
    if (!road) {
        // Are we in one of our OWN rooms
        if (this.room.controller) {
            if (this.room.controller.my) {
                // DO nothing don't want millions of roads!
                return;
            }
        }
        this.DBG && console.log(this.name + ' No road, looking for construction site');
        // Check for construction sites
        let sites = this.room.lookForAt(LOOK_CONSTRUCTION_SITES, this.pos);
        if (sites.length > 0) {
            this.DBG && console.log(this.name + ' Found construction site');
            if (sites[0].structureType == STRUCTURE_ROAD) {
                site = sites[0];
            }
        }
    }
    if (site && work && this.carry.energy > 0) {
        this.DBG && console.log(this.name + ' Building construction site');
        this.build(site);
        this.say(global.sayBuild);
        return;
    }
    // No site?
    if (!site) {
        this.DBG && console.log(this.name + ' No site found look for flags');
        // Check for flag
        let flags = _.filter(Game.flags, (flag) => flag.pos == this.pos);
        // let flags = this.room.lookForAt(LOOK_FLAGS, this.pos);
        if (flags.length > 0) {
            this.DBG && console.log(this.name + ' Found a flag');
            flag = flags[0];
        }
    }
    this.DBG && console.log(this.name + ' No Road, Site, or Flag.. attempting to place one');
    this.DBG && console.log(JSON.stringify(this.pos));
    if (!site && !flag && global.seedRemoteRoads == true) {
        // How many construction flags do we have?
        let roadFlags = _.filter(Game.flags, (flag) => flag.color == global.flagColor['buildsite'] && flag.secondaryColor == COLOR_WHITE);
        // If we have 100 or more road flags, don't make any more!
        if (roadFlags.length >= 100) { this.DBG && console.log(this.name + 'Enough flags not dropping any more'); return; }
        this.DBG && console.log(this.name + 'Dropping a flag');
        // Check for room edge here
        this.pos.createFlag();
        return;
    }
}

Creep.prototype.containerCheck = function() {
    // Check we have energy (and it's higher than 0.. because 0 probably means we got smacked and lost our carry)
    if (this.carry.energy >= this.carryCapacity && this.carry.energy > 0) {
        var container = false;
        // Check for structures at our pos
        let objects = this.pos.lookFor(LOOK_STRUCTURES);
        if (objects.length > 0) {
            for (let i in objects) {
                if (objects[i].structureType == STRUCTURE_CONTAINER) {
                    container = objects[i];
                    break;
                }
            }
        }
        // Is there a container?
        if (container) {
            if (container.hits < container.hitsMax) {
                this.repair(container);
                this.say(global.sayRepair);
                return;
            }
        } else {
            var constructionSite = false;
            // Get sites
            let sites = this.pos.lookFor(LOOK_CONSTRUCTION_SITES);
            // If there are some
            if (sites.length > 0) {
                // loop
                for (let i in sites) {
                    // is this site a container?
                    if (sites[i].structureType == STRUCTURE_CONTAINER) {
                        constructionSite = sites[i];
                        break;
                    }
                }
            }
            // Did we find one?
            if (constructionSite) {
                this.build(constructionSite);
                this.say(global.sayBuild);
                return true;
            } else {
                this.pos.createConstructionSite(STRUCTURE_CONTAINER);
                return;
            }
        }
    }
}

Creep.prototype.repairStructures = function (options = {}) {
    // First are we empty?
    if (this.carry.energy == 0) {
        DBG && console.log('[' + this.name + '] Empty Cannot Repair Structures');
        // Clear repair target
        delete this.memory.repairTarget;
        delete this.memory.targetMaxHP;
        return ERR_NOT_ENOUGH_ENERGY;
    }
    // Is their an item in memory, with full health already?
    if (this.memory.repairTarget) {
        let target = Game.getObjectById(this.memory.repairTarget);
        if (target) {
            // Have we already filled the items health to what we want?
            if (target.hits >= this.memory.targetMaxHP) {
                // Clear the target, time for a new one
                delete this.memory.repairTarget;
                delete this.memory.targetMaxHP;
            }
        } else {
            delete this.memory.repairTarget;
            delete this.memory.targetMaxHP;
        }

    }
    // Do we have a repairTarget in memory?
    if (!this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has no repair target, looking for 1 hp ramparts and walls');
        // Check for walls or ramparts with 1 hit first
        var ts = this.room.find(FIND_STRUCTURES, {
            filter: (i) => (i.structureType == STRUCTURE_RAMPART || i.structureType == STRUCTURE_WALL) && i.hits == 1 && i.room == this.room
        });

        if (ts.length > 0) {
            DBG && console.log('[' + this.name + '] Found a 1 hp item, setting target');
            ts.sort(function(a,b) {
                return a.hits - b.hits;
            });
            this.memory.targetMaxHP = 10;
            this.memory.repairTarget = ts[0].id;
        }
    }

    // Next juice up walls and ramparts to 600
    if (!this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has no repair target, looking for < 600hp ramparts and walls');
        if (ts.length == 0) {
            var ts = this.room.find(FIND_STRUCTURES, {
                filter: (i) => (i.structureType == STRUCTURE_RAMPART || i.structureType == STRUCTURE_WALL) && i.hits <= 600 && i.room == this.room
            });
            if (ts.length > 0) {
                ts.sort(function(a,b) {
                    return a.hits - b.hits;
                });
                this.memory.targetMaxHP = 600;
                this.memory.repairTarget = ts[0].id;
            }
        }
    }

    // Next find damaged structures that aren't walls, ramparts or roads
    if (!this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has no repair target, looking for damaged structures');
        this.findDamagedStructures();
    }

    // Next find Damaged Roads
    if (!this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has no repair target, looking for damaged roads');
        this.findDamagedRoads();
    }

    // Next find Damaged defence items (wall, rampart)
    if (!this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has no repair target, looking for damaged defences');
        this.findDamagedDefences();
    }
    // Do we have something to repair?
    if (this.memory.repairTarget) {
        DBG && console.log('[' + this.name + '] Has a repair target, checking close enough to repair');
        let target = Game.getObjectById(this.memory.repairTarget);
        if (options == {}) {
            var options = {
                visualizePathStyle: {
                    stroke: global.colourRepair,
                    opacity: global.pathOpacity
                },
                reusePath:this.pos.getRangeTo(target) // Use the range to the object we're after as the reusePath opt
            };
        }
        // Make sure target is still valid
        if (target.hits >= this.memory.targetMaxHP) {
            DBG && console.log('[' + this.name + '] Repair target at target XP deleting target from memory');
            delete this.memory.repairTarget;
            delete this.memory.targetMaxHP;
            return ERR_FULL;
        }
        if (this.pos.inRangeTo(target, 3)) {
            DBG && console.log('[' + this.name + '] Target in range, attempting repair');
            // attempt repair
            if (this.repair(target) == ERR_NOT_IN_RANGE) {
                DBG && console.log('[' + this.name + '] Repair Failed#');
            }
        } else {
            this.moveTo(target,options);
            this.say(global.sayMove);
            return OK;
        }
    } else {
        // Nothing to repair?
        // No targets.. head back to the room spawn
        var spawn = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_SPAWN
        });
        if (spawn) {
            if (spawn.recycleCreep(this) == ERR_NOT_IN_RANGE) {
                this.moveTo(spawn, {
                    visualizePathStyle: {
                        stroke: global.colorRepair,
                        opacity: global.pathOpacity
                    },
                    reusePath:3
                });
                this.say(global.sayWhat);
            }
        }
        return ERR_INVALID_TARGET;
    }
}

Creep.prototype.findDamagedStructures = function() {
    var ts = [];
    for (let distance in [3,5,10,20]) {
        var ts = this.pos.findInRange(FIND_STRUCTURES, distance, {
            filter: (i) => (i.structureType != STRUCTURE_RAMPART && i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_ROAD) && i.hits < i.hitsMax && i.room == this.room
        });
        if (ts.length>0) {break;}
    }
    if (ts.length == 0) {
        var ts = this.room.find(FIND_STRUCTURES, {
            filter: (i) => (i.structureType != STRUCTURE_RAMPART && i.structureType != STRUCTURE_WALL && i.structureType != STRUCTURE_ROAD) && i.hits < i.hitsMax && i.room == this.room
        });
    }
    if (ts.length > 0) {
        ts.sort(function(a,b) {
            let aH = a.hitsMax - a.hits;
            let bH = b.hitsMax - b.hits;
            if (aH > bH) {
                return -1;
            } else if (bH > aH) {
                return 1;
            }
            return 0;
        });
        this.memory.targetMaxHP = ts[0].hitsMax;
        this.memory.repairTarget = ts[0].id;
    }
}

Creep.prototype.findDamagedRoads = function() {
    var ts = [];
    for (let distance in [3,5,10,20]) {
        var ts = this.pos.findInRange(FIND_STRUCTURES, distance, {
            filter: (i) => i.structureType == STRUCTURE_ROAD && i.hits < i.hitsMax && i.room == this.room
        });
        if (ts.length>0){break;}
    }
    if (ts.length == 0) {
        var ts = this.room.find(FIND_STRUCTURES, {
            filter: (i) => i.structureType == STRUCTURE_ROAD && i.hits < i.hitsMax && i.room == this.room
        });
    }
    if (ts.length > 0) {
        ts.sort(function(a,b) {
            let aH = a.hitsMax - a.hits;
            let bH = b.hitsMax - b.hits;
            if (aH > bH) {
                return -1;
            } else if (bH > aH) {
                return 1;
            }
            return 0;
        });
        this.memory.targetMaxHP = ts[0].hitsMax;
        this.memory.repairTarget = ts[0].id;
    }
}

Creep.prototype.findDamagedDefences = function() {
    var ts = [];
    // Loop through the damage multipliers
    for (let multiplier in [0.25,0.5,0.75,1]) {
        // Loop through the distances
        for (let distance in [3,5,10,20]) {
            var ts = this.pos.findInRange(FIND_STRUCTURES, distance, {
                filter: (i) => ((i.structureType == STRUCTURE_RAMPART && i.hits < (global.rampartMax*multiplier)) ||
                                (i.structureType == STRUCTURE_WALL && i.hits < (global.wallMax*multiplier))) && i.room == this.room
            });
            if (ts.length>0){break;}
        }
        if (ts.length == 0) {
            var ts = this.room.find(FIND_STRUCTURES, {
                filter: (i) => ((i.structureType == STRUCTURE_RAMPART && i.hits < (global.rampartMax*multiplier)) ||
                                (i.structureType == STRUCTURE_WALL && i.hits < (global.wallMax*multiplier))) && i.room == this.room
            });
        }
        if (ts.length>0){
            ts.sort(function(a,b) {
                if (a.structureType == STRUCTURE_WALL)    { var aHitsMax = global.wallMax*multiplier; }
                if (a.structureType == STRUCTURE_RAMPART) { var aHitsMax = global.rampartMax*multiplier; }
                if (b.structureType == STRUCTURE_WALL)    { var bHitsMax = global.wallMax*multiplier; }
                if (b.structureType == STRUCTURE_RAMPART) { var bHitsMax = global.rampartMax*multiplier; }
                let aH = aHitsMax - a.hits;
                let bH = bHitsMax - b.hits;
                if (aH > bH) {
                    return -1;
                } else if (bH > aH) {
                    return 1;
                }
                return 0;
            });
            if (ts[0].structureType == STRUCTURE_WALL) {
                this.memory.targetMaxHP = global.wallMax*multiplier;
            }
            if (ts[0].structureType == STRUCTURE_RAMPART) {
                this.memory.targetMaxHP = global.rampartMax*multiplier;
            }
            this.memory.repairTarget = ts[0].id;
        }
    }
}

Creep.prototype.canDo = function(BodyPart) {
    // If this creep needs a bodypart it doesn't have to function properly, it needs to go home to repair or self repair
    if (!this.getActiveBodyparts(BodyPart) > 0 || this.memory.repair) {
        // Creep is damaged, say so!
        this.say('DMGD');
        // Do we have our own heal parts?
        if (this.getActiveBodyparts(HEAL) > 0) {
            // Heal ourselves
            this.heal(this);
        } else {
            // Get position in centre of home room
            if (this.memory.roomName) {
                let pos = new RoomPosition(25,25,this.memory.roomName);
                // Move the creep
                this.moveTo(pos, { reusePath:10 });
            }
        }
        // Are we at max health?
        if (this.hits >= this.hitsMax) {
            delete this.memory.repair;
            return true;
        } else {
            this.memory.repair = true;
            return false;
        }
    }
    return true;
}

Creep.prototype.QueueReplacement = function(now = false) {
    if (this.room.controller) {
        if (this.room.controller.level >= this.memory.level) {
            return;
        }
    }
    // We don't need level 1 creeps putting themselves in the spawn queue
    if (this.memory.level == 1) { return; }
    var bodyParts = [];
    for (var part of this.body) {
        bodyParts.push(part.type);
    }
    var newCreep = {
        role: this.memory.role,
        home: this.memory.roomName,
        level: this.memory.level,
        body: bodyParts,
    }
    if (now) {
        global.Queue.add_now(newCreep);
    } else {
        global.Queue.add(newCreep);
    }
}
