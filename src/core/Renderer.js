/**
 * Renderer System
 * Handles all canvas drawing operations with layered rendering
 */

import { TILE_SIZE, TILE_TYPES, TILE_PROPERTIES, GLOW_COLORS } from './Constants.js';
import { assetManager } from './AssetManager.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Layers for different render passes
        this.layers = {
            background: [],
            tiles: [],
            entities: [],
            effects: [],
            ui: [],
        };

        // Lighting system
        this.ambientLight = 0.3;
        this.lightSources = [];

        // Particle systems
        this.particles = [];
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

        // Save state and apply camera transform
        this.ctx.save();
        const pos = camera.getRenderPosition();
        this.ctx.translate(-pos.x, -pos.y);
    }

    /**
     * End render frame
     */
    end() {
        this.ctx.restore();
    }

    /**
     * Draw background gradient based on depth
     */
    drawBackground(camera, depth) {
        const pos = camera.getRenderPosition();

        // Create gradient based on depth
        const gradient = this.ctx.createLinearGradient(0, pos.y, 0, pos.y + this.canvas.height);

        // Surface colors
        if (depth < 20) {
            gradient.addColorStop(0, '#1a1512');
            gradient.addColorStop(1, '#0f0d0a');
        }
        // Shallow earth
        else if (depth < 100) {
            gradient.addColorStop(0, '#0f0d0a');
            gradient.addColorStop(1, '#080606');
        }
        // Deep stone
        else if (depth < 300) {
            gradient.addColorStop(0, '#080606');
            gradient.addColorStop(1, '#040404');
        }
        // Abyss
        else if (depth < 600) {
            gradient.addColorStop(0, '#040404');
            gradient.addColorStop(1, '#020202');
        }
        // Dragon core
        else {
            gradient.addColorStop(0, '#020202');
            gradient.addColorStop(1, '#010101');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pos.x, pos.y, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw visible tiles from the world
     */
    drawTiles(world, camera) {
        const range = camera.getVisibleTileRange();

        for (let y = range.startY; y <= range.endY; y++) {
            for (let x = range.startX; x <= range.endX; x++) {
                const tile = world.getTile(x, y);
                if (tile === TILE_TYPES.AIR) continue;

                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;

                // Draw tile sprite or placeholder
                const sprite = assetManager.getTileSprite(tile);
                if (sprite) {
                    this.ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
                }

                // Draw glow effect for special tiles
                const props = TILE_PROPERTIES[tile];
                if (props && props.glows) {
                    this.drawTileGlow(screenX, screenY, tile);
                }
            }
        }
    }

    /**
     * Draw glow effect for bioluminescent tiles
     */
    drawTileGlow(x, y, tileType) {
        const glowColor = this.getGlowColor(tileType);
        if (!glowColor) return;

        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;
        const radius = TILE_SIZE * 1.5;

        // Pulsing effect
        const pulse = 0.8 + Math.sin(Date.now() / 500) * 0.2;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius * pulse
        );

        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - TILE_SIZE, y - TILE_SIZE, TILE_SIZE * 3, TILE_SIZE * 3);
    }

    getGlowColor(tileType) {
        switch (tileType) {
            case TILE_TYPES.CAPILLARY:
                return GLOW_COLORS.CAPILLARY;
            case TILE_TYPES.DRAGON_ROOT:
                return GLOW_COLORS.DRAGON_ROOT;
            case TILE_TYPES.ROOT_CORE:
                return GLOW_COLORS.ROOT_CORE;
            default:
                return null;
        }
    }

    /**
     * Draw an entity
     */
    drawEntity(entity) {
        if (entity.sprite) {
            this.ctx.drawImage(
                entity.sprite,
                Math.floor(entity.x),
                Math.floor(entity.y),
                entity.width,
                entity.height
            );
        } else {
            // Fallback rectangle
            this.ctx.fillStyle = entity.color || '#ff00ff';
            this.ctx.fillRect(
                Math.floor(entity.x),
                Math.floor(entity.y),
                entity.width,
                entity.height
            );
        }
    }

    /**
     * Draw the player
     */
    drawPlayer(player) {
        const sprite = assetManager.getSprite('player_idle');

        if (sprite) {
            // Flip sprite based on facing direction
            this.ctx.save();
            if (player.facingLeft) {
                this.ctx.translate(player.x + player.width, player.y);
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(sprite, 0, 0, player.width, player.height);
            } else {
                this.ctx.drawImage(sprite, player.x, player.y, player.width, player.height);
            }
            this.ctx.restore();
        } else {
            // Fallback
            this.ctx.fillStyle = '#44aaff';
            this.ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // Draw helmet glow
        this.drawHelmetGlow(player);
    }

    /**
     * Draw the bioluminescent helmet glow
     */
    drawHelmetGlow(player) {
        const glowRadius = 80;
        const centerX = player.x + player.width / 2;
        const centerY = player.y + 8;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );

        gradient.addColorStop(0, 'rgba(0, 255, 170, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 170, 0.1)');
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            centerX - glowRadius,
            centerY - glowRadius,
            glowRadius * 2,
            glowRadius * 2
        );
    }

    /**
     * Draw sonar ping effect
     */
    drawSonarPing(x, y, radius, alpha) {
        this.ctx.strokeStyle = `rgba(68, 170, 255, ${alpha})`;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner ring
        this.ctx.strokeStyle = `rgba(68, 170, 255, ${alpha * 0.5})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    /**
     * Draw sonar revealed area
     */
    drawSonarReveal(revealedTiles, alpha) {
        this.ctx.fillStyle = `rgba(68, 170, 255, ${alpha * 0.1})`;

        for (const tile of revealedTiles) {
            const screenX = tile.x * TILE_SIZE;
            const screenY = tile.y * TILE_SIZE;

            // Highlight special tiles
            if (tile.type === TILE_TYPES.DRAGON_ROOT || tile.type === TILE_TYPES.ROOT_CORE) {
                this.ctx.fillStyle = `rgba(0, 255, 170, ${alpha * 0.4})`;
            } else if (tile.type === TILE_TYPES.CAPILLARY) {
                this.ctx.fillStyle = `rgba(0, 170, 119, ${alpha * 0.3})`;
            } else if (tile.type >= TILE_TYPES.FOSSIL_BONE && tile.type <= TILE_TYPES.FOSSIL_TOOTH) {
                this.ctx.fillStyle = `rgba(212, 196, 168, ${alpha * 0.3})`;
            } else {
                this.ctx.fillStyle = `rgba(68, 170, 255, ${alpha * 0.1})`;
            }

            this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
    }

    /**
     * Draw drill effect
     */
    drawDrillEffect(x, y, progress) {
        const centerX = x + TILE_SIZE / 2;
        const centerY = y + TILE_SIZE / 2;

        // Drilling particles
        this.ctx.fillStyle = '#aa7744';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + Date.now() / 100;
            const dist = 8 + progress * 4;
            const px = centerX + Math.cos(angle) * dist;
            const py = centerY + Math.sin(angle) * dist;
            this.ctx.fillRect(px - 1, py - 1, 2, 2);
        }

        // Progress indicator
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
     * Draw particle
     */
    drawParticle(particle) {
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
        this.ctx.globalAlpha = 1;
    }

    /**
     * Add a particle
     */
    addParticle(x, y, vx, vy, color, size, life) {
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
        const color = this.getTileParticleColor(tileType);
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.addParticle(
                x + TILE_SIZE / 2,
                y + TILE_SIZE / 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                color,
                2 + Math.random() * 2,
                30 + Math.random() * 20
            );
        }
    }

    getTileParticleColor(tileType) {
        switch (tileType) {
            case TILE_TYPES.DIRT: return '#6a5738';
            case TILE_TYPES.STONE: return '#7a7a7a';
            case TILE_TYPES.CAPILLARY: return '#00ffaa';
            case TILE_TYPES.DRAGON_ROOT: return '#00ffdd';
            default: return '#888888';
        }
    }

    /**
     * Update and draw all particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.life--;
            p.alpha = p.life / p.maxLife;

            // Draw
            this.drawParticle(p);

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draw extraction pipeline
     */
    drawPipeline(pipeline) {
        for (const segment of pipeline.segments) {
            const x = segment.x * TILE_SIZE;
            const y = segment.y * TILE_SIZE;

            // Draw pipe
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(x + 4, y + 6, TILE_SIZE - 8, 4);

            // Draw sap flow if active
            if (segment.flowing) {
                const flowOffset = (Date.now() / 100) % TILE_SIZE;
                this.ctx.fillStyle = '#00ffaa';
                this.ctx.fillRect(x + flowOffset, y + 7, 4, 2);
            }
        }
    }

    /**
     * Draw minimap
     */
    drawMinimap(ctx, world, player, width, height) {
        const scale = 0.5;
        const playerTileX = Math.floor(player.x / TILE_SIZE);
        const playerTileY = Math.floor(player.y / TILE_SIZE);

        const viewWidth = Math.floor(width / scale);
        const viewHeight = Math.floor(height / scale);

        const startX = playerTileX - Math.floor(viewWidth / 2);
        const startY = playerTileY - Math.floor(viewHeight / 2);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        for (let y = 0; y < viewHeight; y++) {
            for (let x = 0; x < viewWidth; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const tile = world.getTile(worldX, worldY);

                if (tile === TILE_TYPES.AIR) continue;

                // Get color
                let color;
                switch (tile) {
                    case TILE_TYPES.DIRT: color = '#3a2718'; break;
                    case TILE_TYPES.STONE: color = '#4a4a4a'; break;
                    case TILE_TYPES.CAPILLARY: color = '#00aa77'; break;
                    case TILE_TYPES.DRAGON_ROOT: color = '#00ffaa'; break;
                    case TILE_TYPES.ROOT_CORE: color = '#00ffdd'; break;
                    default: color = '#333333';
                }

                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        // Draw player marker
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(
            (viewWidth / 2) * scale - 1,
            (viewHeight / 2) * scale - 1,
            3,
            3
        );
    }
}

export default Renderer;
