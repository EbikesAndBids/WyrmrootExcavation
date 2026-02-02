/**
 * Physics System
 * Handles falling sand/gravel, fluid simulation, and gas behavior
 */

import { TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, PHYSICS } from '../core/Constants.js';

export class PhysicsSystem {
    constructor(world) {
        this.world = world;
        this.lastGravityTick = 0;
        this.lastFluidTick = 0;

        // Track active physics tiles for optimization
        this.activeFallingTiles = new Set();
        this.activeFluidTiles = new Set();
        this.activeGasTiles = new Set();

        // Pending updates (to avoid modifying while iterating)
        this.pendingUpdates = [];
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
            this.activeFluidTiles.add(key);
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

        // Fluid updates
        this.updateFluids(deltaTime);

        // Gas updates
        this.updateGases(deltaTime);

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
                    this.activeFluidTiles.add(`${x},${y}`);
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
     * Update fluid tiles (water, lava, acid)
     */
    updateFluids(deltaTime) {
        const toRemove = [];
        const toAdd = [];

        for (const key of this.activeFluidTiles) {
            const [x, y] = key.split(',').map(Number);
            const tile = this.world.getTile(x, y);
            const props = TILE_PROPERTIES[tile];

            if (!props || !props.fluid) {
                toRemove.push(key);
                continue;
            }

            let moved = false;

            // Try to flow down first
            const below = this.world.getTile(x, y + 1);
            if (below === TILE_TYPES.AIR) {
                this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                this.pendingUpdates.push({ x, y: y + 1, tile });
                toRemove.push(key);
                toAdd.push(`${x},${y + 1}`);
                moved = true;
            } else if (below !== tile) {
                // Try to spread horizontally
                const spreadDir = Math.random() < 0.5 ? -1 : 1;

                for (let dir of [spreadDir, -spreadDir]) {
                    const sideX = x + dir;
                    const side = this.world.getTile(sideX, y);
                    const sideBelow = this.world.getTile(sideX, y + 1);

                    if (side === TILE_TYPES.AIR) {
                        // Spread sideways
                        this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                        this.pendingUpdates.push({ x: sideX, y, tile });
                        toRemove.push(key);
                        toAdd.push(`${sideX},${y}`);
                        moved = true;
                        break;
                    }
                }
            }

            // Check for lava + water = obsidian/steam
            if (tile === TILE_TYPES.LAVA) {
                this.checkLavaInteractions(x, y);
            }
        }

        for (const key of toRemove) this.activeFluidTiles.delete(key);
        for (const key of toAdd) this.activeFluidTiles.add(key);
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
                this.activeFluidTiles.delete(`${x},${y}`);
                this.activeFluidTiles.delete(`${nx},${ny}`);
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
                    // Dissipate over time
                    if (Math.random() < 0.01) {
                        this.pendingUpdates.push({ x, y, tile: TILE_TYPES.AIR });
                        toRemove.push(key);
                    }
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
