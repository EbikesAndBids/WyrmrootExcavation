/**
 * Main Game Class
 * Orchestrates all game systems
 * Updated for three biomes and physics
 */

import {
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GAME_STATES, TOOLS, BIOMES
} from './Constants.js';
import { assetManager } from './AssetManager.js';
import { input } from './Input.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { World } from '../world/World.js';
import { Player } from '../entities/Player.js';
import { UIManager } from '../ui/UIManager.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { CraftingSystem } from '../systems/CraftingSystem.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Could not find game-canvas element');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Could not get 2D context from canvas');
        }

        // Set canvas size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Disable image smoothing
        this.ctx.imageSmoothingEnabled = false;

        console.log(`Canvas initialized: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);

        // Game state
        this.state = GAME_STATES.LOADING;
        this.paused = false;

        // Core systems
        this.camera = new Camera();
        this.renderer = new Renderer(this.canvas);
        this.world = new World();
        this.ui = new UIManager();
        this.physics = null; // Initialized after world
        this.crafting = new CraftingSystem();
        this.player = null;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentTime = 0;

        // Bind input to canvas
        input.setCanvas(this.canvas);
        input.setCamera(this.camera);

        // Setup UI callbacks
        this.ui.onToolSelected = (tool) => {
            if (this.player) {
                this.player.currentTool = tool;
            }
        };

        this.ui.onRecallClicked = () => {
            this.handleRecall();
        };

        this.ui.onEquipTool = (toolId, category) => {
            if (this.player) {
                this.player.equipLivingTool(toolId);
                this.ui.addMessage(`Equipped ${toolId.replace(/_/g, ' ')}`, 'discovery');
            }
        };

        this.ui.onCraft = (chassisId, strainType, catalystRarity) => {
            if (this.player) {
                const result = this.crafting.craft(this.player, chassisId, strainType, catalystRarity);
                if (result.success) {
                    this.ui.addMessage(`Crafted: ${result.tool.name}!`, 'discovery');
                    // Auto-equip if slot is empty
                    const slot = result.tool.category;
                    if (!this.player.livingTools[slot]) {
                        this.player.equipLivingTool(result.tool.id);
                    }
                } else {
                    this.ui.addMessage(`Crafting failed: ${result.error}`, 'warning');
                }
            }
        };

        this.ui.onHotbarSelect = (slotIndex, slotData) => {
            if (this.player && slotData) {
                if (slotData.type === 'tool') {
                    this.player.currentTool = slotData.id;
                    this.player.selectedPlaceableItem = null;
                } else if (slotData.type === 'item') {
                    // Item selected - set it as the current placeable
                    this.player.currentTool = 'place';
                    this.player.selectedPlaceableItem = slotData.id;
                }
            }
        };

        this.ui.onCraftMaterial = (recipeId, count) => {
            if (this.player) {
                const result = this.crafting.craftMaterial(this.player, recipeId, count);
                if (result.success) {
                    const outputText = Object.entries(result.crafted)
                        .map(([item, amt]) => `${amt} ${item.replace(/_/g, ' ')}`)
                        .join(', ');
                    this.ui.addMessage(`Crafted: ${outputText}`, 'discovery');
                } else {
                    this.ui.addMessage(`Crafting failed: ${result.error}`, 'warning');
                }
            }
        };

        // Pass crafting system to UI
        this.ui.craftingSystem = this.crafting;

        // Mining feedback
        this.lastMinedTile = null;

        // Extraction state
        this.extractionActive = false;
        this.extractionTime = 0;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing Wyrmroot: Deep Excavation...');

        try {
            // Load assets
            console.log('Loading assets...');
            await assetManager.load((progress) => {
                this.ui.updateLoadingProgress(progress);
            });
            console.log('Assets loaded.');

            // Initialize world
            console.log('Initializing world...');
            this.world.init();
            console.log('World initialized.');

            // Initialize physics system
            console.log('Initializing physics...');
            this.physics = new PhysicsSystem(this.world);
            console.log('Physics initialized.');

            // Create player at spawn
            console.log('Creating player...');
            const spawn = this.world.getSpawnPosition();
            console.log('Spawn position:', spawn);
            this.player = new Player(spawn.x, spawn.y);
            console.log('Player created.');

            // Setup camera
            this.camera.follow(this.player);
            console.log('Camera set up.');

            // Hide loading screen
            this.ui.hideLoadingScreen();
            console.log('Loading screen hidden.');

            // Change state
            this.state = GAME_STATES.PLAYING;

            // Show welcome message
            this.ui.addMessage('Welcome to Wyrmroot: Deep Excavation', 'discovery');
            this.ui.addMessage('Dig deep to find the dragon roots...', 'normal');
            this.ui.addMessage('Watch your oxygen and heat levels!', 'warning');

            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    /**
     * Main game loop
     */
    run(timestamp = 0) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.currentTime = timestamp;

        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 100) this.deltaTime = 100;

        // FPS counter
        this.frameCount++;
        this.fpsTime += this.deltaTime;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        // Update and render based on state
        if (this.state === GAME_STATES.PLAYING && !this.paused) {
            this.update(this.deltaTime);
        }

        this.render();

        // Clear input states
        input.update();

        // Continue loop
        requestAnimationFrame((t) => this.run(t));
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        // Handle pause
        if (input.isActionJustPressed('PAUSE')) {
            // Close any open panels first
            if (this.ui.isAnyPanelOpen()) {
                this.ui.closeAllPanels();
            } else {
                this.paused = !this.paused;
            }
            return;
        }

        // Handle inventory toggle
        if (input.isActionJustPressed('INVENTORY')) {
            this.ui.toggleInventory(this.player, this.crafting);
        }

        // Handle hotbar selection (keys 1-9)
        for (let i = 1; i <= 9; i++) {
            if (input.isActionJustPressed(`TOOL_${i}`)) {
                this.ui.selectHotbarSlot(i - 1);
            }
        }

        // Handle equipment toggle
        if (input.isActionJustPressed('EQUIPMENT')) {
            this.ui.toggleEquipment(this.player);
        }

        // Handle Bio-Forge toggle
        if (input.isActionJustPressed('BIOFORGE')) {
            this.ui.toggleBioForge(this.player);
        }

        // Handle recall
        if (input.isActionJustPressed('RECALL')) {
            this.handleRecall();
        }

        // Skip game updates if panel is open
        if (this.ui.isAnyPanelOpen()) {
            return;
        }

        // Ensure chunks are generated around player
        this.world.ensureChunksAround(this.player.x, this.player.y);

        // Update physics (falling tiles, fluids, gases)
        this.physics.update(deltaTime, this.currentTime);

        // Update player
        const miningResult = this.player.update(deltaTime, this.world);

        // Check for mining completion and physics triggers
        this.checkMiningFeedback();

        // Handle tile mining events for physics
        if (this.player.isDrilling && this.player.drillProgress >= 1 && this.player.drillTarget) {
            const target = this.player.drillTarget;
            const tile = this.world.getTile(target.x, target.y);
            this.physics.onTileMined(target.x, target.y, tile);
        }

        // Update camera
        this.camera.update(deltaTime);

        // Update UI with new stats
        this.ui.updateStats(this.player);
        this.ui.updateToolSelection(this.player.currentTool);
        this.ui.updateSonarCooldown(this.player.sonarCooldown);
        this.ui.updateRecallCooldown(this.player.recallCooldown, this.player.recallMaxCooldown);

        // Update biome indicator
        const biome = this.player.getCurrentBiome();
        this.ui.updateBiome(biome);

        // Update biome-specific UI
        this.updateBiomeUI();
    }

    /**
     * Handle recall to surface
     */
    handleRecall() {
        if (!this.player) return;

        if (this.player.canRecall()) {
            this.player.recall();
            this.ui.addMessage('Recalled to surface!', 'discovery');
            this.camera.shake(5, 200);
        } else {
            const remaining = Math.ceil(this.player.recallCooldown / 1000);
            this.ui.addMessage(`Recall on cooldown: ${remaining}s`, 'warning');
        }
    }

    /**
     * Update biome-specific UI elements
     */
    updateBiomeUI() {
        const biome = this.player.getCurrentBiome();

        // Update background ambient color
        this.renderer.setAmbientColor(biome.ambientColor);

        // Show warnings for hazardous biomes
        if (biome.id === 'magma' && this.player.heat > 50 && !this.ui.hasWarning('heat')) {
            this.ui.addMessage('Warning: Heat levels rising!', 'warning');
            this.ui.setWarning('heat');
        }

        if (this.player.oxygen < 30 && !this.ui.hasWarning('oxygen')) {
            this.ui.addMessage('Warning: Oxygen low!', 'warning');
            this.ui.setWarning('oxygen');
        }
    }

    /**
     * Check for mining feedback
     */
    checkMiningFeedback() {
        const drillTarget = this.player.getDrillTarget();

        if (drillTarget && drillTarget.progress >= 1) {
            // Tile was mined - add camera shake and create particles
            this.camera.shake(2, 100);

            // Trigger physics for surrounding tiles
            this.physics.registerNeighbors(drillTarget.x, drillTarget.y);
        }

        if (this.player.isDrilling && drillTarget) {
            const tile = this.world.getTile(drillTarget.x, drillTarget.y);

            // Check for special discovery (roots and fossils)
            if (tile >= 50 && !this.lastMinedTile) {
                this.lastMinedTile = tile;
                const props = this.world.getTileProperties(drillTarget.x, drillTarget.y);
                if (props && props.drops) {
                    this.ui.showDiscovery(this.ui.formatItemName(props.drops));
                }
            }

            // Create drilling particles
            if (Math.random() < 0.3) {
                this.renderer.createMiningParticles(
                    drillTarget.x * TILE_SIZE,
                    drillTarget.y * TILE_SIZE,
                    tile
                );
            }
        } else {
            this.lastMinedTile = null;
        }
    }

    /**
     * Render the game
     */
    render() {
        // Begin rendering with camera
        this.renderer.begin(this.camera);

        // Draw background based on depth and biome
        const depth = this.player ? this.player.getDepth() : 0;
        const biome = this.player ? this.player.getCurrentBiome() : BIOMES.SURFACE;
        this.renderer.drawBackground(this.camera, depth, biome);

        // Compute lighting
        if (this.player) {
            this.renderer.computeLightMap(this.world, this.camera, this.player);
        }

        // Draw tiles
        this.renderer.drawTiles(this.world, this.camera);

        // Draw darkness overlay (with world for surface check)
        this.renderer.drawDarknessOverlay(this.camera, this.world);

        // Draw sonar effects
        if (this.player && this.player.sonarActive) {
            this.renderSonarEffect();
        }

        // Draw player
        if (this.player) {
            this.renderer.drawPlayer(this.player);

            // Draw drill target
            const mouseWorld = input.getMouseWorldPosition();
            const targetTileX = Math.floor(mouseWorld.x / TILE_SIZE);
            const targetTileY = Math.floor(mouseWorld.y / TILE_SIZE);

            if (this.player.currentTool === TOOLS.DRILL) {
                const canMine = this.player.canMine(targetTileX, targetTileY, this.world);
                this.renderer.drawMiningTarget(targetTileX, targetTileY, canMine);

                // Draw drill progress
                if (this.player.isDrilling && this.player.drillTarget) {
                    this.renderer.drawDrillEffect(
                        this.player.drillTarget.x * TILE_SIZE,
                        this.player.drillTarget.y * TILE_SIZE,
                        this.player.drillProgress
                    );
                }
            } else if (this.player.currentTool === TOOLS.TURRET) {
                this.renderer.drawPlacementPreview(targetTileX, targetTileY, 'turret', this.world);
            } else if (this.player.currentTool === TOOLS.PIPE) {
                this.renderer.drawPlacementPreview(targetTileX, targetTileY, 'pipe', this.world);
            }
        }

        // Update and draw particles
        this.renderer.updateParticles();

        // End camera transform
        this.renderer.end();

        // Draw UI overlay (not affected by camera)
        this.renderUI();
    }

    /**
     * Render sonar ping effect
     */
    renderSonarEffect() {
        const pingDuration = 2000;
        const revealDuration = 8000;
        const totalDuration = pingDuration + revealDuration;

        const progress = this.player.sonarPingTime / pingDuration;

        // Draw expanding ping
        if (this.player.sonarPingTime < pingDuration) {
            const radius = progress * 800;
            const alpha = 1 - progress;

            this.renderer.drawSonarPing(
                this.player.sonarCenter.x,
                this.player.sonarCenter.y,
                radius,
                alpha
            );
        }

        // Draw revealed tiles
        if (this.player.sonarPingTime < totalDuration) {
            let revealAlpha;
            if (this.player.sonarPingTime < pingDuration) {
                revealAlpha = progress;
            } else {
                revealAlpha = 1 - ((this.player.sonarPingTime - pingDuration) / revealDuration);
            }

            this.renderer.drawSonarReveal(this.player.sonarRevealedTiles, revealAlpha);
        }
    }

    /**
     * Render UI elements
     */
    renderUI() {
        // Update minimap
        if (this.player) {
            this.ui.updateMinimap(this.renderer, this.world, this.player);
        }

        // Draw FPS and depth
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);

        if (this.player) {
            const biome = this.player.getCurrentBiome();
            this.ctx.fillText(`Depth: ${this.player.getDepth()}m | ${biome.name}`, 10, this.canvas.height - 22);
        }
    }
}

export default Game;
