/**
 * Player Entity
 * Handles player movement, physics, and interactions
 */

import {
    PLAYER, TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, TOOLS, SONAR
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

        // Stats
        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.oxygen = PLAYER.MAX_OXYGEN;
        this.maxOxygen = PLAYER.MAX_OXYGEN;
        this.drillPower = PLAYER.DRILL_POWER;

        // Tool
        this.currentTool = TOOLS.DRILL;

        // Sonar
        this.sonarCooldown = 0;
        this.sonarActive = false;
        this.sonarPingTime = 0;
        this.sonarRevealedTiles = [];
        this.sonarCenter = { x: 0, y: 0 };

        // Inventory
        this.inventory = {
            wyrmSap: 0,
            wyrmSapPure: 0,
            dragonBone: 0,
            dragonClaw: 0,
            dragonTooth: 0,
            dirt: 0,
            stone: 0,
            pipe: 5,
            extractor: 1,
        };

        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    /**
     * Update player
     */
    update(deltaTime, world) {
        this.handleInput(world);
        this.applyPhysics(deltaTime, world);
        this.updateSonar(deltaTime, world);
        this.updateAnimation(deltaTime);
    }

    /**
     * Handle player input
     */
    handleInput(world) {
        const horizontal = input.getHorizontal();

        // Horizontal movement
        if (horizontal !== 0) {
            this.vx = horizontal * PLAYER.SPEED;
            this.facingLeft = horizontal < 0;
        } else {
            // Friction
            this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (input.isActionJustPressed('JUMP') && this.grounded) {
            this.vy = -PLAYER.JUMP_FORCE;
            this.grounded = false;
        }

        // Tool selection
        if (input.isActionJustPressed('TOOL_1')) this.currentTool = TOOLS.DRILL;
        if (input.isActionJustPressed('TOOL_2')) this.currentTool = TOOLS.SONAR;
        if (input.isActionJustPressed('TOOL_3')) this.currentTool = TOOLS.PIPE;
        if (input.isActionJustPressed('TOOL_4')) this.currentTool = TOOLS.EXTRACTOR;

        // Tool use
        if (this.currentTool === TOOLS.DRILL) {
            this.handleDrilling(world);
        } else if (this.currentTool === TOOLS.SONAR) {
            this.handleSonarActivation(world);
        } else if (this.currentTool === TOOLS.PIPE) {
            this.handlePipePlacement(world);
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
            const drillSpeed = this.drillPower / props.hardness;
            this.drillProgress += drillSpeed * 0.02;

            // Complete drilling
            if (this.drillProgress >= 1) {
                const drop = world.mineTile(targetTileX, targetTileY, this.drillPower);
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

        // Reveal tiles
        const centerTileX = Math.floor(this.sonarCenter.x / TILE_SIZE);
        const centerTileY = Math.floor(this.sonarCenter.y / TILE_SIZE);

        this.sonarRevealedTiles = world.getTilesInRadius(centerTileX, centerTileY, SONAR.RANGE);

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
     * Collect dropped items
     */
    collectDrop(dropType) {
        switch (dropType) {
            case 'wyrm_sap_small':
                this.inventory.wyrmSap += 1;
                break;
            case 'wyrm_sap':
                this.inventory.wyrmSap += 5;
                break;
            case 'wyrm_sap_pure':
                this.inventory.wyrmSapPure += 1;
                break;
            case 'dragon_bone':
                this.inventory.dragonBone += 1;
                break;
            case 'dragon_claw':
                this.inventory.dragonClaw += 1;
                break;
            case 'dragon_tooth':
                this.inventory.dragonTooth += 1;
                break;
            case 'dirt':
                this.inventory.dirt += 1;
                break;
            case 'stone':
                this.inventory.stone += 1;
                break;
        }
    }

    /**
     * Apply physics
     */
    applyPhysics(deltaTime, world) {
        // Gravity
        if (!this.grounded) {
            this.vy += PLAYER.GRAVITY;
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
