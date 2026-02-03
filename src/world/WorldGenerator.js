/**
 * World Generator
 * Procedural generation for three dragon biomes
 */

import { CHUNK_SIZE, TILE_TYPES, WORLD_WIDTH, WORLD_HEIGHT, SURFACE_LEVEL, MINE_ENTRANCE_DEPTH, BIOMES } from '../core/Constants.js';

export class WorldGenerator {
    constructor(world) {
        this.world = world;
        this.seed = Date.now();
        this.rootNetwork = [];
        this.generateRootNetwork();
    }

    random(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    positionRandom(x, y, offset = 0) {
        return this.random(x * 374761393 + y * 668265263 + this.seed + offset);
    }

    noise(x, y, scale = 1) {
        const sx = x / scale;
        const sy = y / scale;
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const fx = sx - x0;
        const fy = sy - y0;
        const u = fx * fx * (3 - 2 * fx);
        const v = fy * fy * (3 - 2 * fy);
        const n00 = this.positionRandom(x0, y0);
        const n10 = this.positionRandom(x1, y0);
        const n01 = this.positionRandom(x0, y1);
        const n11 = this.positionRandom(x1, y1);
        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;
        return nx0 * (1 - v) + nx1 * v;
    }

    fractalNoise(x, y, octaves = 4, scale = 32) {
        let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency, scale) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return value / maxValue;
    }

    getBiome(depth) {
        if (depth < BIOMES.VERDANT_CRUST.minDepth) return BIOMES.SURFACE;
        if (depth < BIOMES.VERDANT_CRUST.maxDepth) return BIOMES.VERDANT_CRUST;
        if (depth < BIOMES.MAGMA_RIBS.maxDepth) return BIOMES.MAGMA_RIBS;
        return BIOMES.ABYSSAL_DEEP;
    }

    generateRootNetwork() {
        this.rootNetwork = [];
        // Layer 1: Vitae (3-4)
        for (let i = 0; i < 3 + Math.floor(this.random(this.seed) * 2); i++) {
            this.rootNetwork.push(this.generateDragonSkeleton('vitae', i, 50, 280));
        }
        // Layer 2: Ignis (2-3)
        for (let i = 0; i < 2 + Math.floor(this.random(this.seed + 100) * 2); i++) {
            this.rootNetwork.push(this.generateDragonSkeleton('ignis', i, 320, 580));
        }
        // Layer 3: Umbra (1-2)
        for (let i = 0; i < 1 + Math.floor(this.random(this.seed + 200) * 2); i++) {
            this.rootNetwork.push(this.generateDragonSkeleton('umbra', i, 620, 900));
        }
    }

    generateDragonSkeleton(type, index, minDepth, maxDepth) {
        const seed = this.seed + index * 1000 + (type === 'vitae' ? 0 : type === 'ignis' ? 10000 : 20000);
        const x = Math.floor(WORLD_WIDTH * 0.15 + WORLD_WIDTH * 0.7 * this.random(seed));
        const y = minDepth + Math.floor(this.random(seed + 1) * (maxDepth - minDepth));
        const baseSize = type === 'umbra' ? 40 : type === 'ignis' ? 30 : 20;
        const width = baseSize + Math.floor(this.random(seed + 2) * baseSize * 0.5);
        const height = baseSize * 0.6 + Math.floor(this.random(seed + 3) * baseSize * 0.3);
        const parts = ['skull', 'ribcage', 'spine', 'claw', 'wing'];
        const partType = parts[Math.floor(this.random(seed + 4) * parts.length)];
        const capillaries = this.generateCapillaries(x, y, type, index);
        return { x, y, width, height, type, partType, capillaries, coreX: x + Math.floor(width / 2), coreY: y + Math.floor(height / 2) };
    }

    generateCapillaries(rootX, rootY, type, rootIndex) {
        const capillaries = [];
        const numCapillaries = 4 + Math.floor(this.random(this.seed + rootIndex * 500) * 5);
        for (let i = 0; i < numCapillaries; i++) {
            const angle = (i / numCapillaries) * Math.PI * 2;
            const length = 25 + Math.floor(this.random(this.seed + rootIndex * 600 + i * 100) * 50);
            const points = [];
            let cx = rootX, cy = rootY;
            for (let j = 0; j < length; j++) {
                const wobble = Math.sin(j * 0.3 + this.random(this.seed + rootIndex * 700 + i * 50)) * 2;
                cx += Math.cos(angle) + wobble * Math.cos(angle + Math.PI / 2);
                cy += Math.sin(angle) * 0.5 - 0.2;
                points.push({ x: Math.floor(cx), y: Math.floor(cy) });
            }
            capillaries.push({ points, type });
        }
        return capillaries;
    }

    generateChunk(chunkX, chunkY) {
        const chunk = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
        const worldOffsetX = chunkX * CHUNK_SIZE;
        const worldOffsetY = chunkY * CHUNK_SIZE;

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                chunk[ly * CHUNK_SIZE + lx] = this.generateBaseTile(worldOffsetX + lx, worldOffsetY + ly);
            }
        }
        this.applyDragonRoots(chunk, worldOffsetX, worldOffsetY);
        this.applyFossils(chunk, worldOffsetX, worldOffsetY, chunkX, chunkY);
        this.applyHazards(chunk, worldOffsetX, worldOffsetY, chunkX, chunkY);
        return chunk;
    }

    generateBaseTile(x, y) {
        const worldCenterX = Math.floor(WORLD_WIDTH / 2);
        const mineWidth = 4; // Width of mine shaft opening
        const mineLeft = worldCenterX - Math.floor(mineWidth / 2);
        const mineRight = worldCenterX + Math.floor(mineWidth / 2);

        // Sky area (above surface)
        if (y < SURFACE_LEVEL - 2) {
            return TILE_TYPES.SKY;
        }

        // Surface terrain height variation
        const surfaceNoise = this.fractalNoise(x, 0, 2, 16) * 3;
        const surfaceY = SURFACE_LEVEL + Math.floor(surfaceNoise);

        // Check if we're in the mine entrance area
        const inMineX = x >= mineLeft && x <= mineRight;
        const inMineShaft = inMineX && y >= SURFACE_LEVEL - 2 && y < SURFACE_LEVEL + MINE_ENTRANCE_DEPTH;

        // Mine shaft opening - carved out area
        if (inMineShaft) {
            // Mine shaft walls (support beams on the sides)
            if (x === mineLeft || x === mineRight) {
                // Vertical support beams every few tiles
                if (y % 4 === 0) {
                    return TILE_TYPES.MINE_SUPPORT;
                }
                return TILE_TYPES.AIR;
            }
            // Ladder in the center
            if (x === worldCenterX) {
                return TILE_TYPES.MINE_LADDER;
            }
            // Open mine shaft
            return TILE_TYPES.AIR;
        }

        // Sky above surface
        if (y < surfaceY) {
            return TILE_TYPES.SKY;
        }

        // Surface grass layer (only where not mine)
        if (y === surfaceY && !inMineX) {
            return TILE_TYPES.GRASS;
        }

        // Surface dirt layer (few tiles below grass)
        if (y < surfaceY + 3 && !inMineX) {
            return TILE_TYPES.SURFACE_DIRT;
        }

        // Mine entrance structure (building above ground)
        if (y === SURFACE_LEVEL - 2 && (x === mineLeft - 1 || x === mineRight + 1)) {
            return TILE_TYPES.MINE_SUPPORT; // Side posts
        }
        if (y === SURFACE_LEVEL - 3 && x >= mineLeft - 1 && x <= mineRight + 1) {
            return TILE_TYPES.MINE_SUPPORT; // Roof beam
        }

        // Underground
        const depth = y - SURFACE_LEVEL;
        const biome = this.getBiome(depth);
        const caveScale = biome.id === 'abyss' ? 20 : biome.id === 'magma' ? 28 : 24;
        const caveNoise = this.fractalNoise(x, y, 3, caveScale);
        if (caveNoise > 0.58 + depth * 0.0001) return TILE_TYPES.AIR;
        if (y >= WORLD_HEIGHT - 5) return TILE_TYPES.BEDROCK;

        return this.getBiomeTile(x, y, depth, biome);
    }

    getBiomeTile(x, y, depth, biome) {
        const n1 = this.fractalNoise(x, y, 2, 8);
        const n2 = this.fractalNoise(x, y, 2, 16);
        switch (biome.id) {
            case 'surface': case 'verdant': return this.getVerdantTile(n1, n2, depth);
            case 'magma': return this.getMagmaTile(n1, n2, depth);
            case 'abyss': return this.getAbyssTile(n1, n2, depth);
            default: return TILE_TYPES.STONE;
        }
    }

    getVerdantTile(n1, n2, depth) {
        if (depth < 30) {
            if (n1 > 0.6) return TILE_TYPES.STONE;
            if (n2 > 0.85) return TILE_TYPES.GRAVEL;
            return TILE_TYPES.DIRT;
        } else if (depth < 150) {
            if (n1 > 0.7) return TILE_TYPES.PETRIFIED_WOOD;
            if (n2 > 0.9) return TILE_TYPES.AMBER;
            if (n1 > 0.4) return TILE_TYPES.STONE;
            if (n2 > 0.75) return TILE_TYPES.GRAVEL;
            return TILE_TYPES.DIRT;
        } else {
            if (n1 > 0.75) return TILE_TYPES.PETRIFIED_WOOD;
            if (n2 > 0.92) return TILE_TYPES.AMBER;
            return n1 > 0.3 ? TILE_TYPES.STONE : TILE_TYPES.DIRT;
        }
    }

    getMagmaTile(n1, n2, depth) {
        if (n1 > 0.85) return TILE_TYPES.OBSIDIAN;
        if (n2 > 0.88) return TILE_TYPES.ASH;
        if (n1 > 0.6) return TILE_TYPES.BASALT;
        return TILE_TYPES.VOLCANIC_ROCK;
    }

    getAbyssTile(n1, n2, depth) {
        if (n1 > 0.9) return TILE_TYPES.CRYSTAL;
        if (n2 > 0.85 && this.random(depth * 17) > 0.7) return TILE_TYPES.FLOATING_ROCK;
        if (n1 > 0.7) return TILE_TYPES.SHADOW_GLASS;
        return TILE_TYPES.VOID_STONE;
    }

    getRootTileTypes(type) {
        const types = {
            vitae: { capillary: TILE_TYPES.VITAE_CAPILLARY, root: TILE_TYPES.VITAE_ROOT, core: TILE_TYPES.VITAE_CORE },
            ignis: { capillary: TILE_TYPES.IGNIS_CAPILLARY, root: TILE_TYPES.IGNIS_ROOT, core: TILE_TYPES.IGNIS_CORE },
            umbra: { capillary: TILE_TYPES.UMBRA_CAPILLARY, root: TILE_TYPES.UMBRA_ROOT, core: TILE_TYPES.UMBRA_CORE },
        };
        return types[type];
    }

    applyDragonRoots(chunk, offsetX, offsetY) {
        for (const dragon of this.rootNetwork) {
            const inX = dragon.x + dragon.width >= offsetX && dragon.x < offsetX + CHUNK_SIZE;
            const inY = dragon.y + dragon.height >= offsetY && dragon.y < offsetY + CHUNK_SIZE;
            if (inX && inY) this.drawDragonBody(chunk, offsetX, offsetY, dragon);
            this.applyCapillaries(chunk, offsetX, offsetY, dragon.capillaries, dragon.type);
        }
    }

    drawDragonBody(chunk, offsetX, offsetY, dragon) {
        const rootType = this.getRootTileTypes(dragon.type);
        for (let dy = 0; dy < dragon.height; dy++) {
            for (let dx = 0; dx < dragon.width; dx++) {
                const lx = dragon.x + dx - offsetX;
                const ly = dragon.y + dy - offsetY;
                if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) continue;
                if (this.isInsideDragonShape(dx, dy, dragon)) {
                    const idx = ly * CHUNK_SIZE + lx;
                    const dist = Math.sqrt(Math.pow(dx - dragon.width / 2, 2) + Math.pow(dy - dragon.height / 2, 2));
                    const maxDist = Math.min(dragon.width, dragon.height) / 2;
                    chunk[idx] = dist < maxDist * 0.25 ? rootType.core : dist < maxDist * 0.6 ? rootType.root : rootType.capillary;
                }
            }
        }
        this.addDragonFossils(chunk, offsetX, offsetY, dragon);
    }

    isInsideDragonShape(dx, dy, dragon) {
        const cx = dragon.width / 2, cy = dragon.height / 2;
        const normX = (dx - cx) / (dragon.width / 2);
        const normY = (dy - cy) / (dragon.height / 2);
        const dist = normX * normX + normY * normY;
        return dist < (1 - this.positionRandom(dragon.x + dx, dragon.y + dy, 999) * 0.25);
    }

    addDragonFossils(chunk, offsetX, offsetY, dragon) {
        const fossilTypes = [TILE_TYPES.FOSSIL_BONE, TILE_TYPES.FOSSIL_CLAW, TILE_TYPES.FOSSIL_TOOTH];
        if (dragon.partType === 'skull' || dragon.partType === 'ribcage') {
            const fossilType = dragon.partType === 'skull' ? TILE_TYPES.FOSSIL_SKULL : TILE_TYPES.FOSSIL_RIBCAGE;
            const lx = dragon.x + Math.floor(dragon.width / 2) - offsetX;
            const ly = dragon.y - 3 - offsetY;
            if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) chunk[ly * CHUNK_SIZE + lx] = fossilType;
        }
        const numFossils = 3 + Math.floor(this.random(dragon.x * dragon.y) * 5);
        for (let i = 0; i < numFossils; i++) {
            const angle = this.random(dragon.x + i * 100) * Math.PI * 2;
            const dist = dragon.width * 0.6 + this.random(dragon.y + i * 100) * dragon.width * 0.4;
            const lx = dragon.x + Math.floor(dragon.width / 2 + Math.cos(angle) * dist) - offsetX;
            const ly = dragon.y + Math.floor(dragon.height / 2 + Math.sin(angle) * dist * 0.5) - offsetY;
            if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
                const idx = ly * CHUNK_SIZE + lx;
                if (chunk[idx] !== TILE_TYPES.AIR && chunk[idx] < 50) {
                    chunk[idx] = fossilTypes[Math.floor(this.random((dragon.x + lx) * (dragon.y + ly)) * 3)];
                }
            }
        }
    }

    applyCapillaries(chunk, offsetX, offsetY, capillaries, dragonType) {
        const rootType = this.getRootTileTypes(dragonType);
        for (const cap of capillaries) {
            for (const pt of cap.points) {
                const lx = pt.x - offsetX, ly = pt.y - offsetY;
                if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_SIZE) continue;
                const idx = ly * CHUNK_SIZE + lx;
                if (chunk[idx] !== TILE_TYPES.AIR && chunk[idx] < 50) chunk[idx] = rootType.capillary;
                if (this.positionRandom(pt.x, pt.y, 123) > 0.75) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nlx = lx + dx, nly = ly + dy;
                            if (nlx >= 0 && nlx < CHUNK_SIZE && nly >= 0 && nly < CHUNK_SIZE) {
                                const nidx = nly * CHUNK_SIZE + nlx;
                                if (chunk[nidx] !== TILE_TYPES.AIR && chunk[nidx] < 50) chunk[nidx] = rootType.capillary;
                            }
                        }
                    }
                }
            }
        }
    }

    applyFossils(chunk, offsetX, offsetY, chunkX, chunkY) {
        if (this.positionRandom(chunkX, chunkY, 5555) > 0.8) {
            const numFossils = 1 + Math.floor(this.positionRandom(chunkX, chunkY, 6666) * 4);
            const fossilTypes = [TILE_TYPES.FOSSIL_BONE, TILE_TYPES.FOSSIL_CLAW, TILE_TYPES.FOSSIL_TOOTH];
            for (let i = 0; i < numFossils; i++) {
                const lx = Math.floor(this.positionRandom(chunkX, chunkY, 7777 + i * 100) * CHUNK_SIZE);
                const ly = Math.floor(this.positionRandom(chunkX, chunkY, 8888 + i * 100) * CHUNK_SIZE);
                const idx = ly * CHUNK_SIZE + lx;
                if (chunk[idx] !== TILE_TYPES.AIR && chunk[idx] < 50) {
                    chunk[idx] = fossilTypes[Math.floor(this.positionRandom(chunkX, chunkY, 9999 + i) * 3)];
                }
            }
        }
    }

    applyHazards(chunk, offsetX, offsetY, chunkX, chunkY) {
        const centerY = offsetY + CHUNK_SIZE / 2;
        const biome = this.getBiome(centerY - SURFACE_LEVEL);

        if (biome.id === 'magma' && this.positionRandom(chunkX, chunkY, 11111) > 0.85) {
            const px = Math.floor(this.positionRandom(chunkX, chunkY, 11112) * CHUNK_SIZE);
            const py = Math.floor(this.positionRandom(chunkX, chunkY, 11113) * CHUNK_SIZE);
            this.createFluidPool(chunk, px, py, TILE_TYPES.LAVA, 3 + Math.floor(this.random(chunkX * chunkY) * 4));
        }
        if (biome.id === 'verdant') {
            if (this.positionRandom(chunkX, chunkY, 22222) > 0.9) {
                const px = Math.floor(this.positionRandom(chunkX, chunkY, 22223) * CHUNK_SIZE);
                const py = Math.floor(this.positionRandom(chunkX, chunkY, 22224) * CHUNK_SIZE);
                this.createFluidPool(chunk, px, py, TILE_TYPES.WATER, 2 + Math.floor(this.random(chunkX * chunkY + 1) * 3));
            }
            if (this.positionRandom(chunkX, chunkY, 33333) > 0.92) {
                const gx = Math.floor(this.positionRandom(chunkX, chunkY, 33334) * CHUNK_SIZE);
                const gy = Math.floor(this.positionRandom(chunkX, chunkY, 33335) * CHUNK_SIZE);
                const idx = gy * CHUNK_SIZE + gx;
                if (chunk[idx] === TILE_TYPES.AIR || chunk[idx] === TILE_TYPES.DIRT) chunk[idx] = TILE_TYPES.GAS_POCKET;
            }
        }
        if (biome.id === 'abyss' && this.positionRandom(chunkX, chunkY, 44444) > 0.88) {
            const px = Math.floor(this.positionRandom(chunkX, chunkY, 44445) * CHUNK_SIZE);
            const py = Math.floor(this.positionRandom(chunkX, chunkY, 44446) * CHUNK_SIZE);
            const fluidType = this.random(chunkX + chunkY) > 0.5 ? TILE_TYPES.UMBRA_OOZE : TILE_TYPES.ACID;
            this.createFluidPool(chunk, px, py, fluidType, 2 + Math.floor(this.random(chunkX * chunkY + 2) * 3));
        }
    }

    createFluidPool(chunk, cx, cy, fluidType, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    const x = cx + dx, y = cy + dy;
                    if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_SIZE && chunk[y * CHUNK_SIZE + x] === TILE_TYPES.AIR) {
                        chunk[y * CHUNK_SIZE + x] = fluidType;
                    }
                }
            }
        }
    }
}

export default WorldGenerator;
