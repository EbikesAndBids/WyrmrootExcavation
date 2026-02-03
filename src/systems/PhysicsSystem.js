/**
 * Physics System
 * Handles falling sand/gravel, fluid simulation, and gas behavior
 * Uses cellular automata for realistic fluid dynamics
 */

import { TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, PHYSICS, CHUNK_SIZE } from '../core/Constants.js';

export class PhysicsSystem {
    constructor(world) {
        this.world = world;
        this.lastGravityTick = 0;
        this.lastFluidTick = 0;
        this.lastGasTick = 0;

        // Track active physics tiles for optimization
        this.activeFallingTiles = new Set();
        this.activeFluidTiles = new Map(); // key -> { type, level (0-8) }
        this.activeGasTiles = new Set();

        // Pending updates (to avoid modifying while iterating)
        this.pendingUpdates = [];

        // Fluid levels - stored separately from tile data
        this.fluidLevels = new Map(); // "x,y" -> level (0-8)

        // Maximum fluid level
        this.maxFluidLevel = PHYSICS.FLUID_MAX_LEVEL;

        // Fluid simulation timing
        this.fluidTickRate = 50; // ms between fluid updates
    }

    /**
     * Register a tile for physics updates
     */
    registerTile(x, y) {
        const tile = this.world.getTile(x, y);
        const props = TILE_PROPERTIES[tile];
        if (!props) return;

        const key = `${x},${y}`;

        if (props.falls) {
            this.activeFallingTiles.add(key);
        }
        if (props.fluid) {
            this.activeFluidTiles.set(key, { type: tile, level: this.maxFluidLevel });
            if (!this.fluidLevels.has(key)) {
                this.fluidLevels.set(key, this.maxFluidLevel);
            }
        }
        if (props.gas) {
            this.activeGasTiles.add(key);
        }
    }

    /**
     * Unregister a tile from physics
     */
    unregisterTile(x, y) {
        const key = `${x},${y}`;
        this.activeFallingTiles.delete(key);
        this.activeFluidTiles.delete(key);
        this.activeGasTiles.delete(key);
        this.fluidLevels.delete(key);
    }

    /**
     * Get fluid level at position
     */
    getFluidLevel(x, y) {
        const key = `${x},${y}`;
        return this.fluidLevels.get(key) || 0;
    }

    /**
     * Set fluid level at position
     */
    setFluidLevel(x, y, level) {
        const key = `${x},${y}`;
        if (level <= 0) {
            this.fluidLevels.delete(key);
            this.activeFluidTiles.delete(key);
        } else {
            this.fluidLevels.set(key, Math.min(this.maxFluidLevel, level));
        }
    }

    /**
     * Main update function
     */
    update(deltaTime, currentTime) {
        // Gravity updates (falling sand/gravel)
        if (currentTime - this.lastGravityTick >= PHYSICS.GRAVITY_TICK) {
            this.updateFallingTiles();
            this.lastGravityTick = currentTime;
        }

        // Fluid updates (cellular automata)
        if (currentTime - this.lastFluidTick >= this.fluidTickRate) {
            this.updateFluids(deltaTime);
            this.lastFluidTick = currentTime;
        }

        // Gas updates
        if (currentTime - this.lastGasTick >= PHYSICS.GRAVITY_TICK * 2) {
            this.updateGases(deltaTime);
            this.lastGasTick = currentTime;
        }

        // Apply pending updates
        this.applyPendingUpdates();
    }

    /**
     * Update falling tiles (gravel, sand, ash)
     */
    updateFallingTiles() {
        const toRemove = [];
        const toAdd = [];

        for (const key of this.activeFallingTiles) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.world.getTile(x, y);
            const props = TILE_PROPERTIES[tile];

            if (!props || !props.falls) {
                toRemove.push(key);
                continue;
            }

            // Check if can fall
            const below = this.world.getTile(x, y + 1);
            const belowProps = TILE_PROPERTIES[below];

            if (below === TILE_TYPES.AIR || (belowProps && belowProps.fluid)) {
                // Fall down
                this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                this.pendingUpdates.push({ x, y: y + 1, tile });
                toRemove.push(key);
                toAdd.push(`${x},${y + 1}`);

                // Check for fluid displacement
                if (belowProps && belowProps.fluid) {
                    // Displace fluid upward
                    this.pendingUpdates.push({ x, y, tile: below });
                    this.activeFluidTiles.set(`${x},${y}`, { type: below, level: this.getFluidLevel(x, y + 1) });
                    this.setFluidLevel(x, y, this.getFluidLevel(x, y + 1));
                }
            } else {
                // Try to slide diagonally
                const leftBelow = this.world.getTile(x - 1, y + 1);
                const rightBelow = this.world.getTile(x + 1, y + 1);
                const left = this.world.getTile(x - 1, y);
                const right = this.world.getTile(x + 1, y);

                if (leftBelow === TILE_TYPES.AIR && left === TILE_TYPES.AIR) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    this.pendingUpdates.push({ x: x - 1, y: y + 1, tile });
                    toRemove.push(key);
                    toAdd.push(`${x - 1},${y + 1}`);
                } else if (rightBelow === TILE_TYPES.AIR && right === TILE_TYPES.AIR) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    this.pendingUpdates.push({ x: x + 1, y: y + 1, tile });
                    toRemove.push(key);
                    toAdd.push(`${x + 1},${y + 1}`);
                }
            }
        }

        // Update active set
        for (const key of toRemove) this.activeFallingTiles.delete(key);
        for (const key of toAdd) this.activeFallingTiles.add(key);
    }

    /**
     * Update fluid tiles using cellular automata
     * Each cell has a level 0-8, and fluid flows to equalize levels
     */
    updateFluids(deltaTime) {
        const updates = new Map(); // key -> new level

        // Process all active fluid tiles
        for (const [key, fluidData] of this.activeFluidTiles) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.world.getTile(x, y);
            const props = TILE_PROPERTIES[tile];

            if (!props || !props.fluid) {
                this.unregisterTile(x, y);
                continue;
            }

            const currentLevel = this.getFluidLevel(x, y) || this.maxFluidLevel;
            if (currentLevel <= 0) continue;

            let remainingLevel = currentLevel;

            // 1. Try to flow down first (gravity)
            const below = this.world.getTile(x, y + 1);
            const belowProps = TILE_PROPERTIES[below];

            if (below === TILE_TYPES.AIR) {
                // Flow down into empty space
                const belowKey = `${x},${y + 1}`;
                const belowLevel = this.getFluidLevel(x, y + 1);
                const spaceBelow = this.maxFluidLevel - belowLevel;

                if (spaceBelow > 0) {
                    const transfer = Math.min(remainingLevel, spaceBelow);
                    remainingLevel -= transfer;

                    // Schedule updates
                    updates.set(belowKey, (updates.get(belowKey) || belowLevel) + transfer);

                    if (remainingLevel <= 0) {
                        this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    } else {
                        this.pendingUpdates.push({ x, y: y + 1, tile });
                    }
                }
            } else if (belowProps && belowProps.fluid && below === tile) {
                // Combine with same fluid below
                const belowKey = `${x},${y + 1}`;
                const belowLevel = this.getFluidLevel(x, y + 1);
                const spaceBelow = this.maxFluidLevel - belowLevel;

                if (spaceBelow > 0) {
                    const transfer = Math.min(remainingLevel, spaceBelow);
                    remainingLevel -= transfer;
                    updates.set(belowKey, (updates.get(belowKey) || belowLevel) + transfer);
                }
            }

            // 2. Try to spread horizontally if blocked below
            if (remainingLevel > 1) {
                const directions = Math.random() < 0.5 ? [-1, 1] : [1, -1];

                for (const dx of directions) {
                    const sideX = x + dx;
                    const side = this.world.getTile(sideX, y);
                    const sideProps = TILE_PROPERTIES[side];
                    const sideKey = `${sideX},${y}`;

                    if (side === TILE_TYPES.AIR || (sideProps && sideProps.fluid && side === tile)) {
                        const sideLevel = this.getFluidLevel(sideX, y);

                        // Only flow if we have more than the side
                        if (remainingLevel > sideLevel + 1) {
                            // Equalize levels
                            const totalLevel = remainingLevel + sideLevel;
                            const avgLevel = Math.floor(totalLevel / 2);
                            const remainder = totalLevel % 2;

                            const newCurrentLevel = avgLevel + remainder;
                            const newSideLevel = avgLevel;

                            if (newSideLevel > 0 && side === TILE_TYPES.AIR) {
                                this.pendingUpdates.push({ x: sideX, y, tile });
                            }

                            remainingLevel = newCurrentLevel;
                            updates.set(sideKey, newSideLevel);
                        }
                    }

                    // Also check diagonal down flow
                    const diagBelow = this.world.getTile(sideX, y + 1);
                    if (diagBelow === TILE_TYPES.AIR && side === TILE_TYPES.AIR) {
                        // Flow diagonally down
                        if (remainingLevel > 0) {
                            const transfer = Math.min(remainingLevel, 2);
                            remainingLevel -= transfer;
                            const diagKey = `${sideX},${y + 1}`;
                            updates.set(diagKey, (updates.get(diagKey) || 0) + transfer);
                            this.pendingUpdates.push({ x: sideX, y: y + 1, tile });
                        }
                    }
                }
            }

            // Update current cell
            if (remainingLevel !== currentLevel) {
                if (remainingLevel <= 0) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    updates.set(key, 0);
                } else {
                    updates.set(key, remainingLevel);
                }
            }

            // Check for lava interactions
            if (tile === TILE_TYPES.LAVA) {
                this.checkLavaInteractions(x, y);
            }
        }

        // Apply fluid level updates
        for (const [key, level] of updates) {
            const [x, y] = key.split(',').map(Number);
            this.setFluidLevel(x, y, level);

            if (level > 0) {
                const tile = this.world.getTile(x, y);
                const props = TILE_PROPERTIES[tile];
                if (props && props.fluid) {
                    this.activeFluidTiles.set(key, { type: tile, level });
                }
            }
        }

        // Register neighbors of active fluids
        for (const [key] of this.activeFluidTiles) {
            const [x, y] = key.split(',').map(Number);
            this.checkAndRegisterNeighborFluids(x, y);
        }
    }

    /**
     * Check and register neighboring fluid cells
     */
    checkAndRegisterNeighborFluids(x, y) {
        const neighbors = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
        ];

        for (const { dx, dy } of neighbors) {
            const nx = x + dx;
            const ny = y + dy;
            const tile = this.world.getTile(nx, ny);
            const props = TILE_PROPERTIES[tile];

            if (props && props.fluid) {
                const key = `${nx},${ny}`;
                if (!this.activeFluidTiles.has(key)) {
                    this.activeFluidTiles.set(key, { type: tile, level: this.maxFluidLevel });
                    if (!this.fluidLevels.has(key)) {
                        this.fluidLevels.set(key, this.maxFluidLevel);
                    }
                }
            }
        }
    }

    /**
     * Check lava interactions with water
     */
    checkLavaInteractions(x, y) {
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const { dx, dy } of neighbors) {
            const nx = x + dx;
            const ny = y + dy;
            const neighbor = this.world.getTile(nx, ny);

            if (neighbor === TILE_TYPES.WATER) {
                // Lava + Water = Obsidian + Steam
                this.pendingUpdates.push({ x, y, tile: TILE_TYPES.OBSIDIAN });
                this.pendingUpdates.push({ x: nx, y: ny, tile: TILE_TYPES.STEAM });
                this.unregisterTile(x, y);
                this.unregisterTile(nx, ny);
                this.activeGasTiles.add(`${nx},${ny}`);
                break;
            }
        }
    }

    /**
     * Update gas tiles
     */
    updateGases(deltaTime) {
        const toRemove = [];
        const toAdd = [];

        for (const key of this.activeGasTiles) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.world.getTile(x, y);
            const props = TILE_PROPERTIES[tile];

            if (!props || !props.gas) {
                toRemove.push(key);
                continue;
            }

            // Gases rise
            if (props.rises) {
                const above = this.world.getTile(x, y - 1);
                if (above === TILE_TYPES.AIR) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    this.pendingUpdates.push({ x, y: y - 1, tile });
                    toRemove.push(key);
                    toAdd.push(`${x},${y - 1}`);
                } else {
                    // Try to spread horizontally while rising
                    const leftAbove = this.world.getTile(x - 1, y - 1);
                    const rightAbove = this.world.getTile(x + 1, y - 1);
                    const left = this.world.getTile(x - 1, y);
                    const right = this.world.getTile(x + 1, y);

                    if (leftAbove === TILE_TYPES.AIR && left === TILE_TYPES.AIR) {
                        this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                        this.pendingUpdates.push({ x: x - 1, y: y - 1, tile });
                        toRemove.push(key);
                        toAdd.push(`${x - 1},${y - 1}`);
                    } else if (rightAbove === TILE_TYPES.AIR && right === TILE_TYPES.AIR) {
                        this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                        this.pendingUpdates.push({ x: x + 1, y: y - 1, tile });
                        toRemove.push(key);
                        toAdd.push(`${x + 1},${y - 1}`);
                    } else {
                        // Dissipate over time if trapped
                        if (Math.random() < 0.02) {
                            this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                            toRemove.push(key);
                        }
                    }
                }
            } else {
                // Non-rising gases spread out
                const dir = Math.random() < 0.5 ? -1 : 1;
                const side = this.world.getTile(x + dir, y);

                if (side === TILE_TYPES.AIR && Math.random() < 0.1) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    this.pendingUpdates.push({ x: x + dir, y, tile });
                    toRemove.push(key);
                    toAdd.push(`${x + dir},${y}`);
                }

                // Slowly dissipate
                if (Math.random() < 0.005) {
                    this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                    toRemove.push(key);
                }
            }
        }

        for (const key of toRemove) this.activeGasTiles.delete(key);
        for (const key of toAdd) this.activeGasTiles.add(key);
    }

    /**
     * Apply all pending tile updates
     */
    applyPendingUpdates() {
        for (const update of this.pendingUpdates) {
            this.world.setTile(update.x, update.y, update.tile);
        }
        this.pendingUpdates = [];
    }

    /**
     * Trigger an explosion at a position
     */
    explode(x, y, radius = PHYSICS.EXPLOSION_RADIUS) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const tx = x + dx;
                    const ty = y + dy;
                    const tile = this.world.getTile(tx, ty);
                    const props = TILE_PROPERTIES[tile];

                    if (props && props.hardness >= 0 && props.hardness < 5) {
                        // Destroy tile
                        this.world.setTile(tx, ty, TILE_TYPES.AIR);

                        // Register neighbors for physics
                        this.registerNeighbors(tx, ty);
                    }
                }
            }
        }

        return { x, y, radius };
    }

    /**
     * Register neighboring tiles for physics updates
     */
    registerNeighbors(x, y) {
        const neighbors = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
        ];

        for (const { dx, dy } of neighbors) {
            this.registerTile(x + dx, y + dy);
        }
    }

    /**
     * Called when a tile is mined
     */
    onTileMined(x, y, tileType) {
        const props = TILE_PROPERTIES[tileType];

        // Check if it was a gas pocket (explosive)
        if (props && props.explosive) {
            this.explode(x, y);
        }

        // Register neighbors for physics
        this.registerNeighbors(x, y);
    }

    /**
     * Scan a chunk for physics tiles
     */
    scanChunk(chunkX, chunkY, chunkSize) {
        const startX = chunkX * chunkSize;
        const startY = chunkY * chunkSize;

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                this.registerTile(worldX, worldY);
            }
        }
    }
}

export default PhysicsSystem;
