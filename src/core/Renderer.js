/**
 * Renderer System - Optimized
 * Handles all canvas drawing operations with performance optimizations
 */

import { TILE_SIZE, TILE_TYPES, TILE_PROPERTIES } from './Constants.js';
import { assetManager } from './AssetManager.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Particle systems
        this.particles = [];

        // Cached glow colors (simple RGBA strings instead of gradients)
        this.glowColors = {
            [TILE_TYPES.CAPILLARY]: 'rgba(0, 170, 119, 0.15)',
            [TILE_TYPES.DRAGON_ROOT]: 'rgba(0, 255, 170, 0.25)',
            [TILE_TYPES.ROOT_CORE]: 'rgba(0, 255, 221, 0.35)',
        };

        // Pre-render glow sprite
        this.glowSprite = this.createGlowSprite();

        // Minimap throttling
        this.minimapFrameCounter = 0;
        this.minimapUpdateInterval = 6; // Update every 6 frames

        // Cache for background color
        this.lastDepthRange = -1;
        this.backgroundColors = null;

        // Pulse value (updated once per frame, not per tile)
        this.pulseValue = 1;
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
        this.ctx.fillStyle = '#0a0808';
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
        if (depth < 20) return 0;
        if (depth < 100) return 1;
        if (depth < 300) return 2;
        if (depth < 600) return 3;
        return 4;
    }

    /**
     * Draw background - simplified solid colors instead of gradient
     */
    drawBackground(camera, depth) {
        const pos = camera.getRenderPosition();
        const depthRange = this.getDepthRange(depth);

        // Use cached colors
        const colors = [
            '#1a1512', // Surface
            '#0f0d0a', // Shallow
            '#080606', // Deep
            '#040404', // Abyss
            '#020202', // Core
        ];

        this.ctx.fillStyle = colors[depthRange];
        this.ctx.fillRect(pos.x, pos.y, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw visible tiles from the world - optimized
     */
    drawTiles(world, camera) {
        const range = camera.getVisibleTileRange();
        const ctx = this.ctx;

        // Batch similar tiles together
        let currentSprite = null;
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
     * Draw the player - simplified
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

        // Simplified helmet glow - just a colored circle
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
        this.ctx.beginPath();
        this.ctx.arc(px + player.width / 2, py + 8, 60, 0, Math.PI * 2);
        this.ctx.fill();
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
        const specialTiles = [];

        for (const tile of revealedTiles) {
            if (tile.type === TILE_TYPES.DRAGON_ROOT ||
                tile.type === TILE_TYPES.ROOT_CORE ||
                tile.type === TILE_TYPES.CAPILLARY ||
                (tile.type >= TILE_TYPES.FOSSIL_BONE && tile.type <= TILE_TYPES.FOSSIL_TOOTH)) {
                specialTiles.push(tile);
            } else {
                normalTiles.push(tile);
            }
        }

        // Draw normal tiles in one batch
        if (normalTiles.length > 0) {
            ctx.fillStyle = `rgba(68, 170, 255, ${alpha * 0.1})`;
            for (const tile of normalTiles) {
                ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw special tiles
        if (specialTiles.length > 0) {
            ctx.fillStyle = `rgba(0, 255, 170, ${alpha * 0.3})`;
            for (const tile of specialTiles) {
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
     * Add a particle
     */
    addParticle(x, y, vx, vy, color, size, life) {
        if (this.particles.length > 100) return; // Limit particles
        this.particles.push({
            x, y, vx, vy, color, size, life,
            maxLife: life,
            alpha: 1,
        });
    }

    /**
     * Create mining particles
     */
    createMiningParticles(x, y, tileType) {
        const colors = {
            [TILE_TYPES.DIRT]: '#6a5738',
            [TILE_TYPES.STONE]: '#7a7a7a',
            [TILE_TYPES.CAPILLARY]: '#00ffaa',
            [TILE_TYPES.DRAGON_ROOT]: '#00ffdd',
        };
        const color = colors[tileType] || '#888888';

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

        // Only update every N frames
        if (this.minimapFrameCounter < this.minimapUpdateInterval) {
            return;
        }
        this.minimapFrameCounter = 0;

        const scale = 1; // Larger pixels = faster
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
            [TILE_TYPES.DIRT]: [58, 39, 24],
            [TILE_TYPES.STONE]: [74, 74, 74],
            [TILE_TYPES.HARD_STONE]: [50, 50, 50],
            [TILE_TYPES.CAPILLARY]: [0, 170, 119],
            [TILE_TYPES.DRAGON_ROOT]: [0, 255, 170],
            [TILE_TYPES.ROOT_CORE]: [0, 255, 221],
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
