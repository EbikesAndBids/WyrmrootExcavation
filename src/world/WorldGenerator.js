/**
 * World Generator
 * Procedural generation of terrain, dragon roots, and fossils
 */

import {
    CHUNK_SIZE, TILE_TYPES, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL
} from '../core/Constants.js';

export class WorldGenerator {
    constructor(world) {
        this.world = world;
        this.seed = Date.now();

        // Dragon root network data
        this.rootNetwork = [];
        this.generateRootNetwork();
    }

    /**
     * Simple seeded random number generator
     */
    random(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Get deterministic random for position
     */
    positionRandom(x, y, offset = 0) {
        return this.random(x * 374761393 + y * 668265263 + this.seed + offset);
    }

    /**
     * Noise function (simple value noise)
     */
    noise(x, y, scale = 1) {
        const sx = x / scale;
        const sy = y / scale;

        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const fx = sx - x0;
        const fy = sy - y0;

        // Smoothstep
        const u = fx * fx * (3 - 2 * fx);
        const v = fy * fy * (3 - 2 * fy);

        // Get corner values
        const n00 = this.positionRandom(x0, y0);
        const n10 = this.positionRandom(x1, y0);
        const n01 = this.positionRandom(x0, y1);
        const n11 = this.positionRandom(x1, y1);

        // Bilinear interpolation
        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;

        return nx0 * (1 - v) + nx1 * v;
    }

    /**
     * Fractal noise (multiple octaves)
     */
    fractalNoise(x, y, octaves = 4, scale = 32) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency, scale) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / maxValue;
    }

    /**
     * Generate the dragon root network (runs once at world creation)
     */
    generateRootNetwork() {
        this.rootNetwork = [];

        // Main roots - massive dragon remains
        const numMainRoots = 5 + Math.floor(this.random(this.seed) * 3);

        for (let i = 0; i < numMainRoots; i++) {
            const root = this.generateMainRoot(i);
            this.rootNetwork.push(root);
        }
    }

    /**
     * Generate a main dragon root structure
     */
    generateMainRoot(index) {
        const r = this.random(this.seed + index * 1000);

        // Position - spread across the world, deeper as we go
        const x = Math.floor(WORLD_WIDTH * 0.1 + WORLD_WIDTH * 0.8 * this.random(this.seed + index * 100));
        const minDepth = 50 + index * 80;
        const y = minDepth + Math.floor(this.random(this.seed + index * 200) * 100);

        // Size
        const width = 15 + Math.floor(r * 25);
        const height = 10 + Math.floor(this.random(this.seed + index * 300) * 20);

        // Dragon part type
        const partTypes = ['jaw', 'claw', 'spine', 'ribcage', 'skull'];
        const partType = partTypes[Math.floor(this.random(this.seed + index * 400) * partTypes.length)];

        // Capillary veins that lead to this root
        const capillaries = this.generateCapillaries(x, y, index);

        return {
            x, y, width, height,
            partType,
            capillaries,
            coreX: x + Math.floor(width / 2),
            coreY: y + Math.floor(height / 2),
        };
    }

    /**
     * Generate capillary veins leading to a main root
     */
    generateCapillaries(rootX, rootY, rootIndex) {
        const capillaries = [];
        const numCapillaries = 3 + Math.floor(this.random(this.seed + rootIndex * 500) * 4);

        for (let i = 0; i < numCapillaries; i++) {
            const angle = (i / numCapillaries) * Math.PI * 2;
            const length = 20 + Math.floor(this.random(this.seed + rootIndex * 600 + i * 100) * 40);

            // Capillary extends outward from the root
            const points = [];
            let cx = rootX;
            let cy = rootY;

            for (let j = 0; j < length; j++) {
                // Wavy movement outward
                const wobble = Math.sin(j * 0.3 + this.random(this.seed + rootIndex * 700 + i * 50)) * 2;
                cx += Math.cos(angle) + wobble * Math.cos(angle + Math.PI / 2);
                cy += Math.sin(angle) * 0.5 - 0.3; // Trend upward

                points.push({ x: Math.floor(cx), y: Math.floor(cy) });
            }

            capillaries.push(points);
        }

        return capillaries;
    }

    /**
     * Generate a single chunk
     */
    generateChunk(chunkX, chunkY) {
        const chunk = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
        const worldOffsetX = chunkX * CHUNK_SIZE;
        const worldOffsetY = chunkY * CHUNK_SIZE;

        // First pass: basic terrain
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const wx = worldOffsetX + lx;
                const wy = worldOffsetY + ly;

                chunk[ly * CHUNK_SIZE + lx] = this.generateBaseTile(wx, wy);
            }
        }

        // Second pass: dragon roots and capillaries
        this.applyDragonRoots(chunk, worldOffsetX, worldOffsetY);

        // Third pass: fossils
        this.applyFossils(chunk, worldOffsetX, worldOffsetY, chunkX, chunkY);

        return chunk;
    }

    /**
     * Generate base terrain tile
     */
    generateBaseTile(x, y) {
        // Above surface
        if (y < SURFACE_LEVEL) {
            return TILE_TYPES.AIR;
        }

        // Surface variation
        const surfaceNoise = this.fractalNoise(x, 0, 2, 16) * 3;
        const adjustedSurface = SURFACE_LEVEL + surfaceNoise;

        if (y < adjustedSurface) {
            return TILE_TYPES.AIR;
        }

        // Depth-based tile selection
        const depth = y - SURFACE_LEVEL;

        // Cave generation
        const caveNoise = this.fractalNoise(x, y, 3, 24);
        const caveThreshold = 0.55 + depth * 0.0002; // Caves get rarer with depth

        if (caveNoise > caveThreshold) {
            return TILE_TYPES.AIR;
        }

        // Bedrock at bottom
        if (y >= WORLD_HEIGHT - 5) {
            return TILE_TYPES.BEDROCK;
        }

        // Tile type based on depth
        if (depth < 30) {
            return TILE_TYPES.DIRT;
        } else if (depth < 150) {
            // Mix of dirt and stone
            const stoneNoise = this.fractalNoise(x, y, 2, 8);
            return stoneNoise > 0.4 ? TILE_TYPES.STONE : TILE_TYPES.DIRT;
        } else if (depth < 400) {
            // Mostly stone with hard stone
            const hardNoise = this.fractalNoise(x, y, 2, 12);
            return hardNoise > 0.7 ? TILE_TYPES.HARD_STONE : TILE_TYPES.STONE;
        } else {
            // Deep - mostly hard stone
            const hardNoise = this.fractalNoise(x, y, 2, 16);
            return hardNoise > 0.3 ? TILE_TYPES.HARD_STONE : TILE_TYPES.STONE;
        }
    }

    /**
     * Apply dragon roots to chunk
     */
    applyDragonRoots(chunk, offsetX, offsetY) {
        for (const root of this.rootNetwork) {
            // Check if root intersects this chunk
            if (root.x + root.width < offsetX || root.x > offsetX + CHUNK_SIZE ||
                root.y + root.height < offsetY || root.y > offsetY + CHUNK_SIZE) {

                // Still check capillaries
                this.applyCapillaries(chunk, offsetX, offsetY, root.capillaries);
                continue;
            }

            // Draw main root body
            for (let dy = 0; dy < root.height; dy++) {
                for (let dx = 0; dx < root.width; dx++) {
                    const wx = root.x + dx;
                    const wy = root.y + dy;
                    const lx = wx - offsetX;
                    const ly = wy - offsetY;

                    if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) continue;

                    // Shape the root based on part type
                    if (this.isInsideRootShape(dx, dy, root)) {
                        const idx = ly * CHUNK_SIZE + lx;

                        // Core at center
                        const distToCenter = Math.sqrt(
                            (dx - root.width / 2) ** 2 +
                            (dy - root.height / 2) ** 2
                        );
                        const maxDist = Math.min(root.width, root.height) / 2;

                        if (distToCenter < maxDist * 0.3) {
                            chunk[idx] = TILE_TYPES.ROOT_CORE;
                        } else {
                            chunk[idx] = TILE_TYPES.DRAGON_ROOT;
                        }
                    }
                }
            }

            // Apply capillaries
            this.applyCapillaries(chunk, offsetX, offsetY, root.capillaries);
        }
    }

    /**
     * Check if position is inside a dragon root shape
     */
    isInsideRootShape(dx, dy, root) {
        const cx = root.width / 2;
        const cy = root.height / 2;
        const rx = root.width / 2;
        const ry = root.height / 2;

        // Elliptical shape with noise
        const normX = (dx - cx) / rx;
        const normY = (dy - cy) / ry;
        const dist = normX * normX + normY * normY;

        // Add some organic irregularity
        const noise = this.positionRandom(root.x + dx, root.y + dy, 999) * 0.3;

        return dist < (1 - noise);
    }

    /**
     * Apply capillary veins to chunk
     */
    applyCapillaries(chunk, offsetX, offsetY, capillaries) {
        for (const capillary of capillaries) {
            for (const point of capillary) {
                const lx = point.x - offsetX;
                const ly = point.y - offsetY;

                if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) continue;

                const idx = ly * CHUNK_SIZE + lx;

                // Only place capillary if it's in solid ground
                if (chunk[idx] !== TILE_TYPES.AIR &&
                    chunk[idx] !== TILE_TYPES.DRAGON_ROOT &&
                    chunk[idx] !== TILE_TYPES.ROOT_CORE) {
                    chunk[idx] = TILE_TYPES.CAPILLARY;
                }

                // Occasionally make it thicker
                if (this.positionRandom(point.x, point.y, 123) > 0.7) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nlx = lx + dx;
                            const nly = ly + dy;
                            if (nlx < 0 || nlx >= CHUNK_SIZE || nly < 0 || nly >= CHUNK_SIZE) continue;

                            const nidx = nly * CHUNK_SIZE + nlx;
                            if (chunk[nidx] !== TILE_TYPES.AIR &&
                                chunk[nidx] !== TILE_TYPES.DRAGON_ROOT &&
                                chunk[nidx] !== TILE_TYPES.ROOT_CORE &&
                                chunk[nidx] !== TILE_TYPES.CAPILLARY) {
                                chunk[nidx] = TILE_TYPES.CAPILLARY;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Apply fossil decorations
     */
    applyFossils(chunk, offsetX, offsetY, chunkX, chunkY) {
        // Chance of fossil cluster in this chunk
        const fossilChance = this.positionRandom(chunkX, chunkY, 5555);

        if (fossilChance > 0.85) {
            const numFossils = 1 + Math.floor(this.positionRandom(chunkX, chunkY, 6666) * 3);

            for (let i = 0; i < numFossils; i++) {
                const lx = Math.floor(this.positionRandom(chunkX, chunkY, 7777 + i * 100) * CHUNK_SIZE);
                const ly = Math.floor(this.positionRandom(chunkX, chunkY, 8888 + i * 100) * CHUNK_SIZE);

                const idx = ly * CHUNK_SIZE + lx;

                // Only place in solid non-special tiles
                if (chunk[idx] === TILE_TYPES.DIRT ||
                    chunk[idx] === TILE_TYPES.STONE ||
                    chunk[idx] === TILE_TYPES.HARD_STONE) {

                    // Choose fossil type
                    const fossilRoll = this.positionRandom(chunkX, chunkY, 9999 + i * 100);
                    if (fossilRoll < 0.5) {
                        chunk[idx] = TILE_TYPES.FOSSIL_BONE;
                    } else if (fossilRoll < 0.8) {
                        chunk[idx] = TILE_TYPES.FOSSIL_CLAW;
                    } else {
                        chunk[idx] = TILE_TYPES.FOSSIL_TOOTH;
                    }
                }
            }
        }
    }
}

export default WorldGenerator;
