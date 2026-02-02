/**
 * Asset Manager
 * Handles loading and caching of game assets
 * Provides placeholder generation for missing assets
 * Easy to replace placeholders with custom pixel art
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from './Constants.js';

class AssetManager {
    constructor() {
        this.sprites = new Map();
        this.sounds = new Map();
        this.loaded = false;
        this.loadProgress = 0;

        // Asset manifest - defines all assets and their paths
        // When creating custom assets, place them at these paths
        this.manifest = {
            sprites: {
                // Tiles
                'tile_dirt': 'assets/sprites/tiles/dirt.png',
                'tile_stone': 'assets/sprites/tiles/stone.png',
                'tile_hard_stone': 'assets/sprites/tiles/hard_stone.png',
                'tile_bedrock': 'assets/sprites/tiles/bedrock.png',
                'tile_capillary': 'assets/sprites/tiles/capillary.png',
                'tile_dragon_root': 'assets/sprites/tiles/dragon_root.png',
                'tile_root_core': 'assets/sprites/tiles/root_core.png',
                'tile_fossil_bone': 'assets/sprites/tiles/fossil_bone.png',
                'tile_fossil_claw': 'assets/sprites/tiles/fossil_claw.png',
                'tile_fossil_tooth': 'assets/sprites/tiles/fossil_tooth.png',
                'tile_pipe': 'assets/sprites/tiles/pipe.png',
                'tile_extractor': 'assets/sprites/tiles/extractor.png',
                'tile_pump': 'assets/sprites/tiles/pump.png',

                // Player
                'player_idle': 'assets/sprites/player/idle.png',
                'player_walk': 'assets/sprites/player/walk.png',
                'player_drill': 'assets/sprites/player/drill.png',
                'player_fall': 'assets/sprites/player/fall.png',

                // Tools
                'tool_drill': 'assets/sprites/tools/drill.png',
                'tool_sonar': 'assets/sprites/tools/sonar.png',
                'tool_pipe': 'assets/sprites/tools/pipe.png',
                'tool_extractor': 'assets/sprites/tools/extractor.png',

                // Effects
                'effect_sonar_ping': 'assets/sprites/effects/sonar_ping.png',
                'effect_drill_particles': 'assets/sprites/effects/drill_particles.png',
                'effect_sap_drip': 'assets/sprites/effects/sap_drip.png',
                'effect_glow': 'assets/sprites/effects/glow.png',

                // UI
                'ui_heart': 'assets/sprites/ui/heart.png',
                'ui_sap_icon': 'assets/sprites/ui/sap_icon.png',

                // Creatures (for future immune response)
                'creature_antibody': 'assets/sprites/creatures/antibody.png',
                'creature_wyrm': 'assets/sprites/creatures/wyrm.png',
            },
            audio: {
                'sfx_drill': 'assets/audio/drill.wav',
                'sfx_break': 'assets/audio/break.wav',
                'sfx_sonar': 'assets/audio/sonar.wav',
                'sfx_sap_flow': 'assets/audio/sap_flow.wav',
                'sfx_discovery': 'assets/audio/discovery.wav',
                'music_ambient': 'assets/audio/ambient.ogg',
            }
        };

        // Placeholder canvas for generating placeholders
        this.placeholderCanvas = document.createElement('canvas');
        this.placeholderCtx = this.placeholderCanvas.getContext('2d');
    }

    /**
     * Load all assets, generating placeholders for missing ones
     */
    async load(progressCallback) {
        const totalAssets = Object.keys(this.manifest.sprites).length +
                          Object.keys(this.manifest.audio).length;
        let loadedCount = 0;

        // Load sprites
        for (const [key, path] of Object.entries(this.manifest.sprites)) {
            try {
                const sprite = await this.loadImage(path);
                this.sprites.set(key, sprite);
            } catch (e) {
                // Generate placeholder
                const placeholder = this.generatePlaceholder(key);
                this.sprites.set(key, placeholder);
                console.log(`Generated placeholder for: ${key}`);
            }
            loadedCount++;
            this.loadProgress = loadedCount / totalAssets;
            if (progressCallback) progressCallback(this.loadProgress);
        }

        // Load sounds (skip for now, just mark as loaded)
        for (const [key, path] of Object.entries(this.manifest.audio)) {
            // Audio loading can be added later
            loadedCount++;
            this.loadProgress = loadedCount / totalAssets;
            if (progressCallback) progressCallback(this.loadProgress);
        }

        this.loaded = true;
        return true;
    }

    /**
     * Load an image from a path with timeout
     */
    loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let settled = false;

            // Timeout after 2 seconds
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    reject(new Error(`Timeout loading: ${path}`));
                }
            }, 2000);

            img.onload = () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    resolve(img);
                }
            };

            img.onerror = () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    reject(new Error(`Failed to load: ${path}`));
                }
            };

            img.src = path;
        });
    }

    /**
     * Generate a placeholder sprite based on the asset key
     */
    generatePlaceholder(key) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Determine size based on key prefix
        if (key.startsWith('tile_')) {
            canvas.width = TILE_SIZE;
            canvas.height = TILE_SIZE;
            this.generateTilePlaceholder(ctx, key);
        } else if (key.startsWith('player_')) {
            canvas.width = 16;
            canvas.height = 32;
            this.generatePlayerPlaceholder(ctx, key);
        } else if (key.startsWith('tool_')) {
            canvas.width = 24;
            canvas.height = 24;
            this.generateToolPlaceholder(ctx, key);
        } else if (key.startsWith('effect_')) {
            canvas.width = 32;
            canvas.height = 32;
            this.generateEffectPlaceholder(ctx, key);
        } else if (key.startsWith('creature_')) {
            canvas.width = 24;
            canvas.height = 24;
            this.generateCreaturePlaceholder(ctx, key);
        } else {
            canvas.width = 16;
            canvas.height = 16;
            ctx.fillStyle = '#ff00ff'; // Magenta for unknown
            ctx.fillRect(0, 0, 16, 16);
        }

        return canvas;
    }

    /**
     * Generate tile placeholder with appropriate colors and patterns
     */
    generateTilePlaceholder(ctx, key) {
        const size = TILE_SIZE;
        const tileType = this.getTileTypeFromKey(key);
        const baseColor = TILE_COLORS[tileType] || '#ff00ff';

        // Fill base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);

        // Add texture variation based on tile type
        if (key.includes('dirt')) {
            this.addDirtTexture(ctx, size);
        } else if (key.includes('stone')) {
            this.addStoneTexture(ctx, size, key.includes('hard'));
        } else if (key.includes('capillary') || key.includes('dragon_root') || key.includes('root_core')) {
            this.addRootTexture(ctx, size, key);
        } else if (key.includes('fossil')) {
            this.addFossilTexture(ctx, size, key);
        } else if (key.includes('pipe') || key.includes('extractor') || key.includes('pump')) {
            this.addMachineTexture(ctx, size, key);
        }

        // Add subtle border for visibility
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    }

    addDirtTexture(ctx, size) {
        // Add random darker pixels for texture
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            ctx.fillRect(x, y, 1, 1);
        }
        // Add some lighter pixels
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    addStoneTexture(ctx, size, isHard) {
        // Add crack-like patterns
        ctx.fillStyle = isHard ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 6; i++) {
            const x = Math.floor(Math.random() * (size - 2));
            const y = Math.floor(Math.random() * size);
            ctx.fillRect(x, y, 2, 1);
        }
        // Add highlights
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            ctx.fillRect(x, y, 1, 1);
        }
    }

    addRootTexture(ctx, size, key) {
        // Add pulsing vein pattern
        const intensity = key.includes('core') ? 1 : key.includes('dragon') ? 0.7 : 0.4;

        // Central vein
        ctx.fillStyle = `rgba(255,255,255,${0.3 * intensity})`;
        ctx.fillRect(size/2 - 1, 0, 2, size);
        ctx.fillRect(0, size/2 - 1, size, 2);

        // Glow effect
        ctx.fillStyle = `rgba(0,255,200,${0.2 * intensity})`;
        ctx.fillRect(size/2 - 2, 0, 4, size);
        ctx.fillRect(0, size/2 - 2, size, 4);
    }

    addFossilTexture(ctx, size, key) {
        // Add bone-like patterns
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        if (key.includes('bone')) {
            // Horizontal bone pattern
            ctx.fillRect(2, size/2 - 1, size - 4, 2);
            ctx.fillRect(3, size/2 - 2, 2, 4);
            ctx.fillRect(size - 5, size/2 - 2, 2, 4);
        } else if (key.includes('claw')) {
            // Curved claw shape
            ctx.beginPath();
            ctx.arc(size/2, size, size/2, Math.PI, 0, true);
            ctx.fill();
        } else if (key.includes('tooth')) {
            // Triangle tooth shape
            ctx.beginPath();
            ctx.moveTo(size/2, 2);
            ctx.lineTo(size - 3, size - 2);
            ctx.lineTo(3, size - 2);
            ctx.fill();
        }
    }

    addMachineTexture(ctx, size, key) {
        // Add mechanical details
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(2, 2, size - 4, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(2, size - 4, size - 4, 2);

        if (key.includes('extractor')) {
            // Add extraction symbol
            ctx.fillStyle = '#aa44ff';
            ctx.fillRect(size/2 - 2, size/2 - 2, 4, 4);
        } else if (key.includes('pump')) {
            // Add pump symbol
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    generatePlayerPlaceholder(ctx, key) {
        // Simple character silhouette
        ctx.fillStyle = '#44aaff';

        // Head
        ctx.fillRect(4, 2, 8, 8);

        // Body
        ctx.fillRect(3, 10, 10, 12);

        // Helmet glow (bioluminescent moss)
        ctx.fillStyle = 'rgba(0,255,170,0.5)';
        ctx.fillRect(5, 0, 6, 3);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, 4, 2, 2);
        ctx.fillRect(9, 4, 2, 2);

        if (key.includes('drill')) {
            // Add drill arm
            ctx.fillStyle = '#ff8844';
            ctx.fillRect(13, 12, 3, 6);
        }
    }

    generateToolPlaceholder(ctx, key) {
        ctx.fillStyle = '#666666';

        if (key.includes('drill')) {
            ctx.fillStyle = '#ff8844';
            // Drill shape
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.lineTo(20, 12);
            ctx.lineTo(12, 22);
            ctx.lineTo(4, 12);
            ctx.fill();
            ctx.fillStyle = '#aa5522';
            ctx.fillRect(8, 8, 8, 8);
        } else if (key.includes('sonar')) {
            ctx.fillStyle = '#44aaff';
            // Radar dish
            ctx.beginPath();
            ctx.arc(12, 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2288dd';
            ctx.beginPath();
            ctx.arc(12, 12, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (key.includes('pipe')) {
            ctx.fillStyle = '#888888';
            ctx.fillRect(4, 10, 16, 4);
            ctx.fillStyle = '#666666';
            ctx.fillRect(2, 8, 4, 8);
            ctx.fillRect(18, 8, 4, 8);
        } else if (key.includes('extractor')) {
            ctx.fillStyle = '#aa44ff';
            // Hexagonal extractor
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.lineTo(22, 7);
            ctx.lineTo(22, 17);
            ctx.lineTo(12, 22);
            ctx.lineTo(2, 17);
            ctx.lineTo(2, 7);
            ctx.fill();
        }
    }

    generateEffectPlaceholder(ctx, key) {
        if (key.includes('sonar')) {
            // Expanding ring
            ctx.strokeStyle = 'rgba(68, 170, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(16, 16, 12, 0, Math.PI * 2);
            ctx.stroke();
        } else if (key.includes('drill')) {
            // Particle burst
            ctx.fillStyle = '#aa7744';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x = 16 + Math.cos(angle) * 8;
                const y = 16 + Math.sin(angle) * 8;
                ctx.fillRect(x - 1, y - 1, 3, 3);
            }
        } else if (key.includes('sap')) {
            // Dripping effect
            ctx.fillStyle = '#00ffaa';
            ctx.beginPath();
            ctx.arc(16, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(14, 10);
            ctx.lineTo(18, 10);
            ctx.lineTo(16, 20);
            ctx.fill();
        } else if (key.includes('glow')) {
            // Radial glow
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(0, 255, 170, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 255, 170, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
        }
    }

    generateCreaturePlaceholder(ctx, key) {
        if (key.includes('antibody')) {
            // Blob-like creature
            ctx.fillStyle = '#ff4466';
            ctx.beginPath();
            ctx.arc(12, 12, 8, 0, Math.PI * 2);
            ctx.fill();
            // Pseudopods
            ctx.fillRect(2, 10, 4, 4);
            ctx.fillRect(18, 10, 4, 4);
            ctx.fillRect(10, 2, 4, 4);
            ctx.fillRect(10, 18, 4, 4);
            // Eye
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(10, 10, 4, 4);
            ctx.fillStyle = '#000000';
            ctx.fillRect(11, 11, 2, 2);
        } else if (key.includes('wyrm')) {
            // Worm-like creature
            ctx.fillStyle = '#00ddaa';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(4 + i * 4, 12 + Math.sin(i) * 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            // Head
            ctx.fillStyle = '#00ffcc';
            ctx.beginPath();
            ctx.arc(20, 12, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getTileTypeFromKey(key) {
        const mapping = {
            'tile_dirt': TILE_TYPES.DIRT,
            'tile_stone': TILE_TYPES.STONE,
            'tile_hard_stone': TILE_TYPES.HARD_STONE,
            'tile_bedrock': TILE_TYPES.BEDROCK,
            'tile_capillary': TILE_TYPES.CAPILLARY,
            'tile_dragon_root': TILE_TYPES.DRAGON_ROOT,
            'tile_root_core': TILE_TYPES.ROOT_CORE,
            'tile_fossil_bone': TILE_TYPES.FOSSIL_BONE,
            'tile_fossil_claw': TILE_TYPES.FOSSIL_CLAW,
            'tile_fossil_tooth': TILE_TYPES.FOSSIL_TOOTH,
            'tile_pipe': TILE_TYPES.PIPE,
            'tile_extractor': TILE_TYPES.EXTRACTOR,
            'tile_pump': TILE_TYPES.PUMP,
        };
        return mapping[key] || TILE_TYPES.AIR;
    }

    /**
     * Get a sprite by key
     */
    getSprite(key) {
        return this.sprites.get(key);
    }

    /**
     * Get tile sprite by tile type
     */
    getTileSprite(tileType) {
        const mapping = {
            [TILE_TYPES.DIRT]: 'tile_dirt',
            [TILE_TYPES.STONE]: 'tile_stone',
            [TILE_TYPES.HARD_STONE]: 'tile_hard_stone',
            [TILE_TYPES.BEDROCK]: 'tile_bedrock',
            [TILE_TYPES.CAPILLARY]: 'tile_capillary',
            [TILE_TYPES.DRAGON_ROOT]: 'tile_dragon_root',
            [TILE_TYPES.ROOT_CORE]: 'tile_root_core',
            [TILE_TYPES.FOSSIL_BONE]: 'tile_fossil_bone',
            [TILE_TYPES.FOSSIL_CLAW]: 'tile_fossil_claw',
            [TILE_TYPES.FOSSIL_TOOTH]: 'tile_fossil_tooth',
            [TILE_TYPES.PIPE]: 'tile_pipe',
            [TILE_TYPES.EXTRACTOR]: 'tile_extractor',
            [TILE_TYPES.PUMP]: 'tile_pump',
        };
        const key = mapping[tileType];
        return key ? this.sprites.get(key) : null;
    }
}

// Export singleton instance
export const assetManager = new AssetManager();
export default assetManager;
