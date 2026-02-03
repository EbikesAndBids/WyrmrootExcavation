/**
 * UI Manager
 * Handles all UI updates and interactions
 * Full inventory, equipment, and recall systems
 */

import { TOOLS, SONAR, BIOMES, LIVING_TOOLS } from '../core/Constants.js';

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            healthValue: document.querySelector('#health-display .resource-value'),
            oxygenValue: document.querySelector('#oxygen-display .resource-value'),
            heatValue: document.querySelector('#heat-display .resource-value'),
            sapValue: document.querySelector('#sap-display .resource-value'),
            depthValue: document.querySelector('#depth-display .resource-value'),
            moneyValue: document.querySelector('#money-display .resource-value'),
            messageLog: document.getElementById('message-log'),
            loadingScreen: document.getElementById('loading-screen'),
            loadingFill: document.querySelector('.loading-fill'),
            toolSlots: document.querySelectorAll('.tool-slot'),
            minimapCanvas: document.getElementById('minimap-canvas'),
            biomeIndicator: document.getElementById('biome-indicator'),
            recallButton: document.getElementById('recall-button'),
            recallCooldown: document.getElementById('recall-cooldown'),
            pipeCount: document.getElementById('pipe-count'),
            turretCount: document.getElementById('turret-count'),
            // Panels
            inventoryPanel: document.getElementById('inventory-panel'),
            equipmentPanel: document.getElementById('equipment-panel'),
            // Inventory grids
            vitaeInventory: document.getElementById('vitae-inventory'),
            ignisInventory: document.getElementById('ignis-inventory'),
            umbraInventory: document.getElementById('umbra-inventory'),
            fossilInventory: document.getElementById('fossil-inventory'),
            materialsInventory: document.getElementById('materials-inventory'),
            equipmentInventory: document.getElementById('equipment-inventory'),
            // Equipment slots
            slotExcavator: document.getElementById('slot-excavator'),
            slotMovement: document.getElementById('slot-movement'),
            slotVision: document.getElementById('slot-vision'),
            slotStorage: document.getElementById('slot-storage'),
            descExcavator: document.getElementById('desc-excavator'),
            descMovement: document.getElementById('desc-movement'),
            descVision: document.getElementById('desc-vision'),
            descStorage: document.getElementById('desc-storage'),
            availableToolsGrid: document.getElementById('available-tools-grid'),
        };

        // State
        this.inventoryOpen = false;
        this.equipmentOpen = false;
        this.currentPlayer = null;

        // Message queue
        this.messages = [];
        this.maxMessages = 5;

        // Warning cooldowns
        this.warnings = new Map();
        this.warningCooldown = 5000;

        // Initialize minimap
        if (this.elements.minimapCanvas) {
            this.minimapCtx = this.elements.minimapCanvas.getContext('2d');
            this.elements.minimapCanvas.width = 150;
            this.elements.minimapCanvas.height = 150;
        }

        // Setup event listeners
        this.setupToolSlots();
        this.setupPanelCloseButtons();
        this.setupRecallButton();
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
     * Setup close buttons on panels
     */
    setupPanelCloseButtons() {
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const panelType = btn.dataset.close;
                if (panelType === 'inventory') {
                    this.hideInventory();
                } else if (panelType === 'equipment') {
                    this.hideEquipment();
                }
            });
        });
    }

    /**
     * Setup recall button click
     */
    setupRecallButton() {
        if (this.elements.recallButton) {
            this.elements.recallButton.addEventListener('click', () => {
                this.onRecallClicked();
            });
        }
    }

    // Callbacks (set by game)
    onToolSelected(tool) {}
    onRecallClicked() {}
    onEquipTool(toolId, slot) {}

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
        this.currentPlayer = player;

        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = Math.floor(player.health);
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
            const totalSap = (player.inventory.vitae_sap || 0) + (player.inventory.vitae_sap_small || 0) +
                           (player.inventory.ignis_plasma || 0) + (player.inventory.ignis_plasma_small || 0) +
                           (player.inventory.umbra_ichor || 0) + (player.inventory.umbra_ichor_small || 0);
            this.elements.sapValue.textContent = totalSap;
        }

        if (this.elements.depthValue) {
            this.elements.depthValue.textContent = `${player.getDepth()}m`;
        }

        if (this.elements.moneyValue) {
            this.elements.moneyValue.textContent = player.money || 0;
        }

        // Update tool counts
        if (this.elements.pipeCount) {
            this.elements.pipeCount.textContent = player.inventory.pipe || 0;
        }
        if (this.elements.turretCount) {
            this.elements.turretCount.textContent = player.inventory.turret || 0;
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
     * Update biome indicator
     */
    updateBiome(biome) {
        if (this.elements.biomeIndicator) {
            this.elements.biomeIndicator.textContent = biome.name;

            // Color based on biome
            const colors = {
                'surface': '#888',
                'verdant': '#00aa77',
                'magma': '#ff6600',
                'abyss': '#9900ff',
            };
            this.elements.biomeIndicator.style.color = colors[biome.id] || '#888';
        }
    }

    /**
     * Update recall button state
     */
    updateRecallCooldown(cooldown, maxCooldown) {
        if (this.elements.recallButton) {
            if (cooldown > 0) {
                this.elements.recallButton.classList.add('on-cooldown');
            } else {
                this.elements.recallButton.classList.remove('on-cooldown');
            }
        }

        if (this.elements.recallCooldown && maxCooldown > 0) {
            const percent = Math.max(0, (maxCooldown - cooldown) / maxCooldown * 100);
            this.elements.recallCooldown.innerHTML = `<div class="fill" style="width: ${percent}%"></div>`;
        }
    }

    /**
     * Check if we have a recent warning
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

    // ============ INVENTORY SYSTEM ============

    /**
     * Show inventory panel
     */
    showInventory(player) {
        if (!this.elements.inventoryPanel) return;

        this.currentPlayer = player;
        this.inventoryOpen = true;
        this.elements.inventoryPanel.classList.remove('hidden');
        this.renderInventory(player);
    }

    /**
     * Hide inventory panel
     */
    hideInventory() {
        if (this.elements.inventoryPanel) {
            this.elements.inventoryPanel.classList.add('hidden');
        }
        this.inventoryOpen = false;
    }

    /**
     * Toggle inventory
     */
    toggleInventory(player) {
        if (this.inventoryOpen) {
            this.hideInventory();
        } else {
            this.showInventory(player);
        }
    }

    /**
     * Render full inventory
     */
    renderInventory(player) {
        // Vitae materials
        this.renderInventorySection(this.elements.vitaeInventory, [
            { key: 'vitae_sap_small', name: 'Vitae Sap (trace)', color: '#00aa77' },
            { key: 'vitae_sap', name: 'Vitae Sap', color: '#00ffaa' },
            { key: 'vitae_sap_pure', name: 'Pure Vitae Sap', color: '#00ffdd' },
        ], player.inventory, 'vitae');

        // Ignis materials
        this.renderInventorySection(this.elements.ignisInventory, [
            { key: 'ignis_plasma_small', name: 'Ignis Plasma (trace)', color: '#cc6600' },
            { key: 'ignis_plasma', name: 'Ignis Plasma', color: '#ff9900' },
            { key: 'ignis_plasma_pure', name: 'Pure Ignis Plasma', color: '#ffcc00' },
        ], player.inventory, 'ignis');

        // Umbra materials
        this.renderInventorySection(this.elements.umbraInventory, [
            { key: 'umbra_ichor_small', name: 'Umbra Ichor (trace)', color: '#6600aa' },
            { key: 'umbra_ichor', name: 'Umbra Ichor', color: '#9900ff' },
            { key: 'umbra_ichor_pure', name: 'Pure Umbra Ichor', color: '#cc66ff' },
        ], player.inventory, 'umbra');

        // Fossils
        this.renderInventorySection(this.elements.fossilInventory, [
            { key: 'dragon_bone', name: 'Dragon Bone', color: '#d0c8b0' },
            { key: 'dragon_claw', name: 'Dragon Claw', color: '#c0b8a0' },
            { key: 'dragon_tooth', name: 'Dragon Tooth', color: '#e0d8c0' },
            { key: 'dragon_skull', name: 'Dragon Skull', color: '#d8d0b8' },
            { key: 'dragon_ribcage', name: 'Dragon Ribcage', color: '#c8c0a8' },
        ], player.inventory, 'fossil');

        // Materials
        this.renderInventorySection(this.elements.materialsInventory, [
            { key: 'dirt', name: 'Dirt', color: '#3a2718' },
            { key: 'stone', name: 'Stone', color: '#4a4a4a' },
            { key: 'petrified_wood', name: 'Petrified Wood', color: '#5a4030' },
            { key: 'amber', name: 'Amber', color: '#d4a020' },
            { key: 'gravel', name: 'Gravel', color: '#6a6a5a' },
            { key: 'volcanic_rock', name: 'Volcanic Rock', color: '#3a2020' },
            { key: 'basalt', name: 'Basalt', color: '#2a2a2a' },
            { key: 'obsidian', name: 'Obsidian', color: '#1a1a2a' },
            { key: 'ash', name: 'Volcanic Ash', color: '#5a5050' },
            { key: 'void_stone', name: 'Void Stone', color: '#1a0a2a' },
            { key: 'crystal', name: 'Crystal', color: '#8060c0' },
            { key: 'floating_rock', name: 'Floating Rock', color: '#4a3a5a' },
            { key: 'shadow_glass', name: 'Shadow Glass', color: '#2a2040' },
        ], player.inventory, '');

        // Equipment
        this.renderInventorySection(this.elements.equipmentInventory, [
            { key: 'pipe', name: 'Pipe', color: '#707080' },
            { key: 'extractor', name: 'Extractor', color: '#8844aa' },
            { key: 'turret', name: 'Turret', color: '#668866' },
            { key: 'oxygen_station', name: 'O2 Station', color: '#4488cc' },
        ], player.inventory, '');
    }

    /**
     * Render a section of inventory
     */
    renderInventorySection(container, items, inventory, cssClass) {
        if (!container) return;

        const html = items
            .filter(item => (inventory[item.key] || 0) > 0)
            .map(item => `
                <div class="inventory-item ${cssClass}">
                    <div class="item-icon" style="background: ${item.color}"></div>
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-count">${inventory[item.key] || 0}</div>
                    </div>
                </div>
            `).join('');

        container.innerHTML = html || '<div style="color: #444; font-size: 11px; padding: 8px;">Empty</div>';
    }

    // ============ EQUIPMENT SYSTEM ============

    /**
     * Show equipment panel
     */
    showEquipment(player) {
        if (!this.elements.equipmentPanel) return;

        this.currentPlayer = player;
        this.equipmentOpen = true;
        this.elements.equipmentPanel.classList.remove('hidden');
        this.renderEquipment(player);
    }

    /**
     * Hide equipment panel
     */
    hideEquipment() {
        if (this.elements.equipmentPanel) {
            this.elements.equipmentPanel.classList.add('hidden');
        }
        this.equipmentOpen = false;
    }

    /**
     * Toggle equipment
     */
    toggleEquipment(player) {
        if (this.equipmentOpen) {
            this.hideEquipment();
        } else {
            this.showEquipment(player);
        }
    }

    /**
     * Render equipment slots and available tools
     */
    renderEquipment(player) {
        // Render equipped items
        this.renderEquipmentSlot('excavator', player.livingTools.excavator, this.elements.slotExcavator, this.elements.descExcavator);
        this.renderEquipmentSlot('movement', player.livingTools.movement, this.elements.slotMovement, this.elements.descMovement);
        this.renderEquipmentSlot('vision', player.livingTools.vision, this.elements.slotVision, this.elements.descVision);
        this.renderEquipmentSlot('storage', player.livingTools.storage, this.elements.slotStorage, this.elements.descStorage);

        // Render available tools
        this.renderAvailableTools(player);
    }

    /**
     * Render a single equipment slot
     */
    renderEquipmentSlot(slotType, equippedId, slotEl, descEl) {
        if (!slotEl || !descEl) return;

        const slot = slotEl.closest('.equipment-slot');

        if (equippedId) {
            const toolData = LIVING_TOOLS[equippedId.toUpperCase()];
            if (toolData) {
                slotEl.innerHTML = `<div class="equipped-tool">${toolData.name}</div>`;
                descEl.textContent = toolData.description;
                slot.classList.add('filled');
            }
        } else {
            slotEl.innerHTML = '<span class="empty-slot">Empty</span>';
            descEl.textContent = this.getSlotHint(slotType);
            slot.classList.remove('filled');
        }
    }

    /**
     * Get hint text for empty slot
     */
    getSlotHint(slotType) {
        const hints = {
            excavator: 'Equip a mining tool for faster digging',
            movement: 'Equip mobility gear for traversal',
            vision: 'Equip sensing tools to see better',
            storage: 'Equip storage upgrades for more capacity',
        };
        return hints[slotType] || 'Equip a tool';
    }

    /**
     * Render available tools that can be equipped
     */
    renderAvailableTools(player) {
        if (!this.elements.availableToolsGrid) return;

        // Get all living tools
        const tools = Object.values(LIVING_TOOLS);

        const html = tools.map(tool => {
            const isEquipped = Object.values(player.livingTools).includes(tool.id);
            const canCraft = this.canCraftTool(tool, player);

            return `
                <div class="tool-card ${!canCraft && !isEquipped ? 'locked' : ''}"
                     data-tool-id="${tool.id}"
                     data-category="${tool.category}">
                    <div class="tool-card-name">${tool.name}${isEquipped ? ' (Equipped)' : ''}</div>
                    <div class="tool-card-category">${tool.category} - Tier ${tool.tier}</div>
                    <div class="tool-card-desc">${tool.description}</div>
                    ${!canCraft && !isEquipped ? '<div style="color: #ff4444; font-size: 9px; margin-top: 4px;">Missing materials</div>' : ''}
                </div>
            `;
        }).join('');

        this.elements.availableToolsGrid.innerHTML = html;

        // Add click handlers
        this.elements.availableToolsGrid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.dataset.toolId;
                const category = card.dataset.category;
                if (!card.classList.contains('locked')) {
                    this.onEquipTool(toolId, category);
                    this.renderEquipment(player);
                }
            });
        });
    }

    /**
     * Check if player has materials to craft/use a tool
     */
    canCraftTool(tool, player) {
        // For now, all tools are available
        // In full implementation, check tool.feedCost against player.inventory
        return true;
    }

    /**
     * Check if any panel is open
     */
    isAnyPanelOpen() {
        return this.inventoryOpen || this.equipmentOpen;
    }

    /**
     * Close all panels
     */
    closeAllPanels() {
        this.hideInventory();
        this.hideEquipment();
    }

    /**
     * Format item name for display
     */
    formatItemName(item) {
        const names = {
            'vitae_sap_small': 'Vitae Sap (trace)',
            'vitae_sap': 'Vitae Sap',
            'vitae_sap_pure': 'Pure Vitae Sap',
            'ignis_plasma_small': 'Ignis Plasma (trace)',
            'ignis_plasma': 'Ignis Plasma',
            'ignis_plasma_pure': 'Pure Ignis Plasma',
            'umbra_ichor_small': 'Umbra Ichor (trace)',
            'umbra_ichor': 'Umbra Ichor',
            'umbra_ichor_pure': 'Pure Umbra Ichor',
            'dragon_bone': 'Dragon Bone',
            'dragon_claw': 'Dragon Claw',
            'dragon_tooth': 'Dragon Tooth',
            'dragon_skull': 'Dragon Skull',
            'dragon_ribcage': 'Dragon Ribcage',
        };
        return names[item] || item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

export default UIManager;
