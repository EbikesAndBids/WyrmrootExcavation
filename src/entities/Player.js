/**
 * Player Entity
 * Handles player movement, physics, and interactions
 * Updated for oxygen/heat survival mechanics
 */

import {
    PLAYER, TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, TOOLS, SONAR, BIOMES,
    LIVING_TOOLS, EQUIPMENT_SLOTS, EQUIPMENT_SETS
} from '../core/Constants.js';
import { input } from '../core/Input.js';

export class Player {
    constructor(x, y) {
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = PLAYER.WIDTH;
        this.height = PLAYER.HEIGHT;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // State
        this.grounded = false;
        this.facingLeft = false;
        this.isDrilling = false;
        this.drillProgress = 0;
        this.drillTarget = null;
        this.isClimbing = false;
        this.isGliding = false;

        // Stats
        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.oxygen = PLAYER.MAX_OXYGEN;
        this.maxOxygen = PLAYER.MAX_OXYGEN;
        this.heat = 0;
        this.maxHeat = PLAYER.MAX_HEAT;
        this.drillPower = PLAYER.DRILL_POWER;

        // Tool
        this.currentTool = TOOLS.DRILL;

        // Living Tools equipped (5 slots)
        this.livingTools = {
            excavator: null,
            suit: null,
            backpack: null,
            utility: null,
            symbiote: null,
        };

        // Legacy compatibility for movement/vision tools
        this.movementTool = null;
        this.visionTool = null;

        // Biomass for feeding tools
        this.biomass = 0;

        // Set bonus effects
        this.activeBonuses = [];

        // Artifacts collected
        this.artifacts = [];

        // Crafted tools inventory (tools must be crafted before equipping)
        this.craftedTools = [];

        // Artifact effects
        this.permanentRevealRadius = 0;
        this.machineSpeedMultiplier = 1;
        this.oxygenEfficiency = 1;
        this.heatResistance = 0;

        // Sonar
        this.sonarCooldown = 0;
        this.sonarActive = false;
        this.sonarPingTime = 0;
        this.sonarRevealedTiles = [];
        this.sonarCenter = { x: 0, y: 0 };

        // Inventory - expanded for three biomes
        this.inventory = {
            // Vitae materials
            vitae_sap_small: 0,
            vitae_sap: 0,
            vitae_sap_pure: 0,
            // Ignis materials
            ignis_plasma_small: 0,
            ignis_plasma: 0,
            ignis_plasma_pure: 0,
            // Umbra materials
            umbra_ichor_small: 0,
            umbra_ichor: 0,
            umbra_ichor_pure: 0,
            // Fossils
            dragon_bone: 0,
            dragon_claw: 0,
            dragon_tooth: 0,
            dragon_skull: 0,
            dragon_ribcage: 0,
            // Terrain materials
            dirt: 0,
            stone: 0,
            petrified_wood: 0,
            amber: 0,
            gravel: 0,
            volcanic_rock: 0,
            basalt: 0,
            obsidian: 0,
            ash: 0,
            void_stone: 0,
            crystal: 0,
            floating_rock: 0,
            shadow_glass: 0,
            // Equipment
            pipe: 5,
            extractor: 1,
            turret: 2,
            oxygen_station: 1,
        };

        // Currency
        this.money = 0;

        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;

        // Hazard state
        this.inFluid = null;
        this.nearHeat = false;
        this.inGas = false;

        // Status effects
        this.effects = [];

        // Recall system
        this.recallCooldown = 0;
        this.recallMaxCooldown = 30000; // 30 seconds
        this.spawnX = x;
        this.spawnY = y;

        // Oxygen station interaction
        this.nearOxygenStation = false;
    }

    /**
     * Get current biome based on depth
     */
    getCurrentBiome() {
        const depth = this.getDepth();
        if (depth < BIOMES.SURFACE.maxDepth) return BIOMES.SURFACE;
        if (depth < BIOMES.VERDANT_CRUST.maxDepth) return BIOMES.VERDANT_CRUST;
        if (depth < BIOMES.MAGMA_RIBS.maxDepth) return BIOMES.MAGMA_RIBS;
        return BIOMES.ABYSSAL_DEEP;
    }

    /**
     * Update player
     */
    update(deltaTime, world) {
        this.handleInput(world);
        this.applyPhysics(deltaTime, world);
        this.updateSurvival(deltaTime, world);
        this.updateSonar(deltaTime, world);
        this.updateEffects(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateRecallCooldown(deltaTime);
    }

    /**
     * Update recall cooldown
     */
    updateRecallCooldown(deltaTime) {
        if (this.recallCooldown > 0) {
            this.recallCooldown = Math.max(0, this.recallCooldown - deltaTime);
        }
    }

    /**
     * Recall player to spawn point (surface)
     */
    recall() {
        if (this.recallCooldown > 0) {
            return false; // Still on cooldown
        }

        // Teleport to spawn
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;

        // Start cooldown
        this.recallCooldown = this.recallMaxCooldown;

        // Refill oxygen at surface
        this.oxygen = this.maxOxygen;

        // Cool down
        this.heat = 0;

        return true;
    }

    /**
     * Check if recall is available
     */
    canRecall() {
        return this.recallCooldown <= 0;
    }

    /**
     * Update survival mechanics (oxygen/heat)
     */
    updateSurvival(deltaTime, world) {
        const biome = this.getCurrentBiome();
        const depth = this.getDepth();

        // Reset hazard states
        this.nearHeat = false;
        this.inFluid = null;
        this.inGas = false;

        // Check surrounding tiles for hazards
        this.checkHazards(world);

        // Oxygen drain when underground
        if (depth > BIOMES.SURFACE.maxDepth) {
            // Check for oxygen station refill
            if (this.nearOxygenStation) {
                // Refill oxygen when near a station
                this.oxygen = Math.min(this.maxOxygen, this.oxygen + 0.2 * deltaTime);
            } else {
                let oxygenDrain = PLAYER.OXYGEN_DRAIN_RATE;

                // Drain faster in deeper biomes
                if (biome.id === 'magma') oxygenDrain *= 1.5;
                if (biome.id === 'abyss') oxygenDrain *= 2;

                // Drain faster in toxic gas
                if (this.inGas) oxygenDrain *= 3;

                this.oxygen -= oxygenDrain * deltaTime;

                // Suffocation damage
                if (this.oxygen <= 0) {
                    this.oxygen = 0;
                    this.takeDamage(0.1 * deltaTime); // Slow suffocation
                }
            }
        } else {
            // Recover oxygen at surface
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + 0.1 * deltaTime);
        }

        // Heat management
        if (this.nearHeat || biome.id === 'magma') {
            let heatGain = PLAYER.HEAT_GAIN_RATE;

            // More heat in lava biome
            if (biome.id === 'magma') heatGain *= 2;

            // Direct contact with lava or hot tiles
            if (this.inFluid === TILE_TYPES.LAVA) heatGain *= 5;

            this.heat += heatGain * deltaTime;

            // Overheat damage
            if (this.heat >= this.maxHeat) {
                this.heat = this.maxHeat;
                this.takeDamage(0.2 * deltaTime);
            }
        } else {
            // Cool down
            this.heat = Math.max(0, this.heat - PLAYER.HEAT_DECAY_RATE * deltaTime);
        }

        // Fluid damage
        if (this.inFluid) {
            // Check for lava immunity from Ignis set bonus
            if (this.inFluid === TILE_TYPES.LAVA && this.lavaImmunity) {
                // No damage, refill drill fuel instead
                this.drillFuel = (this.drillFuel || 100);
            } else {
                const props = TILE_PROPERTIES[this.inFluid];
                if (props && props.damage > 0) {
                    const damageReduction = this.heatResistance || 0;
                    this.takeDamage(props.damage * 0.01 * deltaTime * (1 - damageReduction));
                }
            }
        }

        // Health regen from Vitae set bonus (near light sources)
        if (this.hasSetBonus('healthRegen') && this.nearGlowingTile) {
            this.heal(0.05 * deltaTime);
        }

        // Heat to speed bonus from Ignis set
        if (this.heatToSpeedBonus > 0 && this.heat > 0) {
            const heatRatio = this.heat / this.maxHeat;
            this.speedMultiplier = 1 + (heatRatio * this.heatToSpeedBonus);
        } else {
            this.speedMultiplier = 1;
        }
    }

    /**
     * Check surrounding tiles for hazards
     */
    checkHazards(world) {
        const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const tileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

        // Reset oxygen station detection
        this.nearOxygenStation = false;
        this.nearGlowingTile = false;

        // Check tiles in a 3x3 around player
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tile = world.getTile(tileX + dx, tileY + dy);
                const props = TILE_PROPERTIES[tile];

                if (props) {
                    if (props.hot) this.nearHeat = true;
                    if (props.fluid && (dx === 0 && dy === 0)) this.inFluid = tile;
                    if (props.gas && (dx === 0 && dy === 0)) this.inGas = true;
                    if (props.glows) this.nearGlowingTile = true;
                }

                // Check for oxygen station
                if (tile === TILE_TYPES.OXYGEN_STATION) {
                    this.nearOxygenStation = true;
                }
            }
        }
    }

    /**
     * Update status effects
     */
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.duration -= deltaTime;

            if (effect.duration <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    /**
     * Add a status effect
     */
    addEffect(type, duration, magnitude = 1) {
        // Check for existing effect
        const existing = this.effects.find(e => e.type === type);
        if (existing) {
            existing.duration = Math.max(existing.duration, duration);
            return;
        }

        this.effects.push({ type, duration, magnitude });
    }

    /**
     * Check if player has an effect
     */
    hasEffect(type) {
        return this.effects.some(e => e.type === type);
    }

    /**
     * Handle player input
     */
    handleInput(world) {
        const horizontal = input.getHorizontal();

        // Check for living tool movement abilities
        const movementTool = this.livingTools.movement;
        const canWallClimb = movementTool && LIVING_TOOLS[movementTool.toUpperCase()]?.wallClimb;
        const canDoubleJump = movementTool && LIVING_TOOLS[movementTool.toUpperCase()]?.doubleJump;
        const canGlide = movementTool && LIVING_TOOLS[movementTool.toUpperCase()]?.glide;

        // Horizontal movement
        if (horizontal !== 0) {
            this.vx = horizontal * PLAYER.SPEED;
            this.facingLeft = horizontal < 0;
        } else {
            // Friction
            this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Wall climbing
        if (canWallClimb && !this.grounded && horizontal !== 0) {
            const wallX = horizontal > 0 ?
                Math.floor((this.x + this.width + 2) / TILE_SIZE) :
                Math.floor((this.x - 2) / TILE_SIZE);
            const wallY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            if (world.isSolid(wallX, wallY)) {
                this.isClimbing = true;
                this.vy = input.getVertical() * -PLAYER.SPEED * 0.7;
            } else {
                this.isClimbing = false;
            }
        } else {
            this.isClimbing = false;
        }

        // Jump / Double jump
        if (input.isActionJustPressed('JUMP')) {
            if (this.grounded || this.isClimbing) {
                this.vy = -PLAYER.JUMP_FORCE;
                this.grounded = false;
                this.isClimbing = false;
            } else if (canDoubleJump && !this.hasEffect('double_jumped')) {
                this.vy = -PLAYER.JUMP_FORCE * 0.8;
                this.addEffect('double_jumped', 100);
            }
        }

        // Gliding
        if (canGlide && !this.grounded && this.vy > 0 && input.isActionPressed('JUMP')) {
            this.isGliding = true;
            this.vy = Math.min(this.vy, 2); // Slow fall
        } else {
            this.isGliding = false;
        }

        // Reset double jump when grounded
        if (this.grounded) {
            this.effects = this.effects.filter(e => e.type !== 'double_jumped');
        }

        // Tool selection
        if (input.isActionJustPressed('TOOL_1')) this.currentTool = TOOLS.DRILL;
        if (input.isActionJustPressed('TOOL_2')) this.currentTool = TOOLS.SONAR;
        if (input.isActionJustPressed('TOOL_3')) this.currentTool = TOOLS.PIPE;
        if (input.isActionJustPressed('TOOL_4')) this.currentTool = TOOLS.TURRET;

        // Tool use
        if (this.currentTool === TOOLS.DRILL) {
            this.handleDrilling(world);
        } else if (this.currentTool === TOOLS.SONAR) {
            this.handleSonarActivation(world);
        } else if (this.currentTool === TOOLS.PIPE) {
            this.handlePipePlacement(world);
        } else if (this.currentTool === TOOLS.TURRET) {
            this.handleTurretPlacement(world);
        }

        // Extractor placement (R key)
        if (input.isActionJustPressed('PLACE_EXTRACTOR')) {
            this.handleExtractorPlacement(world);
        }

        // Oxygen station placement (O key)
        if (input.isActionJustPressed('PLACE_OXYGEN')) {
            this.handleOxygenStationPlacement(world);
        }
    }

    /**
     * Handle drilling mechanics
     */
    handleDrilling(world) {
        const mouseWorld = input.getMouseWorldPosition();
        const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
        const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

        // Check if in range
        const playerTileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const playerTileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

        const distance = Math.sqrt(
            (targetTileX - playerTileX) ** 2 +
            (targetTileY - playerTileY) ** 2
        );

        if (distance > PLAYER.DRILL_RANGE) {
            this.isDrilling = false;
            this.drillProgress = 0;
            this.drillTarget = null;
            return;
        }

        // Check if valid target
        const tile = world.getTile(targetTileX, targetTileY);
        const props = TILE_PROPERTIES[tile];

        if (!props || props.hardness < 0 || tile === TILE_TYPES.AIR) {
            this.isDrilling = false;
            this.drillProgress = 0;
            this.drillTarget = null;
            return;
        }

        // Calculate effective drill power (with living tools bonus)
        let effectivePower = this.drillPower;
        const excavatorTool = this.livingTools.excavator;
        if (excavatorTool) {
            const toolData = LIVING_TOOLS[excavatorTool.toUpperCase()];
            if (toolData) effectivePower = toolData.power;
        }

        // Drilling
        if (input.isActionPressed('DRILL')) {
            // Check if target changed
            if (!this.drillTarget ||
                this.drillTarget.x !== targetTileX ||
                this.drillTarget.y !== targetTileY) {
                this.drillTarget = { x: targetTileX, y: targetTileY };
                this.drillProgress = 0;
            }

            this.isDrilling = true;

            // Progress based on drill power vs hardness
            const drillSpeed = effectivePower / props.hardness;
            this.drillProgress += drillSpeed * 0.02;

            // Complete drilling
            if (this.drillProgress >= 1) {
                const drop = world.mineTile(targetTileX, targetTileY, effectivePower);
                if (drop) {
                    this.collectDrop(drop);
                }
                this.drillProgress = 0;
                this.isDrilling = false;

                return { mined: true, x: targetTileX, y: targetTileY, type: tile };
            }
        } else {
            this.isDrilling = false;
            this.drillProgress *= 0.9; // Decay progress
        }

        return null;
    }

    /**
     * Handle sonar activation
     */
    handleSonarActivation(world) {
        if (input.isActionJustPressed('DRILL') && this.sonarCooldown <= 0) {
            this.activateSonar(world);
        }
    }

    /**
     * Activate sonar ping
     */
    activateSonar(world) {
        this.sonarActive = true;
        this.sonarPingTime = 0;
        this.sonarCooldown = SONAR.COOLDOWN;

        // Get center position
        this.sonarCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };

        // Enhanced range with living tool
        let range = SONAR.RANGE;
        const visionTool = this.livingTools.vision;
        if (visionTool) {
            const toolData = LIVING_TOOLS[visionTool.toUpperCase()];
            if (toolData) range = toolData.range;
        }

        // Reveal tiles
        const centerTileX = Math.floor(this.sonarCenter.x / TILE_SIZE);
        const centerTileY = Math.floor(this.sonarCenter.y / TILE_SIZE);

        this.sonarRevealedTiles = world.getTilesInRadius(centerTileX, centerTileY, range);

        // Mark as explored
        for (const tile of this.sonarRevealedTiles) {
            world.explore(tile.x, tile.y);
        }
    }

    /**
     * Update sonar state
     */
    updateSonar(deltaTime, world) {
        // Cooldown
        if (this.sonarCooldown > 0) {
            this.sonarCooldown -= deltaTime;
        }

        // Ping animation
        if (this.sonarActive) {
            this.sonarPingTime += deltaTime;

            if (this.sonarPingTime > SONAR.PING_DURATION + SONAR.REVEAL_DURATION) {
                this.sonarActive = false;
                this.sonarRevealedTiles = [];
            }
        }
    }

    /**
     * Handle pipe placement
     */
    handlePipePlacement(world) {
        if (input.isActionJustPressed('DRILL') && this.inventory.pipe > 0) {
            const mouseWorld = input.getMouseWorldPosition();
            const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
            const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

            // Check if tile is air
            if (world.getTile(targetTileX, targetTileY) === TILE_TYPES.AIR) {
                world.setTile(targetTileX, targetTileY, TILE_TYPES.PIPE);
                this.inventory.pipe--;
            }
        }
    }

    /**
     * Handle turret placement
     */
    handleTurretPlacement(world) {
        if (input.isActionJustPressed('DRILL') && this.inventory.turret > 0) {
            const mouseWorld = input.getMouseWorldPosition();
            const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
            const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

            // Check if tile is air and has floor beneath
            if (world.getTile(targetTileX, targetTileY) === TILE_TYPES.AIR &&
                world.isSolid(targetTileX, targetTileY + 1)) {
                world.setTile(targetTileX, targetTileY, TILE_TYPES.TURRET);
                this.inventory.turret--;
            }
        }
    }

    /**
     * Handle extractor placement
     */
    handleExtractorPlacement(world) {
        if (this.inventory.extractor > 0) {
            const mouseWorld = input.getMouseWorldPosition();
            const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
            const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

            const tile = world.getTile(targetTileX, targetTileY);
            const props = TILE_PROPERTIES[tile];

            // Can only place on extractable roots
            if (props && props.extractable) {
                world.setTile(targetTileX, targetTileY, TILE_TYPES.EXTRACTOR);
                this.inventory.extractor--;
            }
        }
    }

    /**
     * Handle oxygen station placement
     */
    handleOxygenStationPlacement(world) {
        if (this.inventory.oxygen_station > 0) {
            const mouseWorld = input.getMouseWorldPosition();
            const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
            const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

            // Check if tile is air and has floor beneath
            if (world.getTile(targetTileX, targetTileY) === TILE_TYPES.AIR &&
                world.isSolid(targetTileX, targetTileY + 1)) {
                world.setTile(targetTileX, targetTileY, TILE_TYPES.OXYGEN_STATION);
                this.inventory.oxygen_station--;
                return true;
            }
        }
        return false;
    }

    /**
     * Collect dropped items
     */
    collectDrop(dropType) {
        if (this.inventory.hasOwnProperty(dropType)) {
            this.inventory[dropType]++;
        }
    }

    /**
     * Apply physics
     */
    applyPhysics(deltaTime, world) {
        // Skip gravity if climbing
        if (this.isClimbing) {
            return;
        }

        // Gravity
        if (!this.grounded) {
            let gravity = PLAYER.GRAVITY;

            // Reduced gravity in Abyss (gravity distortion)
            if (this.getCurrentBiome().id === 'abyss') {
                gravity *= 0.6;
            }

            // Gliding reduces gravity
            if (this.isGliding) {
                gravity *= 0.2;
            }

            this.vy += gravity;
            if (this.vy > PLAYER.MAX_FALL_SPEED) {
                this.vy = PLAYER.MAX_FALL_SPEED;
            }
        }

        // Move X
        this.x += this.vx;
        this.resolveCollisionX(world);

        // Move Y
        this.y += this.vy;
        this.resolveCollisionY(world);
    }

    /**
     * Resolve horizontal collision
     */
    resolveCollisionX(world) {
        const left = Math.floor(this.x / TILE_SIZE);
        const right = Math.floor((this.x + this.width) / TILE_SIZE);
        const top = Math.floor(this.y / TILE_SIZE);
        const bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);

        for (let y = top; y <= bottom; y++) {
            // Check left
            if (this.vx < 0 && world.isSolid(left, y)) {
                this.x = (left + 1) * TILE_SIZE;
                this.vx = 0;
                return;
            }
            // Check right
            if (this.vx > 0 && world.isSolid(right, y)) {
                this.x = right * TILE_SIZE - this.width;
                this.vx = 0;
                return;
            }
        }
    }

    /**
     * Resolve vertical collision
     */
    resolveCollisionY(world) {
        const left = Math.floor(this.x / TILE_SIZE);
        const right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        const top = Math.floor(this.y / TILE_SIZE);
        const bottom = Math.floor((this.y + this.height) / TILE_SIZE);

        this.grounded = false;

        for (let x = left; x <= right; x++) {
            // Check top
            if (this.vy < 0 && world.isSolid(x, top)) {
                this.y = (top + 1) * TILE_SIZE;
                this.vy = 0;
                return;
            }
            // Check bottom
            if (this.vy > 0 && world.isSolid(x, bottom)) {
                this.y = bottom * TILE_SIZE - this.height;
                this.vy = 0;
                this.grounded = true;
                return;
            }
        }
    }

    /**
     * Update animation
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;

        if (this.animationTimer > 100) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
    }

    /**
     * Get current depth in tiles
     */
    getDepth() {
        return Math.max(0, Math.floor(this.y / TILE_SIZE));
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    /**
     * Heal
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Refill oxygen (from oxygen station)
     */
    refillOxygen(amount) {
        this.oxygen = Math.min(this.maxOxygen, this.oxygen + amount);
    }

    /**
     * Cool down (from water or coolant)
     */
    coolDown(amount) {
        this.heat = Math.max(0, this.heat - amount);
    }

    /**
     * Add a crafted tool to inventory
     */
    addCraftedTool(tool) {
        if (!tool || !tool.id) return false;

        // Check if already has this tool
        const existing = this.craftedTools.find(t => t.id === tool.id);
        if (existing) return false;

        this.craftedTools.push(tool);
        return true;
    }

    /**
     * Check if player has crafted a specific tool
     */
    hasCraftedTool(toolId) {
        return this.craftedTools.some(t => t.id === toolId);
    }

    /**
     * Get crafted tool by ID
     */
    getCraftedTool(toolId) {
        return this.craftedTools.find(t => t.id === toolId);
    }

    /**
     * Equip a living tool (must be crafted first)
     */
    equipLivingTool(toolId) {
        // Find the tool in crafted inventory
        const craftedTool = this.getCraftedTool(toolId);
        if (!craftedTool) {
            console.warn(`Cannot equip ${toolId}: not crafted yet`);
            return false;
        }

        // Map category to slot
        const categoryToSlot = {
            excavator: 'excavator',
            suit: 'suit',
            backpack: 'backpack',
            utility: 'utility',
            symbiote: 'symbiote',
            // Legacy categories
            movement: 'utility',
            vision: 'utility',
            storage: 'backpack',
        };

        const slot = categoryToSlot[craftedTool.category];
        if (slot && this.livingTools.hasOwnProperty(slot)) {
            this.livingTools[slot] = craftedTool;
            this.calculateSetBonuses();
            return true;
        }

        return false;
    }

    /**
     * Unequip a living tool from slot
     */
    unequipLivingTool(slot) {
        if (this.livingTools.hasOwnProperty(slot)) {
            this.livingTools[slot] = null;
            this.calculateSetBonuses();
            return true;
        }
        return false;
    }

    /**
     * Calculate active set bonuses
     */
    calculateSetBonuses() {
        const broodCounts = { vitae: 0, ignis: 0, umbra: 0 };

        // Count items per brood
        for (const tool of Object.values(this.livingTools)) {
            if (tool && tool.brood) {
                broodCounts[tool.brood]++;
            }
        }

        // Find active bonuses
        this.activeBonuses = [];

        for (const [broodId, count] of Object.entries(broodCounts)) {
            if (count >= 2) {
                const set = EQUIPMENT_SETS[broodId.toUpperCase()];
                if (set) {
                    if (count >= 2 && set.bonuses[2]) {
                        this.activeBonuses.push({ ...set.bonuses[2], brood: broodId, count: 2 });
                    }
                    if (count >= 3 && set.bonuses[3]) {
                        this.activeBonuses.push({ ...set.bonuses[3], brood: broodId, count: 3 });
                    }
                }
            }
        }

        // Apply set bonus effects
        this.applySetBonuses();
    }

    /**
     * Apply set bonus effects
     */
    applySetBonuses() {
        // Reset bonus-affected stats
        this.lavaImmunity = false;
        this.wallWalkEnabled = false;
        this.pipeTravel = false;
        this.phaseChance = 0;
        this.heatToSpeedBonus = 0;

        for (const bonus of this.activeBonuses) {
            switch (bonus.effect) {
                case 'healthRegen':
                    // Applied in updateSurvival
                    break;
                case 'pipeTravel':
                    this.pipeTravel = true;
                    break;
                case 'heatToSpeed':
                    this.heatToSpeedBonus = bonus.value;
                    break;
                case 'lavaImmunity':
                    this.lavaImmunity = true;
                    break;
                case 'phaseChance':
                    this.phaseChance = bonus.value;
                    break;
                case 'wallWalk':
                    this.wallWalkEnabled = true;
                    break;
            }
        }
    }

    /**
     * Check if has a specific set bonus
     */
    hasSetBonus(effectName) {
        return this.activeBonuses.some(b => b.effect === effectName);
    }

    /**
     * Collect biomass from killed enemies
     */
    collectBiomass(amount) {
        this.biomass += amount;
    }

    /**
     * Get equipped tool for a slot
     */
    getEquippedTool(slot) {
        return this.livingTools[slot] || null;
    }

    /**
     * Get bounding box
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }

    /**
     * Get the tile the player is targeting with the drill
     */
    getDrillTarget() {
        if (!this.drillTarget) return null;
        return {
            x: this.drillTarget.x,
            y: this.drillTarget.y,
            progress: this.drillProgress,
        };
    }

    /**
     * Check if can mine a specific tile
     */
    canMine(tileX, tileY, world) {
        const playerTileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const playerTileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);

        const distance = Math.sqrt(
            (tileX - playerTileX) ** 2 +
            (tileY - playerTileY) ** 2
        );

        if (distance > PLAYER.DRILL_RANGE) return false;

        const tile = world.getTile(tileX, tileY);
        const props = TILE_PROPERTIES[tile];

        return props && props.hardness >= 0 && tile !== TILE_TYPES.AIR;
    }
}

export default Player;
