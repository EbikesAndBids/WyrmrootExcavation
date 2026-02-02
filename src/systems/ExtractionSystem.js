/**
 * Extraction System
 * Manages pipeline networks for extracting Wyrm Sap from Dragon Roots
 */

import { TILE_SIZE, TILE_TYPES, EXTRACTION } from '../core/Constants.js';

/**
 * Represents a pipe segment in the network
 */
class PipeSegment {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.connections = new Set(); // Adjacent connected pipes
        this.flowing = false;
        this.sapAmount = 0;
        this.maxCapacity = EXTRACTION.PIPE_CAPACITY;
    }

    connect(other) {
        this.connections.add(other);
        other.connections.add(this);
    }

    disconnect(other) {
        this.connections.delete(other);
        other.connections.delete(this);
    }
}

/**
 * Represents an extractor attached to a Dragon Root
 */
class Extractor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = false;
        this.extractionRate = EXTRACTION.SAP_FLOW_RATE;
        this.connectedRoot = null;
        this.outputPipe = null;
        this.sapBuffer = 0;
    }

    /**
     * Check if this extractor is adjacent to a dragon root
     */
    findAdjacentRoot(world) {
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 },  // Right
        ];

        for (const dir of directions) {
            const checkX = this.x + dir.dx;
            const checkY = this.y + dir.dy;
            const tile = world.getTile(checkX, checkY);

            if (tile === TILE_TYPES.DRAGON_ROOT ||
                tile === TILE_TYPES.ROOT_CORE ||
                tile === TILE_TYPES.CAPILLARY) {
                return { x: checkX, y: checkY, type: tile };
            }
        }

        return null;
    }

    /**
     * Update extractor
     */
    update(deltaTime, world) {
        if (!this.active || !this.connectedRoot) return 0;

        // Check if root still exists
        const rootTile = world.getTile(this.connectedRoot.x, this.connectedRoot.y);
        if (rootTile !== TILE_TYPES.DRAGON_ROOT &&
            rootTile !== TILE_TYPES.ROOT_CORE &&
            rootTile !== TILE_TYPES.CAPILLARY) {
            this.active = false;
            this.connectedRoot = null;
            return 0;
        }

        // Extract sap based on root type
        let extractRate = this.extractionRate;
        if (rootTile === TILE_TYPES.ROOT_CORE) {
            extractRate *= 2;
        } else if (rootTile === TILE_TYPES.CAPILLARY) {
            extractRate *= 0.5;
        }

        this.sapBuffer += extractRate * (deltaTime / 1000);
        return this.sapBuffer;
    }

    /**
     * Drain sap from buffer
     */
    drainSap(amount) {
        const drained = Math.min(amount, this.sapBuffer);
        this.sapBuffer -= drained;
        return drained;
    }
}

/**
 * Represents a pump that moves sap through the network
 */
class Pump {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = false;
        this.pumpRate = EXTRACTION.SAP_FLOW_RATE * 2;
        this.inputPipe = null;
        this.outputPipe = null;
    }

    update(deltaTime) {
        if (!this.active || !this.inputPipe || !this.outputPipe) return;

        // Move sap from input to output
        const toMove = Math.min(
            this.inputPipe.sapAmount,
            this.pumpRate * (deltaTime / 1000),
            this.outputPipe.maxCapacity - this.outputPipe.sapAmount
        );

        if (toMove > 0) {
            this.inputPipe.sapAmount -= toMove;
            this.outputPipe.sapAmount += toMove;
        }
    }
}

/**
 * Main Extraction System
 */
export class ExtractionSystem {
    constructor(world) {
        this.world = world;
        this.pipes = new Map(); // Key: "x,y", Value: PipeSegment
        this.extractors = new Map();
        this.pumps = new Map();

        // Collection point (surface storage)
        this.collectedSap = 0;
        this.collectionPoints = [];
    }

    /**
     * Get key for position
     */
    getKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Place a pipe at position
     */
    placePipe(x, y) {
        const key = this.getKey(x, y);

        if (this.pipes.has(key)) return false;

        const pipe = new PipeSegment(x, y);
        this.pipes.set(key, pipe);

        // Connect to adjacent pipes
        this.connectAdjacentPipes(pipe);

        // Update world tile
        this.world.setTile(x, y, TILE_TYPES.PIPE);

        return true;
    }

    /**
     * Place an extractor at position
     */
    placeExtractor(x, y) {
        const key = this.getKey(x, y);

        if (this.extractors.has(key)) return false;

        const extractor = new Extractor(x, y);

        // Find adjacent root
        const root = extractor.findAdjacentRoot(this.world);
        if (root) {
            extractor.connectedRoot = root;
            extractor.active = true;
        }

        // Find adjacent pipe for output
        const adjacentPipe = this.findAdjacentPipe(x, y);
        if (adjacentPipe) {
            extractor.outputPipe = adjacentPipe;
        }

        this.extractors.set(key, extractor);
        this.world.setTile(x, y, TILE_TYPES.EXTRACTOR);

        return true;
    }

    /**
     * Place a pump at position
     */
    placePump(x, y) {
        const key = this.getKey(x, y);

        if (this.pumps.has(key)) return false;

        const pump = new Pump(x, y);

        // Find input and output pipes
        const adjacentPipes = this.getAdjacentPipes(x, y);
        if (adjacentPipes.length >= 2) {
            pump.inputPipe = adjacentPipes[0];
            pump.outputPipe = adjacentPipes[1];
            pump.active = true;
        }

        this.pumps.set(key, pump);
        this.world.setTile(x, y, TILE_TYPES.PUMP);

        return true;
    }

    /**
     * Remove a pipe
     */
    removePipe(x, y) {
        const key = this.getKey(x, y);
        const pipe = this.pipes.get(key);

        if (!pipe) return false;

        // Disconnect from adjacent pipes
        for (const connected of pipe.connections) {
            connected.connections.delete(pipe);
        }

        this.pipes.delete(key);
        return true;
    }

    /**
     * Connect a pipe to adjacent pipes
     */
    connectAdjacentPipes(pipe) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const dir of directions) {
            const key = this.getKey(pipe.x + dir.dx, pipe.y + dir.dy);
            const adjacent = this.pipes.get(key);

            if (adjacent) {
                pipe.connect(adjacent);
            }
        }
    }

    /**
     * Find adjacent pipe to a position
     */
    findAdjacentPipe(x, y) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const dir of directions) {
            const key = this.getKey(x + dir.dx, y + dir.dy);
            const pipe = this.pipes.get(key);
            if (pipe) return pipe;
        }

        return null;
    }

    /**
     * Get all adjacent pipes
     */
    getAdjacentPipes(x, y) {
        const pipes = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
        ];

        for (const dir of directions) {
            const key = this.getKey(x + dir.dx, y + dir.dy);
            const pipe = this.pipes.get(key);
            if (pipe) pipes.push(pipe);
        }

        return pipes;
    }

    /**
     * Update the extraction system
     */
    update(deltaTime) {
        // Update extractors
        for (const extractor of this.extractors.values()) {
            extractor.update(deltaTime, this.world);

            // Transfer to output pipe
            if (extractor.outputPipe && extractor.sapBuffer > 0) {
                const space = extractor.outputPipe.maxCapacity - extractor.outputPipe.sapAmount;
                const transfer = extractor.drainSap(Math.min(space, 1));
                extractor.outputPipe.sapAmount += transfer;
            }
        }

        // Update pumps
        for (const pump of this.pumps.values()) {
            pump.update(deltaTime);
        }

        // Flow sap through connected pipes (simplified fluid simulation)
        this.simulateFlow(deltaTime);

        // Collect sap at collection points
        this.collectSap();
    }

    /**
     * Simple flow simulation
     */
    simulateFlow(deltaTime) {
        // For each pipe, try to equalize with connected pipes
        for (const pipe of this.pipes.values()) {
            pipe.flowing = pipe.sapAmount > 0.1;

            for (const connected of pipe.connections) {
                // Flow from higher to lower
                if (pipe.sapAmount > connected.sapAmount) {
                    const diff = (pipe.sapAmount - connected.sapAmount) / 2;
                    const flow = Math.min(diff, EXTRACTION.SAP_FLOW_RATE * (deltaTime / 1000));

                    // Gravity bonus for downward flow
                    const gravityBonus = connected.y > pipe.y ? 1.5 : 1;

                    pipe.sapAmount -= flow * gravityBonus;
                    connected.sapAmount += flow * gravityBonus;
                }
            }
        }
    }

    /**
     * Collect sap at collection points (surface pipes)
     */
    collectSap() {
        // Any pipe at y < 10 is considered a collection point
        for (const pipe of this.pipes.values()) {
            if (pipe.y < 10 && pipe.sapAmount > 0) {
                this.collectedSap += pipe.sapAmount;
                pipe.sapAmount = 0;
            }
        }
    }

    /**
     * Get total sap in the system
     */
    getTotalSapInSystem() {
        let total = 0;

        for (const pipe of this.pipes.values()) {
            total += pipe.sapAmount;
        }

        for (const extractor of this.extractors.values()) {
            total += extractor.sapBuffer;
        }

        return total;
    }

    /**
     * Get pipe network stats
     */
    getStats() {
        return {
            pipeCount: this.pipes.size,
            extractorCount: this.extractors.size,
            pumpCount: this.pumps.size,
            sapInSystem: this.getTotalSapInSystem(),
            collectedSap: this.collectedSap,
        };
    }

    /**
     * Render pipeline (for debugging/visualization)
     */
    render(ctx, camera) {
        // Draw pipes
        for (const pipe of this.pipes.values()) {
            const screenX = pipe.x * TILE_SIZE - camera.x;
            const screenY = pipe.y * TILE_SIZE - camera.y;

            // Skip if off screen
            if (screenX < -TILE_SIZE || screenX > camera.width ||
                screenY < -TILE_SIZE || screenY > camera.height) continue;

            // Draw connections
            ctx.strokeStyle = pipe.flowing ? '#00ffaa' : '#444444';
            ctx.lineWidth = 2;

            for (const connected of pipe.connections) {
                const cx = connected.x * TILE_SIZE + TILE_SIZE / 2 - camera.x;
                const cy = connected.y * TILE_SIZE + TILE_SIZE / 2 - camera.y;

                ctx.beginPath();
                ctx.moveTo(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }

            // Draw sap level indicator
            if (pipe.sapAmount > 0) {
                const fillHeight = (pipe.sapAmount / pipe.maxCapacity) * TILE_SIZE;
                ctx.fillStyle = 'rgba(0, 255, 170, 0.5)';
                ctx.fillRect(
                    screenX + 4,
                    screenY + TILE_SIZE - fillHeight,
                    TILE_SIZE - 8,
                    fillHeight
                );
            }
        }
    }
}

export default ExtractionSystem;
