/**
 * Asset Manager
 * Handles loading and caching of game assets
 * Provides placeholder generation for missing assets
 * Updated for three biomes and new tile types
 */

import { TILE_SIZE, TILE_TYPES, TILE_COLORS } from './Constants.js';

class AssetManager {
    constructor() {
        this.sprites = new Map();
        this.sounds = new Map();
        this.loaded = false;
        this.loadProgress = 0;

        // Asset manifest - defines all assets and their paths
        this.manifest = {
            sprites: {
                // Layer 1: Verdant Crust tiles
                'tile_dirt': 'assets/sprites/tiles/dirt.png',
                'tile_stone': 'assets/sprites/tiles/stone.png',
                'tile_petrified_wood': 'assets/sprites/tiles/petrified_wood.png',
                'tile_amber': 'assets/sprites/tiles/amber.png',
                'tile_gravel': 'assets/sprites/tiles/gravel.png',

                // Layer 2: Magma Ribs tiles
                'tile_volcanic_rock': 'assets/sprites/tiles/volcanic_rock.png',
                'tile_basalt': 'assets/sprites/tiles/basalt.png',
                'tile_obsidian': 'assets/sprites/tiles/obsidian.png',
                'tile_ash': 'assets/sprites/tiles/ash.png',

                // Layer 3: Abyssal Deep tiles
                'tile_void_stone': 'assets/sprites/tiles/void_stone.png',
                'tile_crystal': 'assets/sprites/tiles/crystal.png',
                'tile_floating_rock': 'assets/sprites/tiles/floating_rock.png',
                'tile_shadow_glass': 'assets/sprites/tiles/shadow_glass.png',

                // Fluids
                'tile_water': 'assets/sprites/tiles/water.png',
                'tile_lava': 'assets/sprites/tiles/lava.png',
                'tile_acid': 'assets/sprites/tiles/acid.png',
                'tile_umbra_ooze': 'assets/sprites/tiles/umbra_ooze.png',

                // Gases
                'tile_gas_pocket': 'assets/sprites/tiles/gas_pocket.png',
                'tile_toxic_spore': 'assets/sprites/tiles/toxic_spore.png',
                'tile_steam': 'assets/sprites/tiles/steam.png',

                // Vitae roots
                'tile_vitae_capillary': 'assets/sprites/tiles/vitae_capillary.png',
                'tile_vitae_root': 'assets/sprites/tiles/vitae_root.png',
                'tile_vitae_core': 'assets/sprites/tiles/vitae_core.png',

                // Ignis roots
                'tile_ignis_capillary': 'assets/sprites/tiles/ignis_capillary.png',
                'tile_ignis_root': 'assets/sprites/tiles/ignis_root.png',
                'tile_ignis_core': 'assets/sprites/tiles/ignis_core.png',

                // Umbra roots
                'tile_umbra_capillary': 'assets/sprites/tiles/umbra_capillary.png',
                'tile_umbra_root': 'assets/sprites/tiles/umbra_root.png',
                'tile_umbra_core': 'assets/sprites/tiles/umbra_core.png',

                // Fossils
                'tile_fossil_bone': 'assets/sprites/tiles/fossil_bone.png',
                'tile_fossil_claw': 'assets/sprites/tiles/fossil_claw.png',
                'tile_fossil_tooth': 'assets/sprites/tiles/fossil_tooth.png',
                'tile_fossil_skull': 'assets/sprites/tiles/fossil_skull.png',
                'tile_fossil_ribcage': 'assets/sprites/tiles/fossil_ribcage.png',

                // Structures
                'tile_pipe': 'assets/sprites/tiles/pipe.png',
                'tile_extractor': 'assets/sprites/tiles/extractor.png',
                'tile_pump': 'assets/sprites/tiles/pump.png',
                'tile_turret': 'assets/sprites/tiles/turret.png',
                'tile_oxygen_station': 'assets/sprites/tiles/oxygen_station.png',
                'tile_bedrock': 'assets/sprites/tiles/bedrock.png',

                // Player
                'player_idle': 'assets/sprites/player/idle.png',
                'player_walk': 'assets/sprites/player/walk.png',
                'player_drill': 'assets/sprites/player/drill.png',
                'player_fall': 'assets/sprites/player/fall.png',
                'player_climb': 'assets/sprites/player/climb.png',
                'player_glide': 'assets/sprites/player/glide.png',

                // Tools
                'tool_drill': 'assets/sprites/tools/drill.png',
                'tool_sonar': 'assets/sprites/tools/sonar.png',
                'tool_pipe': 'assets/sprites/tools/pipe.png',
                'tool_extractor': 'assets/sprites/tools/extractor.png',
                'tool_turret': 'assets/sprites/tools/turret.png',

                // Living tools
                'living_vorpal_claw': 'assets/sprites/living_tools/vorpal_claw.png',
                'living_magma_worm': 'assets/sprites/living_tools/magma_worm.png',
                'living_void_borer': 'assets/sprites/living_tools/void_borer.png',
                'living_void_wings': 'assets/sprites/living_tools/void_wings.png',
                'living_spider_limbs': 'assets/sprites/living_tools/spider_limbs.png',
                'living_sonar_pulse': 'assets/sprites/living_tools/sonar_pulse.png',
                'living_predator_sight': 'assets/sprites/living_tools/predator_sight.png',
                'living_gulper_sack': 'assets/sprites/living_tools/gulper_sack.png',

                // Effects
                'effect_sonar_ping': 'assets/sprites/effects/sonar_ping.png',
                'effect_drill_particles': 'assets/sprites/effects/drill_particles.png',
                'effect_sap_drip': 'assets/sprites/effects/sap_drip.png',
                'effect_glow': 'assets/sprites/effects/glow.png',
                'effect_explosion': 'assets/sprites/effects/explosion.png',

                // Enemies - Layer 1
                'enemy_root_tick': 'assets/sprites/enemies/root_tick.png',
                'enemy_spore_crawler': 'assets/sprites/enemies/spore_crawler.png',
                // Enemies - Layer 2
                'enemy_magma_slug': 'assets/sprites/enemies/magma_slug.png',
                'enemy_fire_wasp': 'assets/sprites/enemies/fire_wasp.png',
                // Enemies - Layer 3
                'enemy_void_leech': 'assets/sprites/enemies/void_leech.png',
                'enemy_shadow_stalker': 'assets/sprites/enemies/shadow_stalker.png',

                // UI
                'ui_heart': 'assets/sprites/ui/heart.png',
                'ui_oxygen': 'assets/sprites/ui/oxygen.png',
                'ui_heat': 'assets/sprites/ui/heat.png',
                'ui_sap_icon': 'assets/sprites/ui/sap_icon.png',
            },
            audio: {
                'sfx_drill': 'assets/audio/drill.wav',
                'sfx_break': 'assets/audio/break.wav',
                'sfx_sonar': 'assets/audio/sonar.wav',
                'sfx_sap_flow': 'assets/audio/sap_flow.wav',
                'sfx_discovery': 'assets/audio/discovery.wav',
                'sfx_explosion': 'assets/audio/explosion.wav',
                'sfx_hurt': 'assets/audio/hurt.wav',
                'music_verdant': 'assets/audio/ambient_verdant.ogg',
                'music_magma': 'assets/audio/ambient_magma.ogg',
                'music_abyss': 'assets/audio/ambient_abyss.ogg',
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

        if (key.startsWith('tile_')) {
            canvas.width = TILE_SIZE;
            canvas.height = TILE_SIZE;
            this.generateTilePlaceholder(ctx, key);
        } else if (key.startsWith('player_')) {
            canvas.width = 16;
            canvas.height = 32;
            this.generatePlayerPlaceholder(ctx, key);
        } else if (key.startsWith('tool_') || key.startsWith('living_')) {
            canvas.width = 24;
            canvas.height = 24;
            this.generateToolPlaceholder(ctx, key);
        } else if (key.startsWith('effect_')) {
            canvas.width = 32;
            canvas.height = 32;
            this.generateEffectPlaceholder(ctx, key);
        } else if (key.startsWith('enemy_')) {
            canvas.width = 24;
            canvas.height = 24;
            this.generateEnemyPlaceholder(ctx, key);
        } else if (key.startsWith('ui_')) {
            canvas.width = 16;
            canvas.height = 16;
            this.generateUIPlaceholder(ctx, key);
        } else {
            canvas.width = 16;
            canvas.height = 16;
            ctx.fillStyle = '#ff00ff';
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

        // Add texture based on tile type
        if (key.includes('dirt')) {
            this.addDirtTexture(ctx, size);
        } else if (key.includes('stone') && !key.includes('void')) {
            this.addStoneTexture(ctx, size, false);
        } else if (key.includes('gravel') || key.includes('ash')) {
            this.addGravelTexture(ctx, size);
        } else if (key.includes('volcanic') || key.includes('basalt')) {
            this.addVolcanicTexture(ctx, size);
        } else if (key.includes('obsidian')) {
            this.addObsidianTexture(ctx, size);
        } else if (key.includes('void_stone')) {
            this.addVoidTexture(ctx, size);
        } else if (key.includes('crystal')) {
            this.addCrystalTexture(ctx, size);
        } else if (key.includes('floating')) {
            this.addFloatingTexture(ctx, size);
        } else if (key.includes('shadow_glass')) {
            this.addGlassTexture(ctx, size);
        } else if (key.includes('amber')) {
            this.addAmberTexture(ctx, size);
        } else if (key.includes('petrified')) {
            this.addWoodTexture(ctx, size);
        } else if (key.includes('water') || key.includes('lava') || key.includes('acid') || key.includes('ooze')) {
            this.addFluidTexture(ctx, size, key);
        } else if (key.includes('gas') || key.includes('spore') || key.includes('steam')) {
            this.addGasTexture(ctx, size, key);
        } else if (key.includes('vitae')) {
            this.addRootTexture(ctx, size, 'vitae', key);
        } else if (key.includes('ignis')) {
            this.addRootTexture(ctx, size, 'ignis', key);
        } else if (key.includes('umbra') && key.includes('tile_umbra_')) {
            this.addRootTexture(ctx, size, 'umbra', key);
        } else if (key.includes('fossil')) {
            this.addFossilTexture(ctx, size, key);
        } else if (key.includes('pipe') || key.includes('extractor') || key.includes('pump') || key.includes('turret') || key.includes('oxygen')) {
            this.addMachineTexture(ctx, size, key);
        } else if (key.includes('bedrock')) {
            this.addBedrockTexture(ctx, size);
        }

        // Add subtle border
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    }

    addDirtTexture(ctx, size) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }
    }

    addStoneTexture(ctx, size, isHard) {
        ctx.fillStyle = isHard ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(Math.random() * (size - 2), Math.random() * size, 2, 1);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }
    }

    addGravelTexture(ctx, size) {
        for (let i = 0; i < 12; i++) {
            const shade = Math.random() * 0.3 - 0.15;
            ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
            ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
    }

    addVolcanicTexture(ctx, size) {
        // Add glowing cracks
        ctx.strokeStyle = 'rgba(255,100,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, 0);
        ctx.lineTo(Math.random() * size, size);
        ctx.stroke();
    }

    addObsidianTexture(ctx, size) {
        // Glassy reflections
        ctx.fillStyle = 'rgba(100,100,150,0.3)';
        ctx.fillRect(2, 2, 4, 2);
        ctx.fillRect(10, 8, 3, 2);
    }

    addVoidTexture(ctx, size) {
        // Swirling void pattern
        ctx.fillStyle = 'rgba(100,0,150,0.3)';
        ctx.beginPath();
        ctx.arc(size/2, size/2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    addCrystalTexture(ctx, size) {
        // Faceted crystal look
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size/2, 2);
        ctx.lineTo(size - 3, size/2);
        ctx.lineTo(size/2, size - 2);
        ctx.lineTo(3, size/2);
        ctx.closePath();
        ctx.stroke();
    }

    addFloatingTexture(ctx, size) {
        // Gravitational particles
        ctx.fillStyle = 'rgba(150,100,255,0.5)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }
    }

    addGlassTexture(ctx, size) {
        // Translucent with cracks
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(3, 3, 1, 5);
        ctx.fillRect(4, 8, 4, 1);
    }

    addAmberTexture(ctx, size) {
        // Glowing inclusion
        ctx.fillStyle = 'rgba(255,255,200,0.4)';
        ctx.beginPath();
        ctx.arc(size/2, size/2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    addWoodTexture(ctx, size) {
        // Wood grain lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 2; i < size; i += 3) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i + Math.sin(i) * 2);
            ctx.stroke();
        }
    }

    addFluidTexture(ctx, size, key) {
        // Wavy surface
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(0, 2, size, 2);

        // Animated appearance
        if (key.includes('lava')) {
            ctx.fillStyle = 'rgba(255,200,0,0.3)';
            ctx.fillRect(4, 6, 4, 4);
        }
    }

    addGasTexture(ctx, size, key) {
        // Wisps
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = key.includes('toxic') ? '#a0ff80' : key.includes('steam') ? '#ffffff' : '#80a060';
        ctx.beginPath();
        ctx.arc(size/2, size/2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    addRootTexture(ctx, size, rootType, key) {
        const colors = {
            vitae: { vein: 'rgba(0,255,200,0.5)', glow: 'rgba(0,255,170,0.3)' },
            ignis: { vein: 'rgba(255,200,0,0.5)', glow: 'rgba(255,100,0,0.3)' },
            umbra: { vein: 'rgba(200,100,255,0.5)', glow: 'rgba(150,0,200,0.3)' },
        };

        const color = colors[rootType];
        const intensity = key.includes('core') ? 1 : key.includes('root') ? 0.7 : 0.4;

        // Central vein
        ctx.fillStyle = color.vein;
        ctx.fillRect(size/2 - 1, 0, 2, size);
        ctx.fillRect(0, size/2 - 1, size, 2);

        // Glow effect
        ctx.fillStyle = color.glow;
        ctx.globalAlpha = intensity;
        ctx.fillRect(size/2 - 3, 0, 6, size);
        ctx.fillRect(0, size/2 - 3, size, 6);
        ctx.globalAlpha = 1;
    }

    addFossilTexture(ctx, size, key) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        if (key.includes('bone')) {
            ctx.fillRect(2, size/2 - 1, size - 4, 2);
        } else if (key.includes('claw')) {
            ctx.beginPath();
            ctx.arc(size/2, size, size/2, Math.PI, 0, true);
            ctx.fill();
        } else if (key.includes('tooth')) {
            ctx.beginPath();
            ctx.moveTo(size/2, 2);
            ctx.lineTo(size - 3, size - 2);
            ctx.lineTo(3, size - 2);
            ctx.fill();
        } else if (key.includes('skull')) {
            ctx.beginPath();
            ctx.arc(size/2, size/2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(5, 6, 2, 2);
            ctx.fillRect(9, 6, 2, 2);
        } else if (key.includes('ribcage')) {
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(3, 2 + i * 3, size - 6, 1);
            }
        }
    }

    addMachineTexture(ctx, size, key) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(2, 2, size - 4, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(2, size - 4, size - 4, 2);

        if (key.includes('extractor')) {
            ctx.fillStyle = '#aa44ff';
            ctx.fillRect(size/2 - 2, size/2 - 2, 4, 4);
        } else if (key.includes('pump')) {
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (key.includes('turret')) {
            ctx.fillStyle = '#88ff88';
            ctx.fillRect(size/2 - 1, 2, 2, size - 4);
        } else if (key.includes('oxygen')) {
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    addBedrockTexture(ctx, size) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 15; i++) {
            ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
    }

    generatePlayerPlaceholder(ctx, key) {
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(4, 2, 8, 8); // Head
        ctx.fillRect(3, 10, 10, 12); // Body

        ctx.fillStyle = 'rgba(0,255,170,0.5)';
        ctx.fillRect(5, 0, 6, 3); // Helmet glow

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, 4, 2, 2);
        ctx.fillRect(9, 4, 2, 2); // Eyes

        if (key.includes('drill')) {
            ctx.fillStyle = '#ff8844';
            ctx.fillRect(13, 12, 3, 6);
        } else if (key.includes('climb')) {
            ctx.fillStyle = '#888888';
            ctx.fillRect(0, 14, 3, 6);
            ctx.fillRect(13, 8, 3, 6);
        } else if (key.includes('glide')) {
            ctx.fillStyle = 'rgba(100,0,150,0.6)';
            ctx.fillRect(0, 10, 16, 8);
        }
    }

    generateToolPlaceholder(ctx, key) {
        ctx.fillStyle = '#666666';

        if (key.includes('drill') || key.includes('claw')) {
            ctx.fillStyle = '#ff8844';
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.lineTo(20, 12);
            ctx.lineTo(12, 22);
            ctx.lineTo(4, 12);
            ctx.fill();
        } else if (key.includes('sonar') || key.includes('pulse') || key.includes('sight')) {
            ctx.fillStyle = '#44aaff';
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
        } else if (key.includes('worm')) {
            ctx.fillStyle = '#ff6600';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(4 + i * 4, 12, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (key.includes('borer')) {
            ctx.fillStyle = '#9900ff';
            ctx.fillRect(8, 4, 8, 16);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(10, 6, 4, 12);
        } else if (key.includes('wings')) {
            ctx.fillStyle = 'rgba(100,0,150,0.7)';
            ctx.beginPath();
            ctx.moveTo(12, 12);
            ctx.lineTo(2, 4);
            ctx.lineTo(2, 20);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(12, 12);
            ctx.lineTo(22, 4);
            ctx.lineTo(22, 20);
            ctx.fill();
        } else if (key.includes('spider')) {
            ctx.fillStyle = '#00aa77';
            ctx.beginPath();
            ctx.arc(12, 12, 5, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI - Math.PI / 2;
                ctx.fillRect(12 + Math.cos(angle) * 6, 12 + Math.sin(angle) * 6, 6, 2);
            }
        } else if (key.includes('gulper') || key.includes('sack')) {
            ctx.fillStyle = '#886644';
            ctx.beginPath();
            ctx.arc(12, 14, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#664422';
            ctx.fillRect(8, 4, 8, 4);
        } else if (key.includes('turret')) {
            ctx.fillStyle = '#668866';
            ctx.fillRect(8, 14, 8, 8);
            ctx.fillRect(10, 4, 4, 12);
        }
    }

    generateEffectPlaceholder(ctx, key) {
        if (key.includes('sonar')) {
            ctx.strokeStyle = 'rgba(68, 170, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(16, 16, 12, 0, Math.PI * 2);
            ctx.stroke();
        } else if (key.includes('drill')) {
            ctx.fillStyle = '#aa7744';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.fillRect(16 + Math.cos(angle) * 8 - 1, 16 + Math.sin(angle) * 8 - 1, 3, 3);
            }
        } else if (key.includes('explosion')) {
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(16, 16, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(16, 16, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(16, 16, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (key.includes('glow')) {
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(0, 255, 170, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 255, 170, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
        }
    }

    generateEnemyPlaceholder(ctx, key) {
        if (key.includes('tick')) {
            ctx.fillStyle = '#ff4466';
            ctx.beginPath();
            ctx.arc(12, 12, 6, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.fillRect(12 + Math.cos(angle) * 6, 12 + Math.sin(angle) * 6, 3, 2);
            }
        } else if (key.includes('crawler')) {
            ctx.fillStyle = '#88ff44';
            ctx.fillRect(4, 8, 16, 8);
            ctx.fillStyle = '#44aa22';
            ctx.fillRect(6, 4, 4, 6);
        } else if (key.includes('slug')) {
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.ellipse(12, 14, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(16, 10, 4, 4);
        } else if (key.includes('wasp')) {
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(8, 10, 8, 6);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(6, 8, 4, 10);
            // Wings
            ctx.fillStyle = 'rgba(255,200,100,0.5)';
            ctx.fillRect(2, 6, 8, 4);
            ctx.fillRect(14, 6, 8, 4);
        } else if (key.includes('leech')) {
            ctx.fillStyle = '#6600aa';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(6 + i * 4, 12, 4 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (key.includes('stalker')) {
            ctx.fillStyle = 'rgba(50,0,80,0.8)';
            ctx.beginPath();
            ctx.arc(12, 12, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(8, 10, 3, 3);
            ctx.fillRect(13, 10, 3, 3);
        }
    }

    generateUIPlaceholder(ctx, key) {
        if (key.includes('heart')) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(5, 6, 4, 0, Math.PI * 2);
            ctx.arc(11, 6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(1, 8);
            ctx.lineTo(8, 15);
            ctx.lineTo(15, 8);
            ctx.fill();
        } else if (key.includes('oxygen')) {
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.arc(8, 8, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillText('O', 5, 11);
        } else if (key.includes('heat')) {
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(6, 2, 4, 12);
            ctx.beginPath();
            ctx.arc(8, 12, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (key.includes('sap')) {
            ctx.fillStyle = '#00ffaa';
            ctx.beginPath();
            ctx.arc(8, 6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(6, 8);
            ctx.lineTo(10, 8);
            ctx.lineTo(8, 14);
            ctx.fill();
        }
    }

    getTileTypeFromKey(key) {
        const mapping = {
            'tile_dirt': TILE_TYPES.DIRT,
            'tile_stone': TILE_TYPES.STONE,
            'tile_petrified_wood': TILE_TYPES.PETRIFIED_WOOD,
            'tile_amber': TILE_TYPES.AMBER,
            'tile_gravel': TILE_TYPES.GRAVEL,
            'tile_volcanic_rock': TILE_TYPES.VOLCANIC_ROCK,
            'tile_basalt': TILE_TYPES.BASALT,
            'tile_obsidian': TILE_TYPES.OBSIDIAN,
            'tile_ash': TILE_TYPES.ASH,
            'tile_void_stone': TILE_TYPES.VOID_STONE,
            'tile_crystal': TILE_TYPES.CRYSTAL,
            'tile_floating_rock': TILE_TYPES.FLOATING_ROCK,
            'tile_shadow_glass': TILE_TYPES.SHADOW_GLASS,
            'tile_water': TILE_TYPES.WATER,
            'tile_lava': TILE_TYPES.LAVA,
            'tile_acid': TILE_TYPES.ACID,
            'tile_umbra_ooze': TILE_TYPES.UMBRA_OOZE,
            'tile_gas_pocket': TILE_TYPES.GAS_POCKET,
            'tile_toxic_spore': TILE_TYPES.TOXIC_SPORE,
            'tile_steam': TILE_TYPES.STEAM,
            'tile_vitae_capillary': TILE_TYPES.VITAE_CAPILLARY,
            'tile_vitae_root': TILE_TYPES.VITAE_ROOT,
            'tile_vitae_core': TILE_TYPES.VITAE_CORE,
            'tile_ignis_capillary': TILE_TYPES.IGNIS_CAPILLARY,
            'tile_ignis_root': TILE_TYPES.IGNIS_ROOT,
            'tile_ignis_core': TILE_TYPES.IGNIS_CORE,
            'tile_umbra_capillary': TILE_TYPES.UMBRA_CAPILLARY,
            'tile_umbra_root': TILE_TYPES.UMBRA_ROOT,
            'tile_umbra_core': TILE_TYPES.UMBRA_CORE,
            'tile_fossil_bone': TILE_TYPES.FOSSIL_BONE,
            'tile_fossil_claw': TILE_TYPES.FOSSIL_CLAW,
            'tile_fossil_tooth': TILE_TYPES.FOSSIL_TOOTH,
            'tile_fossil_skull': TILE_TYPES.FOSSIL_SKULL,
            'tile_fossil_ribcage': TILE_TYPES.FOSSIL_RIBCAGE,
            'tile_pipe': TILE_TYPES.PIPE,
            'tile_extractor': TILE_TYPES.EXTRACTOR,
            'tile_pump': TILE_TYPES.PUMP,
            'tile_turret': TILE_TYPES.TURRET,
            'tile_oxygen_station': TILE_TYPES.OXYGEN_STATION,
            'tile_bedrock': TILE_TYPES.BEDROCK,
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
            [TILE_TYPES.PETRIFIED_WOOD]: 'tile_petrified_wood',
            [TILE_TYPES.AMBER]: 'tile_amber',
            [TILE_TYPES.GRAVEL]: 'tile_gravel',
            [TILE_TYPES.VOLCANIC_ROCK]: 'tile_volcanic_rock',
            [TILE_TYPES.BASALT]: 'tile_basalt',
            [TILE_TYPES.OBSIDIAN]: 'tile_obsidian',
            [TILE_TYPES.ASH]: 'tile_ash',
            [TILE_TYPES.VOID_STONE]: 'tile_void_stone',
            [TILE_TYPES.CRYSTAL]: 'tile_crystal',
            [TILE_TYPES.FLOATING_ROCK]: 'tile_floating_rock',
            [TILE_TYPES.SHADOW_GLASS]: 'tile_shadow_glass',
            [TILE_TYPES.WATER]: 'tile_water',
            [TILE_TYPES.LAVA]: 'tile_lava',
            [TILE_TYPES.ACID]: 'tile_acid',
            [TILE_TYPES.UMBRA_OOZE]: 'tile_umbra_ooze',
            [TILE_TYPES.GAS_POCKET]: 'tile_gas_pocket',
            [TILE_TYPES.TOXIC_SPORE]: 'tile_toxic_spore',
            [TILE_TYPES.STEAM]: 'tile_steam',
            [TILE_TYPES.VITAE_CAPILLARY]: 'tile_vitae_capillary',
            [TILE_TYPES.VITAE_ROOT]: 'tile_vitae_root',
            [TILE_TYPES.VITAE_CORE]: 'tile_vitae_core',
            [TILE_TYPES.IGNIS_CAPILLARY]: 'tile_ignis_capillary',
            [TILE_TYPES.IGNIS_ROOT]: 'tile_ignis_root',
            [TILE_TYPES.IGNIS_CORE]: 'tile_ignis_core',
            [TILE_TYPES.UMBRA_CAPILLARY]: 'tile_umbra_capillary',
            [TILE_TYPES.UMBRA_ROOT]: 'tile_umbra_root',
            [TILE_TYPES.UMBRA_CORE]: 'tile_umbra_core',
            [TILE_TYPES.FOSSIL_BONE]: 'tile_fossil_bone',
            [TILE_TYPES.FOSSIL_CLAW]: 'tile_fossil_claw',
            [TILE_TYPES.FOSSIL_TOOTH]: 'tile_fossil_tooth',
            [TILE_TYPES.FOSSIL_SKULL]: 'tile_fossil_skull',
            [TILE_TYPES.FOSSIL_RIBCAGE]: 'tile_fossil_ribcage',
            [TILE_TYPES.PIPE]: 'tile_pipe',
            [TILE_TYPES.EXTRACTOR]: 'tile_extractor',
            [TILE_TYPES.PUMP]: 'tile_pump',
            [TILE_TYPES.TURRET]: 'tile_turret',
            [TILE_TYPES.OXYGEN_STATION]: 'tile_oxygen_station',
            [TILE_TYPES.BEDROCK]: 'tile_bedrock',
        };
        const key = mapping[tileType];
        return key ? this.sprites.get(key) : null;
    }
}

// Export singleton instance
export const assetManager = new AssetManager();
export default assetManager;
