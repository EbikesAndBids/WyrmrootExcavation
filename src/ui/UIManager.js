/**
 * UI Manager
 * Handles all UI updates and interactions
 * Updated for three biomes and survival mechanics
 */

import { TOOLS, SONAR, BIOMES } from '../core/Constants.js';

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            healthValue: document.querySelector('#health-display .resource-value'),
            oxygenValue: document.querySelector('#oxygen-display .resource-value'),
            heatValue: document.querySelector('#heat-display .resource-value'),
            sapValue: document.querySelector('#sap-display .resource-value'),
            depthValue: document.querySelector('#depth-display .resource-value'),
            messageLog: document.getElementById('message-log'),
            loadingScreen: document.getElementById('loading-screen'),
            loadingFill: document.querySelector('.loading-fill'),
            toolSlots: document.querySelectorAll('.tool-slot'),
            minimapCanvas: document.getElementById('minimap-canvas'),
        };

        // Message queue
        this.messages = [];
        this.maxMessages = 5;

        // Warning cooldowns to prevent spam
        this.warnings = new Map();
        this.warningCooldown = 5000; // 5 seconds between same warnings

        // Initialize minimap
        if (this.elements.minimapCanvas) {
            this.minimapCtx = this.elements.minimapCanvas.getContext('2d');
            this.elements.minimapCanvas.width = 150;
            this.elements.minimapCanvas.height = 150;
        }

        // Setup tool slot clicks
        this.setupToolSlots();
    }

    /**
     * Setup tool slot click handlers
     */
    setupToolSlots() {
        this.elements.toolSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const tool = slot.dataset.tool;
                this.onToolSelected(tool);
            });
        });
    }

    /**
     * Callback for tool selection (set by game)
     */
    onToolSelected(tool) {
        // Overridden by game
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(progress) {
        if (this.elements.loadingFill) {
            this.elements.loadingFill.style.width = `${progress * 100}%`;
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Update player stats display
     */
    updateStats(player) {
        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = Math.floor(player.health);
            // Update health bar color based on value
            const healthPercent = player.health / player.maxHealth;
            this.elements.healthValue.style.color = healthPercent < 0.3 ? '#ff4444' :
                                                    healthPercent < 0.6 ? '#ffaa44' : '#44ff44';
        }

        if (this.elements.oxygenValue) {
            this.elements.oxygenValue.textContent = Math.floor(player.oxygen);
            const oxygenPercent = player.oxygen / player.maxOxygen;
            this.elements.oxygenValue.style.color = oxygenPercent < 0.3 ? '#ff4444' :
                                                    oxygenPercent < 0.6 ? '#4488ff' : '#44aaff';
        }

        if (this.elements.heatValue) {
            this.elements.heatValue.textContent = Math.floor(player.heat);
            const heatPercent = player.heat / player.maxHeat;
            this.elements.heatValue.style.color = heatPercent > 0.7 ? '#ff4444' :
                                                  heatPercent > 0.4 ? '#ffaa44' : '#88ff88';
        }

        if (this.elements.sapValue) {
            // Show total of all sap types
            const totalSap = player.inventory.vitae_sap + player.inventory.vitae_sap_small +
                           player.inventory.ignis_plasma + player.inventory.ignis_plasma_small +
                           player.inventory.umbra_ichor + player.inventory.umbra_ichor_small;
            this.elements.sapValue.textContent = totalSap;
        }

        if (this.elements.depthValue) {
            this.elements.depthValue.textContent = `${player.getDepth()}m`;
        }
    }

    /**
     * Update selected tool display
     */
    updateToolSelection(currentTool) {
        this.elements.toolSlots.forEach(slot => {
            const isActive = slot.dataset.tool === currentTool;
            slot.classList.toggle('active', isActive);
        });
    }

    /**
     * Check if we have a recent warning of this type
     */
    hasWarning(type) {
        const lastWarning = this.warnings.get(type);
        if (!lastWarning) return false;
        return Date.now() - lastWarning < this.warningCooldown;
    }

    /**
     * Set a warning timestamp
     */
    setWarning(type) {
        this.warnings.set(type, Date.now());
    }

    /**
     * Clear a warning
     */
    clearWarning(type) {
        this.warnings.delete(type);
    }

    /**
     * Add message to log
     */
    addMessage(text, type = 'normal') {
        this.messages.unshift({ text, type, time: Date.now() });

        if (this.messages.length > this.maxMessages) {
            this.messages.pop();
        }

        this.renderMessages();
    }

    /**
     * Render message log
     */
    renderMessages() {
        if (!this.elements.messageLog) return;

        this.elements.messageLog.innerHTML = this.messages.map(msg => {
            return `<div class="log-message ${msg.type}">${msg.text}</div>`;
        }).join('');
    }

    /**
     * Update minimap
     */
    updateMinimap(renderer, world, player) {
        if (!this.minimapCtx) return;
        renderer.drawMinimap(this.minimapCtx, world, player, 150, 150);
    }

    /**
     * Show discovery notification
     */
    showDiscovery(itemName) {
        this.addMessage(`Discovered: ${itemName}`, 'discovery');
    }

    /**
     * Show warning
     */
    showWarning(text) {
        this.addMessage(text, 'warning');
    }

    /**
     * Show danger alert
     */
    showDanger(text) {
        this.addMessage(text, 'danger');
    }

    /**
     * Format item name for display
     */
    formatItemName(item) {
        const names = {
            // Vitae
            'vitae_sap_small': 'Vitae Sap (trace)',
            'vitae_sap': 'Vitae Sap',
            'vitae_sap_pure': 'Pure Vitae Sap',
            // Ignis
            'ignis_plasma_small': 'Ignis Plasma (trace)',
            'ignis_plasma': 'Ignis Plasma',
            'ignis_plasma_pure': 'Pure Ignis Plasma',
            // Umbra
            'umbra_ichor_small': 'Umbra Ichor (trace)',
            'umbra_ichor': 'Umbra Ichor',
            'umbra_ichor_pure': 'Pure Umbra Ichor',
            // Fossils
            'dragon_bone': 'Dragon Bone Fragment',
            'dragon_claw': 'Dragon Claw Shard',
            'dragon_tooth': 'Dragon Tooth',
            'dragon_skull': 'Dragon Skull',
            'dragon_ribcage': 'Dragon Ribcage',
            // Terrain
            'dirt': 'Dirt',
            'stone': 'Stone',
            'petrified_wood': 'Petrified Wood',
            'amber': 'Amber',
            'gravel': 'Gravel',
            'volcanic_rock': 'Volcanic Rock',
            'basalt': 'Basalt',
            'obsidian': 'Obsidian',
            'ash': 'Volcanic Ash',
            'void_stone': 'Void Stone',
            'crystal': 'Abyssal Crystal',
            'floating_rock': 'Floating Rock',
            'shadow_glass': 'Shadow Glass',
        };
        return names[item] || item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Update sonar cooldown display
     */
    updateSonarCooldown(cooldown) {
        const sonarSlot = document.querySelector('.tool-slot[data-tool="sonar"]');
        if (!sonarSlot) return;

        if (cooldown > 0) {
            const percent = (cooldown / SONAR.COOLDOWN) * 100;
            sonarSlot.style.background = `linear-gradient(to top, #2a2a2a ${100 - percent}%, #1a1a1a ${100 - percent}%)`;
        } else {
            sonarSlot.style.background = '#2a2a2a';
        }
    }

    /**
     * Show biome transition notification
     */
    showBiomeTransition(biome) {
        this.addMessage(`Entering ${biome.name}`, 'discovery');
        if (biome.description) {
            this.addMessage(biome.description, 'normal');
        }
    }

    /**
     * Show/hide pause menu (placeholder)
     */
    togglePauseMenu(visible) {
        // TODO: Implement pause menu
    }

    /**
     * Show inventory screen (placeholder)
     */
    showInventory(player) {
        // TODO: Implement inventory UI
        console.log('Inventory:', player.inventory);
        console.log('Living Tools:', player.livingTools);
        console.log('Money:', player.money);
    }
}

export default UIManager;
