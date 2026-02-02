/**
 * Main Game Class
 * Orchestrates all game systems
 */

import {
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GAME_STATES, TOOLS
} from './Constants.js';
import { assetManager } from './AssetManager.js';
import { input } from './Input.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { World } from '../world/World.js';
import { Player } from '../entities/Player.js';
import { UIManager } from '../ui/UIManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Disable image smoothing
        this.ctx.imageSmoothingEnabled = false;

        // Game state
        this.state = GAME_STATES.LOADING;
        this.paused = false;

        // Core systems
        this.camera = new Camera();
        this.renderer = new Renderer(this.canvas);
        this.world = new World();
        this.ui = new UIManager();
        this.player = null;

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;

        // Bind input to canvas
        input.setCanvas(this.canvas);
        input.setCamera(this.camera);

        // Setup UI callbacks
        this.ui.onToolSelected = (tool) => {
            if (this.player) {
                this.player.currentTool = tool;
            }
        };

        // Mining feedback
        this.lastMinedTile = null;
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing Wyrmroot Excavation...');

        // Load assets
        await assetManager.load((progress) => {
            this.ui.updateLoadingProgress(progress);
        });

        // Initialize world
        this.world.init();

        // Create player at spawn
        const spawn = this.world.getSpawnPosition();
        this.player = new Player(spawn.x, spawn.y);

        // Setup camera
        this.camera.follow(this.player);

        // Hide loading screen
        this.ui.hideLoadingScreen();

        // Change state
        this.state = GAME_STATES.PLAYING;

        // Show welcome message
        this.ui.addMessage('Welcome to Wyrmroot Excavation', 'discovery');
        this.ui.addMessage('Follow the glowing veins deep into the earth...', 'normal');

        console.log('Game initialized!');
    }

    /**
     * Main game loop
     */
    run(timestamp = 0) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

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
            this.paused = !this.paused;
            return;
        }

        // Handle inventory
        if (input.isActionJustPressed('INVENTORY')) {
            this.ui.showInventory(this.player);
        }

        // Ensure chunks are generated around player
        this.world.ensureChunksAround(this.player.x, this.player.y);

        // Update player
        this.player.update(deltaTime, this.world);

        // Check for mining completion
        this.checkMiningFeedback();

        // Update camera
        this.camera.update(deltaTime);

        // Update UI
        this.ui.updateStats(this.player);
        this.ui.updateToolSelection(this.player.currentTool);
        this.ui.updateSonarCooldown(this.player.sonarCooldown);
    }

    /**
     * Check for mining feedback
     */
    checkMiningFeedback() {
        const drillTarget = this.player.getDrillTarget();

        if (drillTarget && drillTarget.progress >= 1) {
            // Tile was mined - handled in player, just add camera shake
            this.camera.shake(2, 100);
        }

        if (this.player.isDrilling && drillTarget) {
            const tile = this.world.getTile(drillTarget.x, drillTarget.y);

            // Check for special discovery
            if (tile >= 10 && tile <= 22 && !this.lastMinedTile) {
                this.lastMinedTile = tile;
                const props = this.world.getTileProperties(drillTarget.x, drillTarget.y);
                if (props && props.drops) {
                    this.ui.showDiscovery(this.ui.formatItemName(props.drops));
                }
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

        // Draw background based on depth
        const depth = this.player ? this.player.getDepth() : 0;
        this.renderer.drawBackground(this.camera, depth);

        // Draw tiles
        this.renderer.drawTiles(this.world, this.camera);

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
        const revealDuration = 5000;
        const totalDuration = pingDuration + revealDuration;

        const progress = this.player.sonarPingTime / pingDuration;

        // Draw expanding ping
        if (this.player.sonarPingTime < pingDuration) {
            const radius = progress * 800; // Expand to 800 pixels
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

        // Draw FPS (debug)
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);
    }
}

export default Game;
