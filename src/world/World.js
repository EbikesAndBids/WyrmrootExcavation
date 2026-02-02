/**
 * World System
 * Manages the tile-based world with chunk storage and procedural generation
 */

import {
    TILE_SIZE, CHUNK_SIZE, TILE_TYPES, TILE_PROPERTIES,
    WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL
} from '../core/Constants.js';
import { WorldGenerator } from './WorldGenerator.js';

export class World {
    constructor() {
        this.chunks = new Map();
        this.generator = new WorldGenerator(this);

        // Track explored areas for minimap
        this.explored = new Set();

        // Track modified tiles
        this.modified = new Set();

        // Dragon root network
        this.dragonRoots = [];

        // Extraction network
        this.pipelines = [];
    }

    /**
     * Initialize the world
     */
    init(seed = Date.now()) {
        this.generator.seed = seed;
        this.generateInitialChunks();
    }

    /**
     * Generate chunks around spawn point
     */
    generateInitialChunks() {
        // Generate chunks around the spawn area
        const spawnChunkX = Math.floor(WORLD_WIDTH / 2 / CHUNK_SIZE);

        for (let cy = 0; cy < 8; cy++) {
            for (let cx = spawnChunkX - 2; cx <= spawnChunkX + 2; cx++) {
                this.generateChunk(cx, cy);
            }
        }
    }

    /**
     * Get chunk key from chunk coordinates
     */
    getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    /**
     * Get or generate a chunk
     */
    getChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);

        if (!this.chunks.has(key)) {
            this.generateChunk(chunkX, chunkY);
        }

        return this.chunks.get(key);
    }

    /**
     * Generate a single chunk
     */
    generateChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);

        if (this.chunks.has(key)) return;

        const chunk = this.generator.generateChunk(chunkX, chunkY);
        this.chunks.set(key, chunk);
    }

    /**
     * Get tile at world coordinates
     */
    getTile(x, y) {
        // Out of bounds check
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
            return TILE_TYPES.BEDROCK;
        }

        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const localX = x - chunkX * CHUNK_SIZE;
        const localY = y - chunkY * CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY);
        return chunk[localY * CHUNK_SIZE + localX];
    }

    /**
     * Set tile at world coordinates
     */
    setTile(x, y, tileType) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
            return false;
        }

        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const localX = x - chunkX * CHUNK_SIZE;
        const localY = y - chunkY * CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY);
        chunk[localY * CHUNK_SIZE + localX] = tileType;

        // Track modification
        this.modified.add(`${x},${y}`);

        return true;
    }

    /**
     * Check if tile is solid
     */
    isSolid(x, y) {
        const tile = this.getTile(x, y);
        const props = TILE_PROPERTIES[tile];
        return props ? props.solid : false;
    }

    /**
     * Get tile properties
     */
    getTileProperties(x, y) {
        const tile = this.getTile(x, y);
        return TILE_PROPERTIES[tile] || null;
    }

    /**
     * Mine a tile
     * Returns the drop item or null if can't be mined
     */
    mineTile(x, y, power) {
        const tile = this.getTile(x, y);
        const props = TILE_PROPERTIES[tile];

        if (!props || props.hardness < 0) {
            return null; // Unbreakable
        }

        if (power >= props.hardness) {
            this.setTile(x, y, TILE_TYPES.AIR);
            return props.drops;
        }

        return null;
    }

    /**
     * Mark tile as explored
     */
    explore(x, y) {
        this.explored.add(`${x},${y}`);
    }

    /**
     * Check if tile has been explored
     */
    isExplored(x, y) {
        return this.explored.has(`${x},${y}`);
    }

    /**
     * Get tiles in radius (for sonar)
     */
    getTilesInRadius(centerX, centerY, radius) {
        const tiles = [];

        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (dist <= radius) {
                    const tile = this.getTile(x, y);
                    if (tile !== TILE_TYPES.AIR) {
                        tiles.push({ x, y, type: tile, distance: dist });
                    }
                }
            }
        }

        return tiles;
    }

    /**
     * Find nearest dragon root to a position
     */
    findNearestRoot(x, y, maxRange) {
        let nearest = null;
        let nearestDist = Infinity;

        const tiles = this.getTilesInRadius(x, y, maxRange);

        for (const tile of tiles) {
            if (tile.type === TILE_TYPES.DRAGON_ROOT ||
                tile.type === TILE_TYPES.ROOT_CORE ||
                tile.type === TILE_TYPES.CAPILLARY) {

                if (tile.distance < nearestDist) {
                    nearestDist = tile.distance;
                    nearest = tile;
                }
            }
        }

        return nearest;
    }

    /**
     * Ensure chunks are generated around a position
     */
    ensureChunksAround(worldX, worldY, radius = 3) {
        const centerChunkX = Math.floor(worldX / TILE_SIZE / CHUNK_SIZE);
        const centerChunkY = Math.floor(worldY / TILE_SIZE / CHUNK_SIZE);

        for (let cy = centerChunkY - radius; cy <= centerChunkY + radius; cy++) {
            for (let cx = centerChunkX - radius; cx <= centerChunkX + radius; cx++) {
                if (cx >= 0 && cy >= 0) {
                    this.getChunk(cx, cy);
                }
            }
        }
    }

    /**
     * Get player spawn position
     */
    getSpawnPosition() {
        const spawnX = Math.floor(WORLD_WIDTH / 2);

        // Find surface level
        let spawnY = SURFACE_LEVEL;
        while (this.getTile(spawnX, spawnY) === TILE_TYPES.AIR && spawnY < WORLD_HEIGHT) {
            spawnY++;
        }

        return {
            x: spawnX * TILE_SIZE,
            y: (spawnY - 2) * TILE_SIZE
        };
    }
}

export default World;
