/**
 * Renderer System - Optimized
 * Handles all canvas drawing operations with performance optimizations
 * Updated for three biomes and new tile types
 * Now includes proper lighting/fog of war system
 */

import { TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, TILE_COLORS, BIOMES } from './Constants.js';
import { assetManager } from './AssetManager.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Particle systems
        this.particles = [];

        // Cached glow colors for all root types
        this.glowColors = {
            // Vitae (green)
            [TILE_TYPES.VITAE_CAPILLARY]: 'rgba(0, 255, 170, 0.15)',
            [TILE_TYPES.VITAE_ROOT]: 'rgba(0, 255, 170, 0.25)',
            [TILE_TYPES.VITAE_CORE]: 'rgba(0, 255, 221, 0.35)',
            // Ignis (orange/red)
            [TILE_TYPES.IGNIS_CAPILLARY]: 'rgba(255, 100, 0, 0.15)',
            [TILE_TYPES.IGNIS_ROOT]: 'rgba(255, 150, 0, 0.25)',
            [TILE_TYPES.IGNIS_CORE]: 'rgba(255, 200, 50, 0.35)',
            // Umbra (purple)
            [TILE_TYPES.UMBRA_CAPILLARY]: 'rgba(100, 0, 150, 0.15)',
            [TILE_TYPES.UMBRA_ROOT]: 'rgba(150, 0, 200, 0.25)',
            [TILE_TYPES.UMBRA_CORE]: 'rgba(200, 50, 255, 0.35)',
            // Other glowing tiles
            [TILE_TYPES.AMBER]: 'rgba(255, 200, 100, 0.2)',
            [TILE_TYPES.CRYSTAL]: 'rgba(150, 100, 255, 0.25)',
            [TILE_TYPES.LAVA]: 'rgba(255, 100, 0, 0.3)',
            [TILE_TYPES.ACID]: 'rgba(100, 255, 0, 0.2)',
            [TILE_TYPES.UMBRA_OOZE]: 'rgba(100, 0, 150, 0.25)',
        };

        // Light radii for glowing tiles (in tiles)
        this.lightRadii = {
            [TILE_TYPES.VITAE_CAPILLARY]: 2,
            [TILE_TYPES.VITAE_ROOT]: 3,
            [TILE_TYPES.VITAE_CORE]: 5,
            [TILE_TYPES.IGNIS_CAPILLARY]: 3,
            [TILE_TYPES.IGNIS_ROOT]: 4,
            [TILE_TYPES.IGNIS_CORE]: 6,
            [TILE_TYPES.UMBRA_CAPILLARY]: 2,
            [TILE_TYPES.UMBRA_ROOT]: 3,
            [TILE_TYPES.UMBRA_CORE]: 4,
            [TILE_TYPES.AMBER]: 2,
            [TILE_TYPES.CRYSTAL]: 4,
            [TILE_TYPES.LAVA]: 5,
            [TILE_TYPES.ACID]: 2,
            [TILE_TYPES.UMBRA_OOZE]: 3,
            [TILE_TYPES.OXYGEN_STATION]: 4,
        };

        // Pre-render glow sprite
        this.glowSprite = this.createGlowSprite();

        // Minimap throttling
        this.minimapFrameCounter = 0;
        this.minimapUpdateInterval = 6;

        // Cache for background color
        this.lastDepthRange = -1;
        this.backgroundColors = null;
        this.ambientColor = '#0a0808';

        // Pulse value (updated once per frame, not per tile)
        this.pulseValue = 1;

        // Lighting system
        this.playerLightRadius = 8; // tiles
        this.lightMap = null;
        this.lightMapWidth = 0;
        this.lightMapHeight = 0;
        this.lightMapStartX = 0;
        this.lightMapStartY = 0;

        // Create offscreen canvas for darkness overlay
        this.darknessCanvas = document.createElement('canvas');
        this.darknessCtx = this.darknessCanvas.getContext('2d');
    }

    /**
     * Set ambient color based on biome
     */
    setAmbientColor(color) {
        this.ambientColor = color;
    }

    /**
     * Create a pre-rendered glow sprite
     */
    createGlowSprite() {
        const size = TILE_SIZE * 3;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return canvas;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.ambientColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Begin render frame
     */
    begin(camera) {
        this.clear();

        // Update pulse once per frame
        this.pulseValue = 0.8 + Math.sin(performance.now() / 500) * 0.2;

        // Save state and apply camera transform
        this.ctx.save();
        const pos = camera.getRenderPosition();
        this.ctx.translate(Math.round(-pos.x), Math.round(-pos.y));
    }

    /**
     * End render frame
     */
    end() {
        this.ctx.restore();
    }

    /**
     * Get depth range for background caching
     */
    getDepthRange(depth) {
        if (depth < BIOMES.SURFACE.maxDepth) return 0;
        if (depth < BIOMES.VERDANT_CRUST.maxDepth) return 1;
        if (depth < BIOMES.MAGMA_RIBS.maxDepth) return 2;
        return 3;
    }

    /**
     * Draw background - biome-based colors
     */
    drawBackground(camera, depth, biome) {
        const pos = camera.getRenderPosition();

        // Use biome ambient color
        this.ctx.fillStyle = biome ? biome.ambientColor : this.ambientColor;
        this.ctx.fillRect(pos.x, pos.y, this.canvas.width, this.canvas.height);
    }

    /**
     * Compute light map for visible area
     */
    computeLightMap(world, camera, player) {
        const range = camera.getVisibleTileRange();
        const padding = 10; // Extra tiles for light bleed

        this.lightMapStartX = range.startX - padding;
        this.lightMapStartY = range.startY - padding;
        this.lightMapWidth = range.endX - range.startX + 1 + padding * 2;
        this.lightMapHeight = range.endY - range.startY + 1 + padding * 2;

        // Initialize light map to 0 (complete darkness)
        this.lightMap = new Float32Array(this.lightMapWidth * this.lightMapHeight);

        // Player position in tiles
        const playerTileX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
        const playerTileY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

        // Add player light
        this.addLight(playerTileX, playerTileY, this.playerLightRadius, 1.0);

        // Scan for light-emitting tiles
        for (let y = range.startY - padding; y <= range.endY + padding; y++) {
            for (let x = range.startX - padding; x <= range.endX + padding; x++) {
                const tile = world.getTile(x, y);
                const radius = this.lightRadii[tile];
                if (radius) {
                    // Glowing tiles emit light
                    this.addLight(x, y, radius, 0.7);
                }
            }
        }
    }

    /**
     * Add a light source to the light map
     */
    addLight(centerX, centerY, radius, intensity) {
        const radiusSq = radius * radius;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distSq = dx * dx + dy * dy;
                if (distSq > radiusSq) continue;

                const mapX = centerX + dx - this.lightMapStartX;
                const mapY = centerY + dy - this.lightMapStartY;

                if (mapX < 0 || mapX >= this.lightMapWidth || mapY < 0 || mapY >= this.lightMapHeight) continue;

                // Smooth falloff
                const dist = Math.sqrt(distSq);
                const falloff = 1 - (dist / radius);
                const lightValue = intensity * falloff * falloff; // Quadratic falloff

                const idx = mapY * this.lightMapWidth + mapX;
                this.lightMap[idx] = Math.min(1, this.lightMap[idx] + lightValue);
            }
        }
    }

    /**
     * Get light level at a tile position
     */
    getLightLevel(tileX, tileY) {
        if (!this.lightMap) return 1;

        const mapX = tileX - this.lightMapStartX;
        const mapY = tileY - this.lightMapStartY;

        if (mapX < 0 || mapX >= this.lightMapWidth || mapY < 0 || mapY >= this.lightMapHeight) {
            return 0;
        }

        return this.lightMap[mapY * this.lightMapWidth + mapX];
    }

    /**
     * Draw darkness overlay after tiles
     */
    drawDarknessOverlay(camera) {
        if (!this.lightMap) return;

        const range = camera.getVisibleTileRange();
        const ctx = this.ctx;

        // Draw darkness per tile
        for (let y = range.startY; y <= range.endY; y++) {
            for (let x = range.startX; x <= range.endX; x++) {
                const light = this.getLightLevel(x, y);
                if (light >= 0.95) continue; // Fully lit, skip

                const darkness = 1 - light;
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;

                ctx.fillStyle = `rgba(0, 0, 0, ${darkness * 0.9})`;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    /**
     * Draw visible tiles from the world - optimized
     */
    drawTiles(world, camera) {
        const range = camera.getVisibleTileRange();
        const ctx = this.ctx;

        // Collect glow tiles for batch rendering
        let glowTiles = [];

        for (let y = range.startY; y <= range.endY; y++) {
            for (let x = range.startX; x <= range.endX; x++) {
                const tile = world.getTile(x, y);
                if (tile === TILE_TYPES.AIR) continue;

                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;

                // Draw tile sprite
                const sprite = assetManager.getTileSprite(tile);
                if (sprite) {
                    ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
                } else {
                    // Fallback to color if no sprite
                    const color = TILE_COLORS[tile];
                    if (color && color !== 'transparent') {
                        ctx.fillStyle = color;
                        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    }
                }

                // Collect glow tiles for batch rendering
                const props = TILE_PROPERTIES[tile];
                if (props && props.glows) {
                    glowTiles.push({ x: screenX, y: screenY, type: tile });
                }
            }
        }

        // Batch render glow effects
        if (glowTiles.length > 0) {
            ctx.globalCompositeOperation = 'lighter';
            for (const glow of glowTiles) {
                const color = this.glowColors[glow.type];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        glow.x - TILE_SIZE,
                        glow.y - TILE_SIZE,
                        TILE_SIZE * 3,
                        TILE_SIZE * 3
                    );
                }
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * Draw the player - with state indicators
     */
    drawPlayer(player) {
        const sprite = assetManager.getSprite('player_idle');
        const px = Math.round(player.x);
        const py = Math.round(player.y);

        if (sprite) {
            if (player.facingLeft) {
                this.ctx.save();
                this.ctx.translate(px + player.width, py);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(sprite, 0, 0, player.width, player.height);
                this.ctx.restore();
            } else {
                this.ctx.drawImage(sprite, px, py, player.width, player.height);
            }
        } else {
            this.ctx.fillStyle = '#44aaff';
            this.ctx.fillRect(px, py, player.width, player.height);
        }

        // Helmet glow - color based on oxygen level
        this.ctx.globalCompositeOperation = 'lighter';
        const oxygenRatio = player.oxygen / player.maxOxygen;
        const glowR = Math.floor(255 * (1 - oxygenRatio));
        const glowG = Math.floor(255 * oxygenRatio);
        this.ctx.fillStyle = `rgba(${glowR}, ${glowG}, 170, 0.15)`;
        this.ctx.beginPath();
        this.ctx.arc(px + player.width / 2, py + 8, 60, 0, Math.PI * 2);
        this.ctx.fill();

        // Heat indicator when overheating
        if (player.heat > 50) {
            const heatAlpha = (player.heat / player.maxHeat) * 0.3;
            this.ctx.fillStyle = `rgba(255, 100, 0, ${heatAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(px + player.width / 2, py + player.height / 2, 40, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Draw sonar ping effect
     */
    drawSonarPing(x, y, radius, alpha) {
        if (alpha < 0.01) return;

        this.ctx.strokeStyle = `rgba(68, 170, 255, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    /**
     * Draw sonar revealed area - optimized with batching
     */
    drawSonarReveal(revealedTiles, alpha) {
        if (alpha < 0.01 || revealedTiles.length === 0) return;

        const ctx = this.ctx;

        // Group tiles by type for batched rendering
        const normalTiles = [];
        const vitaeTiles = [];
        const ignisTiles = [];
        const umbraTiles = [];
        const fossilTiles = [];

        for (const tile of revealedTiles) {
            if (tile.type >= TILE_TYPES.VITAE_CAPILLARY && tile.type <= TILE_TYPES.VITAE_CORE) {
                vitaeTiles.push(tile);
            } else if (tile.type >= TILE_TYPES.IGNIS_CAPILLARY && tile.type <= TILE_TYPES.IGNIS_CORE) {
                ignisTiles.push(tile);
            } else if (tile.type >= TILE_TYPES.UMBRA_CAPILLARY && tile.type <= TILE_TYPES.UMBRA_CORE) {
                umbraTiles.push(tile);
            } else if (tile.type >= TILE_TYPES.FOSSIL_BONE && tile.type <= TILE_TYPES.FOSSIL_RIBCAGE) {
                fossilTiles.push(tile);
            } else {
                normalTiles.push(tile);
            }
        }

        // Draw normal tiles
        if (normalTiles.length > 0) {
            ctx.fillStyle = `rgba(68, 170, 255, ${alpha * 0.1})`;
            for (const tile of normalTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw Vitae roots (green)
        if (vitaeTiles.length > 0) {
            ctx.fillStyle = `rgba(0, 255, 170, ${alpha * 0.3})`;
            for (const tile of vitaeTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw Ignis roots (orange)
        if (ignisTiles.length > 0) {
            ctx.fillStyle = `rgba(255, 150, 0, ${alpha * 0.3})`;
            for (const tile of ignisTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw Umbra roots (purple)
        if (umbraTiles.length > 0) {
            ctx.fillStyle = `rgba(150, 0, 200, ${alpha * 0.3})`;
            for (const tile of umbraTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw fossils (white)
        if (fossilTiles.length > 0) {
            ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.25})`;
            for (const tile of fossilTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    /**
     * Draw drill effect - simplified
     */
    drawDrillEffect(x, y, progress) {
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;

        // Simple progress arc
        this.ctx.strokeStyle = '#ff8844';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        this.ctx.stroke();
    }

    /**
     * Draw mining target highlight
     */
    drawMiningTarget(tileX, tileY, canMine) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;

        this.ctx.strokeStyle = canMine ? 'rgba(0, 255, 170, 0.8)' : 'rgba(255, 68, 68, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }

    /**
     * Draw placement preview for structures
     */
    drawPlacementPreview(tileX, tileY, type, world) {
        const screenX = tileX * TILE_SIZE;
        const screenY = tileY * TILE_SIZE;
        const currentTile = world.getTile(tileX, tileY);

        let canPlace = currentTile === TILE_TYPES.AIR;

        // Turrets need floor
        if (type === 'turret') {
            canPlace = canPlace && world.isSolid(tileX, tileY + 1);
        }

        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = canPlace ? '#88ff88' : '#ff4444';
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        this.ctx.globalAlpha = 1;

        this.ctx.strokeStyle = canPlace ? 'rgba(136, 255, 136, 0.8)' : 'rgba(255, 68, 68, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }

    /**
     * Add a particle
     */
    addParticle(x, y, vx, vy, color, size, life) {
        if (this.particles.length > 100) return;
        this.particles.push({
            x, y, vx, vy, color, size, life,
            maxLife: life,
            alpha: 1,
        });
    }

    /**
     * Create mining particles - biome-aware
     */
    createMiningParticles(x, y, tileType) {
        const color = TILE_COLORS[tileType] || '#888888';

        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.addParticle(
                x + TILE_SIZE / 2,
                y + TILE_SIZE / 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                color,
                2 + Math.random() * 2,
                20 + Math.random() * 15
            );
        }
    }

    /**
     * Update and draw all particles - optimized
     */
    updateParticles() {
        const ctx = this.ctx;
        const particles = this.particles;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            p.alpha = p.life / p.maxLife;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw minimap - throttled and optimized
     */
    drawMinimap(ctx, world, player, width, height) {
        this.minimapFrameCounter++;

        if (this.minimapFrameCounter < this.minimapUpdateInterval) {
            return;
        }
        this.minimapFrameCounter = 0;

        const scale = 1;
        const playerTileX = Math.floor(player.x / TILE_SIZE);
        const playerTileY = Math.floor(player.y / TILE_SIZE);

        const viewWidth = Math.floor(width / scale);
        const viewHeight = Math.floor(height / scale);

        const startX = playerTileX - Math.floor(viewWidth / 2);
        const startY = playerTileY - Math.floor(viewHeight / 2);

        // Clear
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Use ImageData for faster pixel manipulation
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const colors = {
            // Layer 1
            [TILE_TYPES.DIRT]: [58, 39, 24],
            [TILE_TYPES.STONE]: [74, 74, 74],
            [TILE_TYPES.PETRIFIED_WOOD]: [90, 64, 48],
            [TILE_TYPES.AMBER]: [212, 160, 32],
            [TILE_TYPES.GRAVEL]: [106, 106, 90],
            // Layer 2
            [TILE_TYPES.VOLCANIC_ROCK]: [58, 32, 32],
            [TILE_TYPES.BASALT]: [42, 42, 42],
            [TILE_TYPES.OBSIDIAN]: [26, 26, 42],
            [TILE_TYPES.ASH]: [90, 80, 80],
            // Layer 3
            [TILE_TYPES.VOID_STONE]: [26, 10, 42],
            [TILE_TYPES.CRYSTAL]: [128, 96, 192],
            [TILE_TYPES.FLOATING_ROCK]: [74, 58, 90],
            [TILE_TYPES.SHADOW_GLASS]: [42, 32, 64],
            // Roots
            [TILE_TYPES.VITAE_CAPILLARY]: [0, 170, 119],
            [TILE_TYPES.VITAE_ROOT]: [0, 255, 170],
            [TILE_TYPES.VITAE_CORE]: [0, 255, 221],
            [TILE_TYPES.IGNIS_CAPILLARY]: [204, 102, 0],
            [TILE_TYPES.IGNIS_ROOT]: [255, 153, 0],
            [TILE_TYPES.IGNIS_CORE]: [255, 204, 0],
            [TILE_TYPES.UMBRA_CAPILLARY]: [102, 0, 170],
            [TILE_TYPES.UMBRA_ROOT]: [153, 0, 255],
            [TILE_TYPES.UMBRA_CORE]: [204, 102, 255],
            // Fluids
            [TILE_TYPES.WATER]: [42, 80, 128],
            [TILE_TYPES.LAVA]: [255, 68, 0],
            [TILE_TYPES.ACID]: [64, 255, 64],
            [TILE_TYPES.UMBRA_OOZE]: [96, 32, 160],
            // Bedrock
            [TILE_TYPES.BEDROCK]: [30, 30, 30],
        };
        const defaultColor = [51, 51, 51];

        for (let y = 0; y < viewHeight; y++) {
            for (let x = 0; x < viewWidth; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const tile = world.getTile(worldX, worldY);

                if (tile === TILE_TYPES.AIR) continue;

                const color = colors[tile] || defaultColor;
                const pixelIndex = (y * width + x) * 4;

                data[pixelIndex] = color[0];
                data[pixelIndex + 1] = color[1];
                data[pixelIndex + 2] = color[2];
                data[pixelIndex + 3] = 255;
            }
        }

        // Draw player marker
        const markerX = Math.floor(viewWidth / 2);
        const markerY = Math.floor(viewHeight / 2);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const px = markerX + dx;
                const py = markerY + dy;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const idx = (py * width + px) * 4;
                    data[idx] = 68;
                    data[idx + 1] = 170;
                    data[idx + 2] = 255;
                    data[idx + 3] = 255;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

export default Renderer;
