/**
 * UI Manager
 * Handles all UI updates and interactions
 */

import { TOOLS, SONAR } from '../core/Constants.js';

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            healthValue: document.querySelector('#health-display .resource-value'),
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
        }

        if (this.elements.sapValue) {
            this.elements.sapValue.textContent = player.inventory.wyrmSap;
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
            'wyrm_sap_small': 'Wyrm Sap (trace)',
            'wyrm_sap': 'Wyrm Sap',
            'wyrm_sap_pure': 'Pure Wyrm Sap',
            'dragon_bone': 'Dragon Bone Fragment',
            'dragon_claw': 'Dragon Claw Shard',
            'dragon_tooth': 'Dragon Tooth',
            'dirt': 'Dirt',
            'stone': 'Stone',
        };
        return names[item] || item;
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
    }
}

export default UIManager;
