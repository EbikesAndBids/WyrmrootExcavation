/**
 * UI Manager
 * Handles all UI updates and interactions
 * Full inventory, equipment, and recall systems
 */

import { TOOLS, SONAR, BIOMES, LIVING_TOOLS, CHASSIS_TYPES, EQUIPMENT_SETS, ITEMS } from '../core/Constants.js';

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
            // Equipment slots (5 slots)
            slotExcavator: document.getElementById('slot-excavator'),
            slotSuit: document.getElementById('slot-suit'),
            slotBackpack: document.getElementById('slot-backpack'),
            slotUtility: document.getElementById('slot-utility'),
            slotSymbiote: document.getElementById('slot-symbiote'),
            descExcavator: document.getElementById('desc-excavator'),
            descSuit: document.getElementById('desc-suit'),
            descBackpack: document.getElementById('desc-backpack'),
            descUtility: document.getElementById('desc-utility'),
            descSymbiote: document.getElementById('desc-symbiote'),
            availableToolsGrid: document.getElementById('available-tools-grid'),
            setBonusDisplay: document.getElementById('set-bonus-display'),
            biomassValue: document.getElementById('biomass-value'),
            // Bio-Forge
            bioforgePanel: document.getElementById('bioforge-panel'),
            chassisDropdown: document.getElementById('chassis-dropdown'),
            chassisSelected: document.getElementById('chassis-selected'),
            chassisOptions: document.getElementById('chassis-options'),
            strainDropdown: document.getElementById('strain-dropdown'),
            strainSelected: document.getElementById('strain-selected'),
            strainOptions: document.getElementById('strain-options'),
            catalystDropdown: document.getElementById('catalyst-dropdown'),
            catalystSelected: document.getElementById('catalyst-selected'),
            catalystOptions: document.getElementById('catalyst-options'),
            forgeResult: document.getElementById('forge-result'),
            forgeCost: document.getElementById('forge-cost'),
            forgeButton: document.getElementById('forge-button'),
            // Inventory tabs and crafting
            inventorySlotsUsed: document.getElementById('inventory-slots-used'),
            inventorySlotsMax: document.getElementById('inventory-slots-max'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            craftingCategories: document.querySelectorAll('.craft-cat-btn'),
            craftingRecipes: document.getElementById('crafting-recipes'),
            recipeName: document.getElementById('recipe-name'),
            recipeInputs: document.getElementById('recipe-inputs'),
            recipeOutputs: document.getElementById('recipe-outputs'),
            craftAmount: document.getElementById('craft-amount'),
            craftAmountBtns: document.querySelectorAll('.craft-amount-btn'),
            craftButton: document.getElementById('craft-button'),
            // Dragon materials (new combined section)
            dragonInventory: document.getElementById('dragon-inventory'),
        };

        // Bio-Forge state
        this.forgeState = {
            chassis: null,
            strain: null,
            catalyst: null,
        };

        // State
        this.inventoryOpen = false;
        this.equipmentOpen = false;
        this.bioforgeOpen = false;
        this.currentPlayer = null;
        this.craftingSystem = null;

        // Crafting UI state
        this.selectedCraftCategory = 'building';
        this.selectedRecipe = null;
        this.craftAmount = 1;

        // Hotbar state (slots 0-8 for keys 1-9)
        this.hotbar = [
            { type: 'tool', id: 'drill' },      // Slot 1 - Drill
            { type: 'tool', id: 'sonar' },      // Slot 2 - Sonar
            null, null, null, null, null, null, null  // Slots 3-9 - empty
        ];
        this.selectedHotbarSlot = 0;

        // Drag and drop state
        this.draggedItem = null;

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
        this.setupBioForge();
        this.setupInventoryTabs();
        this.setupCraftingUI();
        this.setupHotbarDragDrop();
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
                } else if (panelType === 'bioforge') {
                    this.hideBioForge();
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
    onCraft(chassisId, strainType, catalystRarity) {}
    onHotbarSelect(slotIndex, slotData) {}
    onCraftMaterial(recipeId, count) {}

    /**
     * Setup Bio-Forge UI with custom dropdowns
     */
    setupBioForge() {
        // Populate chassis options
        if (this.elements.chassisOptions) {
            this.elements.chassisOptions.innerHTML = '';
            for (const [key, chassis] of Object.entries(CHASSIS_TYPES)) {
                const option = document.createElement('div');
                option.className = 'dropdown-option';
                option.dataset.value = chassis.id;
                option.textContent = `${chassis.name} (Tier ${chassis.tier})`;
                this.elements.chassisOptions.appendChild(option);
            }
        }

        // Setup dropdown click handlers
        this.setupCustomDropdown('chassis');
        this.setupCustomDropdown('strain');
        this.setupCustomDropdown('catalyst');

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Forge button
        if (this.elements.forgeButton) {
            this.elements.forgeButton.addEventListener('click', () => {
                if (this.forgeState.chassis && this.forgeState.strain) {
                    this.onCraft(this.forgeState.chassis, this.forgeState.strain, this.forgeState.catalyst);
                }
            });
        }
    }

    /**
     * Setup a custom dropdown with click handlers
     */
    setupCustomDropdown(name) {
        const dropdown = this.elements[`${name}Dropdown`];
        const selected = this.elements[`${name}Selected`];
        const options = this.elements[`${name}Options`];

        if (!dropdown || !selected || !options) {
            console.warn(`Bio-Forge: Missing elements for ${name} dropdown`);
            return;
        }

        // Toggle dropdown on click
        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            this.closeAllDropdowns();
            if (!isOpen) {
                dropdown.classList.add('open');
            }
        });

        // Handle option selection
        options.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (!option) return;

            e.stopPropagation();

            const value = option.dataset.value;
            const text = option.textContent;

            // Update selected display
            selected.textContent = text;

            // Mark as selected
            options.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Update forge state
            this.forgeState[name] = value || null;

            // Close dropdown
            dropdown.classList.remove('open');

            // Update preview
            this.updateForgePreview();
        });
    }

    /**
     * Close all custom dropdowns
     */
    closeAllDropdowns() {
        document.querySelectorAll('.custom-dropdown.open').forEach(dd => {
            dd.classList.remove('open');
        });
    }

    /**
     * Setup inventory tab switching
     */
    setupInventoryTabs() {
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    /**
     * Switch between inventory tabs
     */
    switchTab(tabId) {
        // Update button states
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content visibility
        this.elements.tabContents.forEach(content => {
            const contentId = content.id.replace('-tab', '');
            content.classList.toggle('active', contentId === tabId);
        });

        // Refresh crafting UI if switching to crafting tab
        if (tabId === 'crafting' && this.currentPlayer && this.craftingSystem) {
            this.renderCraftingRecipes();
        }
    }

    /**
     * Setup crafting UI
     */
    setupCraftingUI() {
        // Category buttons
        this.elements.craftingCategories.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCraftCategory = btn.dataset.category;
                this.elements.craftingCategories.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderCraftingRecipes();
            });
        });

        // Amount buttons
        this.elements.craftAmountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount;
                if (amount === 'max') {
                    if (this.selectedRecipe && this.currentPlayer && this.craftingSystem) {
                        this.craftAmount = this.craftingSystem.getMaxCraftable(this.currentPlayer, this.selectedRecipe);
                    }
                } else {
                    this.craftAmount = Math.max(1, this.craftAmount + parseInt(amount));
                }
                this.updateCraftAmount();
            });
        });

        // Craft button
        if (this.elements.craftButton) {
            this.elements.craftButton.addEventListener('click', () => {
                if (this.selectedRecipe) {
                    this.onCraftMaterial(this.selectedRecipe.id, this.craftAmount);
                    // Refresh after crafting
                    if (this.currentPlayer) {
                        this.renderInventory(this.currentPlayer);
                        this.renderCraftingRecipes();
                    }
                }
            });
        }
    }

    /**
     * Render crafting recipes for current category
     */
    renderCraftingRecipes() {
        if (!this.elements.craftingRecipes || !this.craftingSystem || !this.currentPlayer) return;

        const recipes = this.craftingSystem.getMaterialRecipes(this.selectedCraftCategory);

        const html = recipes.map(recipe => {
            const canCraft = this.craftingSystem.canCraftMaterial(this.currentPlayer, recipe.id);
            const costText = Object.entries(recipe.inputs)
                .map(([item, count]) => `${count} ${this.formatItemName(item)}`)
                .join(', ');

            return `
                <div class="recipe-card ${canCraft ? '' : 'unavailable'} ${this.selectedRecipe?.id === recipe.id ? 'selected' : ''}"
                     data-recipe-id="${recipe.id}">
                    <div class="recipe-card-name">${recipe.name}</div>
                    <div class="recipe-card-cost">${costText}</div>
                </div>
            `;
        }).join('');

        this.elements.craftingRecipes.innerHTML = html || '<div style="color: #555; padding: 20px; text-align: center;">No recipes in this category</div>';

        // Add click handlers
        this.elements.craftingRecipes.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                this.selectRecipe(recipeId);
            });
        });
    }

    /**
     * Select a crafting recipe
     */
    selectRecipe(recipeId) {
        if (!this.craftingSystem) return;

        const recipe = this.craftingSystem.getMaterialRecipes().find(r => r.id === recipeId);
        if (!recipe) return;

        this.selectedRecipe = recipe;
        this.craftAmount = 1;

        // Update selected state in recipe cards
        this.elements.craftingRecipes.querySelectorAll('.recipe-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.recipeId === recipeId);
        });

        // Update recipe info panel
        if (this.elements.recipeName) {
            this.elements.recipeName.textContent = recipe.name;
        }

        if (this.elements.recipeInputs) {
            const inputsText = Object.entries(recipe.inputs)
                .map(([item, count]) => {
                    const have = this.currentPlayer?.inventory[item] || 0;
                    const color = have >= count ? '#00ffaa' : '#ff6666';
                    return `<span style="color: ${color}">${count} ${this.formatItemName(item)} (have: ${have})</span>`;
                })
                .join('<br>');
            this.elements.recipeInputs.innerHTML = `<strong>Requires:</strong><br>${inputsText}`;
        }

        if (this.elements.recipeOutputs) {
            const outputsText = Object.entries(recipe.outputs)
                .map(([item, count]) => `${count} ${this.formatItemName(item)}`)
                .join(', ');
            this.elements.recipeOutputs.innerHTML = `<strong>Creates:</strong> ${outputsText}`;
        }

        this.updateCraftAmount();
    }

    /**
     * Update craft amount display and button state
     */
    updateCraftAmount() {
        if (this.elements.craftAmount) {
            this.elements.craftAmount.textContent = this.craftAmount;
        }

        if (this.elements.craftButton && this.selectedRecipe && this.craftingSystem && this.currentPlayer) {
            const canCraft = this.craftingSystem.canCraftMaterial(this.currentPlayer, this.selectedRecipe.id, this.craftAmount);
            this.elements.craftButton.disabled = !canCraft;
        }
    }

    /**
     * Setup hotbar drag and drop
     */
    setupHotbarDragDrop() {
        // Make tool slots accept drops
        this.elements.toolSlots.forEach((slot, index) => {
            // Click to select
            slot.addEventListener('click', () => {
                this.selectHotbarSlot(index);
            });

            // Drag over handling
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (index >= 2) { // Only slots 3-9 (index 2-8) are customizable
                    slot.classList.add('drag-over');
                }
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');

                if (index >= 2 && this.draggedItem) {
                    this.assignToHotbar(index, this.draggedItem);
                    this.draggedItem = null;
                    this.updateHotbarDisplay();
                    if (this.currentPlayer) {
                        this.renderInventory(this.currentPlayer);
                    }
                }
            });
        });
    }

    /**
     * Select a hotbar slot
     */
    selectHotbarSlot(index) {
        this.selectedHotbarSlot = index;

        // Update visual selection
        this.elements.toolSlots.forEach((slot, i) => {
            slot.classList.toggle('active', i === index);
        });

        // Notify game of selection
        const slotData = this.hotbar[index];
        this.onHotbarSelect(index, slotData);
    }

    /**
     * Assign an item to hotbar slot
     */
    assignToHotbar(slotIndex, item) {
        // Remove item from any other hotbar slot first
        for (let i = 2; i < this.hotbar.length; i++) {
            if (this.hotbar[i]?.id === item.id && this.hotbar[i]?.type === item.type) {
                this.hotbar[i] = null;
            }
        }

        this.hotbar[slotIndex] = item;
    }

    /**
     * Remove item from hotbar slot
     */
    removeFromHotbar(slotIndex) {
        if (slotIndex >= 2) { // Can only remove from customizable slots
            this.hotbar[slotIndex] = null;
            this.updateHotbarDisplay();
        }
    }

    /**
     * Update hotbar visual display
     */
    updateHotbarDisplay() {
        this.elements.toolSlots.forEach((slot, index) => {
            const item = this.hotbar[index];
            const iconEl = slot.querySelector('.slot-icon');
            const nameEl = slot.querySelector('.tool-name');
            const countEl = slot.querySelector('.tool-count');

            if (!item) {
                // Empty slot
                slot.classList.add('empty');
                slot.removeAttribute('data-tool');
                if (iconEl) iconEl.innerHTML = '';
                if (nameEl) nameEl.textContent = '';
                if (countEl) countEl.textContent = '';
            } else if (item.type === 'tool') {
                // Built-in tool (drill, sonar)
                slot.classList.remove('empty');
                slot.setAttribute('data-tool', item.id);
                if (nameEl) nameEl.textContent = item.id.charAt(0).toUpperCase() + item.id.slice(1);
            } else if (item.type === 'item') {
                // Inventory item
                slot.classList.remove('empty');
                slot.removeAttribute('data-tool');

                const itemDef = ITEMS[item.id];
                const color = this.getItemColor(item.id);
                const count = this.currentPlayer?.inventory[item.id] || 0;

                if (iconEl) {
                    iconEl.innerHTML = `<div class="item-icon-small" style="background: ${color}"></div>`;
                }
                if (nameEl) {
                    nameEl.textContent = this.formatItemName(item.id).substring(0, 8);
                }
                if (countEl) {
                    countEl.textContent = count > 0 ? count : '';
                }
            }
        });
    }

    /**
     * Get hotbar data for use by game
     */
    getHotbar() {
        return this.hotbar;
    }

    /**
     * Get currently selected hotbar slot
     */
    getSelectedSlot() {
        return {
            index: this.selectedHotbarSlot,
            data: this.hotbar[this.selectedHotbarSlot]
        };
    }

    /**
     * Get item color for display
     */
    getItemColor(itemId) {
        const colorMap = {
            'wood_plank': '#8b6914',
            'ladder': '#9a7b2a',
            'platform': '#7a6b5a',
            'torch': '#ffd700',
            'storage_crate': '#8b7355',
            'reinforced_stone': '#5a5a6a',
            'glass_pane': '#aaccee',
            'pipe': '#707080',
            'turret': '#668866',
            'extractor': '#8844aa',
            'oxygen_station': '#4488cc',
            'dirt': '#3a2718',
            'stone': '#4a4a4a',
            'petrified_wood': '#5a4030',
            'amber': '#d4a020',
            'gravel': '#6a6a5a',
            'volcanic_rock': '#3a2020',
            'basalt': '#2a2a2a',
            'obsidian': '#1a1a2a',
            'void_stone': '#1a0a2a',
            'crystal': '#8060c0',
            'floating_rock': '#4a3a5a',
            'shadow_glass': '#2a2040',
        };
        return colorMap[itemId] || '#666';
    }

    /**
     * Update forge preview based on current selections
     */
    updateForgePreview() {
        const chassisId = this.forgeState.chassis;
        const strainType = this.forgeState.strain;

        if (!chassisId || !strainType) {
            if (this.elements.forgeResult) {
                this.elements.forgeResult.innerHTML = '<span style="color: #666;">Select chassis and strain to see result</span>';
            }
            if (this.elements.forgeButton) {
                this.elements.forgeButton.disabled = true;
            }
            if (this.elements.forgeCost) {
                this.elements.forgeCost.innerHTML = '';
            }
            return;
        }

        // Find recipe result
        const recipeKey = `${chassisId}+${strainType}`;
        const recipes = {
            'basic_drill+vitae': 'vorpal_claw',
            'basic_drill+ignis': 'magma_worm',
            'basic_drill+umbra': 'void_borer',
            'titanium_drill+vitae': 'spore_drill',
            'titanium_drill+ignis': 'inferno_jet',
            'titanium_drill+umbra': 'singularity_pick',
            'void_drill+vitae': 'root_singer',
            'void_drill+ignis': 'core_burner',
            'void_drill+umbra': 'null_breaker',
            'basic_suit+vitae': 'photosynthesis_plating',
            'basic_suit+ignis': 'heat_shell',
            'basic_suit+umbra': 'shadow_cloak',
            'thermal_suit+vitae': 'regen_suit',
            'thermal_suit+ignis': 'thermal_vent_rig',
            'thermal_suit+umbra': 'void_suit',
            'phase_suit+vitae': 'living_armor',
            'phase_suit+ignis': 'magma_skin',
            'phase_suit+umbra': 'phase_shift_armor',
            'basic_pack+vitae': 'gulper_sack',
            'basic_pack+ignis': 'heat_pack',
            'basic_pack+umbra': 'turret_mount',
            'refinery_pack+vitae': 'garden_pack',
            'refinery_pack+ignis': 'mobile_refinery',
            'refinery_pack+umbra': 'void_pack',
            'grapple_frame+vitae': 'vine_grapple',
            'grapple_frame+ignis': 'flame_jets',
            'grapple_frame+umbra': 'stasis_field',
            'scanner_frame+vitae': 'root_sense',
            'scanner_frame+ignis': 'ore_scanner',
            'scanner_frame+umbra': 'void_sight',
        };

        const resultId = recipes[recipeKey];

        if (resultId) {
            const tool = LIVING_TOOLS[resultId.toUpperCase()];
            if (tool && this.elements.forgeResult) {
                const catalystBonus = this.forgeState.catalyst ?
                    { common: '+0%', uncommon: '+50%', rare: '+100%', legendary: '+200%' }[this.forgeState.catalyst] : '';

                this.elements.forgeResult.innerHTML = `
                    <div class="preview-tool ${strainType}">
                        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${tool.name}</div>
                        <div style="font-size: 11px; color: #888;">${tool.category} - Tier ${tool.tier}</div>
                        <div style="font-size: 11px; margin-top: 8px;">${tool.description}</div>
                        ${catalystBonus ? `<div style="font-size: 10px; color: #ffcc00; margin-top: 4px;">Catalyst: ${catalystBonus} power</div>` : ''}
                    </div>
                `;
            }

            // Show cost
            if (this.elements.forgeCost) {
                const chassis = CHASSIS_TYPES[chassisId.toUpperCase()];
                const strainCost = this.getStrainCostText(strainType, chassis?.tier || 1);
                const chassisCost = chassis ? Object.entries(chassis.cost).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(', ') : '';

                this.elements.forgeCost.innerHTML = `
                    <div style="font-size: 11px; color: #888; text-align: center;">
                        <strong>Cost:</strong> ${chassisCost} + ${strainCost}
                    </div>
                `;
            }

            if (this.elements.forgeButton) {
                this.elements.forgeButton.disabled = false;
            }
        } else {
            if (this.elements.forgeResult) {
                this.elements.forgeResult.innerHTML = '<span style="color: #ff6666;">Invalid combination - no recipe exists</span>';
            }
            if (this.elements.forgeButton) {
                this.elements.forgeButton.disabled = true;
            }
            if (this.elements.forgeCost) {
                this.elements.forgeCost.innerHTML = '';
            }
        }
    }

    /**
     * Get strain cost text for display
     * Tier 1: small/trace sap (from capillaries)
     * Tier 2: regular sap (from roots)
     * Tier 3: pure sap (from cores)
     */
    getStrainCostText(strainType, tier) {
        const costs = {
            vitae: {
                1: '8 vitae sap (trace)',
                2: '10 vitae sap',
                3: '5 pure vitae sap',
            },
            ignis: {
                1: '8 ignis plasma (trace)',
                2: '10 ignis plasma',
                3: '5 pure ignis plasma',
            },
            umbra: {
                1: '8 umbra ichor (trace)',
                2: '10 umbra ichor',
                3: '5 pure umbra ichor',
            },
        };

        return costs[strainType]?.[tier] || '';
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
    showInventory(player, craftingSystem = null) {
        if (!this.elements.inventoryPanel) return;

        this.currentPlayer = player;
        if (craftingSystem) {
            this.craftingSystem = craftingSystem;
        }
        this.inventoryOpen = true;
        this.elements.inventoryPanel.classList.remove('hidden');
        this.renderInventory(player);

        // Initialize crafting UI if crafting system is available
        if (this.craftingSystem) {
            this.renderCraftingRecipes();
        }
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
        // Update inventory capacity display
        this.updateInventoryCapacity(player);

        // Dragon Materials (all sap types combined)
        this.renderInventorySection(this.elements.dragonInventory, [
            { key: 'vitae_sap_small', name: 'Vitae Sap (trace)', color: '#00aa77' },
            { key: 'vitae_sap', name: 'Vitae Sap', color: '#00ffaa' },
            { key: 'vitae_sap_pure', name: 'Pure Vitae Sap', color: '#00ffdd' },
            { key: 'ignis_plasma_small', name: 'Ignis Plasma (trace)', color: '#cc6600' },
            { key: 'ignis_plasma', name: 'Ignis Plasma', color: '#ff9900' },
            { key: 'ignis_plasma_pure', name: 'Pure Ignis Plasma', color: '#ffcc00' },
            { key: 'umbra_ichor_small', name: 'Umbra Ichor (trace)', color: '#6600aa' },
            { key: 'umbra_ichor', name: 'Umbra Ichor', color: '#9900ff' },
            { key: 'umbra_ichor_pure', name: 'Pure Umbra Ichor', color: '#cc66ff' },
        ], player.inventory, '');

        // Fossils
        this.renderInventorySection(this.elements.fossilInventory, [
            { key: 'dragon_bone', name: 'Dragon Bone', color: '#d0c8b0' },
            { key: 'dragon_claw', name: 'Dragon Claw', color: '#c0b8a0' },
            { key: 'dragon_tooth', name: 'Dragon Tooth', color: '#e0d8c0' },
            { key: 'dragon_skull', name: 'Dragon Skull', color: '#d8d0b8' },
            { key: 'dragon_ribcage', name: 'Dragon Ribcage', color: '#c8c0a8' },
        ], player.inventory, 'fossil');

        // Building Materials (placeable items)
        this.renderInventorySection(this.elements.materialsInventory, [
            { key: 'wood_plank', name: 'Wood Plank', color: '#8b6914', placeable: true },
            { key: 'ladder', name: 'Ladder', color: '#9a7b2a', placeable: true },
            { key: 'platform', name: 'Platform', color: '#7a6b5a', placeable: true },
            { key: 'torch', name: 'Torch', color: '#ffd700', placeable: true },
            { key: 'reinforced_stone', name: 'Reinforced Stone', color: '#5a5a6a', placeable: true },
            { key: 'glass_pane', name: 'Glass Pane', color: '#aaccee', placeable: true },
            { key: 'storage_crate', name: 'Storage Crate', color: '#8b7355', placeable: true },
            { key: 'dirt', name: 'Dirt', color: '#3a2718', placeable: true },
            { key: 'stone', name: 'Stone', color: '#4a4a4a', placeable: true },
            { key: 'petrified_wood', name: 'Petrified Wood', color: '#5a4030', placeable: true },
            { key: 'amber', name: 'Amber', color: '#d4a020' },
            { key: 'gravel', name: 'Gravel', color: '#6a6a5a', placeable: true },
            { key: 'volcanic_rock', name: 'Volcanic Rock', color: '#3a2020', placeable: true },
            { key: 'basalt', name: 'Basalt', color: '#2a2a2a', placeable: true },
            { key: 'obsidian', name: 'Obsidian', color: '#1a1a2a', placeable: true },
            { key: 'ash', name: 'Volcanic Ash', color: '#5a5050', placeable: true },
            { key: 'void_stone', name: 'Void Stone', color: '#1a0a2a', placeable: true },
            { key: 'crystal', name: 'Crystal', color: '#8060c0', placeable: true },
            { key: 'floating_rock', name: 'Floating Rock', color: '#4a3a5a', placeable: true },
            { key: 'shadow_glass', name: 'Shadow Glass', color: '#2a2040', placeable: true },
        ], player.inventory, '');

        // Equipment/Machines
        this.renderInventorySection(this.elements.equipmentInventory, [
            { key: 'pipe', name: 'Pipe', color: '#707080', placeable: true },
            { key: 'extractor', name: 'Extractor', color: '#8844aa', placeable: true },
            { key: 'turret', name: 'Turret', color: '#668866', placeable: true },
            { key: 'oxygen_station', name: 'O2 Station', color: '#4488cc', placeable: true },
        ], player.inventory, '');

        // Update hotbar display
        this.updateHotbarDisplay();
    }

    /**
     * Update inventory capacity display
     */
    updateInventoryCapacity(player) {
        if (!player) return;

        // Count unique item stacks (simplified - each item type = 1 slot)
        let usedSlots = 0;
        for (const [item, count] of Object.entries(player.inventory)) {
            if (count > 0) usedSlots++;
        }

        const maxSlots = player.getInventorySlots ? player.getInventorySlots() : 20;

        if (this.elements.inventorySlotsUsed) {
            this.elements.inventorySlotsUsed.textContent = usedSlots;
        }
        if (this.elements.inventorySlotsMax) {
            this.elements.inventorySlotsMax.textContent = maxSlots;
        }
    }

    /**
     * Render a section of inventory
     */
    renderInventorySection(container, items, inventory, cssClass) {
        if (!container) return;

        const html = items
            .filter(item => (inventory[item.key] || 0) > 0)
            .map(item => {
                const isPlaceable = item.placeable || ITEMS[item.key]?.placeable;
                const hotbarSlot = this.getHotbarSlotForItem(item.key);
                const classes = [
                    'inventory-item',
                    cssClass,
                    isPlaceable ? 'placeable draggable' : '',
                    hotbarSlot !== null ? 'in-hotbar' : ''
                ].filter(Boolean).join(' ');

                return `
                    <div class="${classes}"
                         data-item-id="${item.key}"
                         ${isPlaceable ? 'draggable="true"' : ''}
                         ${hotbarSlot !== null ? `data-hotbar-slot="${hotbarSlot + 1}"` : ''}>
                        <div class="item-icon" style="background: ${item.color}"></div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-count">${inventory[item.key] || 0}</div>
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = html || '<div style="color: #444; font-size: 11px; padding: 8px;">Empty</div>';

        // Setup drag handlers for draggable items
        container.querySelectorAll('.inventory-item.draggable').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                const itemId = el.dataset.itemId;
                this.draggedItem = { type: 'item', id: itemId };
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', itemId);
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                this.draggedItem = null;
            });
        });
    }

    /**
     * Get hotbar slot index for an item (or null if not in hotbar)
     */
    getHotbarSlotForItem(itemId) {
        for (let i = 2; i < this.hotbar.length; i++) {
            if (this.hotbar[i]?.type === 'item' && this.hotbar[i]?.id === itemId) {
                return i;
            }
        }
        return null;
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
        // Render equipped items (5 slots)
        this.renderEquipmentSlot('excavator', player.livingTools.excavator, this.elements.slotExcavator, this.elements.descExcavator);
        this.renderEquipmentSlot('suit', player.livingTools.suit, this.elements.slotSuit, this.elements.descSuit);
        this.renderEquipmentSlot('backpack', player.livingTools.backpack, this.elements.slotBackpack, this.elements.descBackpack);
        this.renderEquipmentSlot('utility', player.livingTools.utility, this.elements.slotUtility, this.elements.descUtility);
        this.renderEquipmentSlot('symbiote', player.livingTools.symbiote, this.elements.slotSymbiote, this.elements.descSymbiote);

        // Render set bonuses
        this.renderSetBonuses(player);

        // Render biomass
        if (this.elements.biomassValue) {
            this.elements.biomassValue.textContent = player.biomass || 0;
        }

        // Render available tools
        this.renderAvailableTools(player);
    }

    /**
     * Render set bonuses
     */
    renderSetBonuses(player) {
        if (!this.elements.setBonusDisplay) return;

        if (!player.activeBonuses || player.activeBonuses.length === 0) {
            this.elements.setBonusDisplay.innerHTML = '<div class="no-bonus">No set bonuses active</div>';
            return;
        }

        const html = player.activeBonuses.map(bonus => `
            <div class="set-bonus ${bonus.brood}">
                <span class="bonus-name">${bonus.name}</span>
                <span class="bonus-count">(${bonus.count} pieces)</span>
            </div>
        `).join('');

        this.elements.setBonusDisplay.innerHTML = html;
    }

    /**
     * Render a single equipment slot
     */
    renderEquipmentSlot(slotType, equipped, slotEl, descEl) {
        if (!slotEl || !descEl) return;

        const slot = slotEl.closest('.equipment-slot');

        if (equipped) {
            // Handle both tool objects and tool IDs
            const toolData = typeof equipped === 'string'
                ? LIVING_TOOLS[equipped.toUpperCase()]
                : equipped;

            if (toolData) {
                const broodClass = toolData.brood || '';
                const levelInfo = toolData.level ? ` Lv.${toolData.level}` : '';
                slotEl.innerHTML = `
                    <div class="equipped-tool ${broodClass}">
                        ${toolData.name}${levelInfo}
                    </div>
                `;
                descEl.textContent = toolData.description;
                if (slot) slot.classList.add('filled');
            }
        } else {
            slotEl.innerHTML = '<span class="empty-slot">Empty</span>';
            descEl.textContent = this.getSlotHint(slotType);
            if (slot) slot.classList.remove('filled');
        }
    }

    /**
     * Get hint text for empty slot
     */
    getSlotHint(slotType) {
        const hints = {
            excavator: 'Equip a mining tool for digging',
            suit: 'Equip an exosuit for protection',
            backpack: 'Equip storage or support gear',
            utility: 'Equip a gadget for abilities',
            symbiote: 'Equip a companion creature',
        };
        return hints[slotType] || 'Equip a tool';
    }

    /**
     * Render available tools that can be equipped (only shows crafted tools)
     */
    renderAvailableTools(player) {
        if (!this.elements.availableToolsGrid) return;

        // Only show crafted tools - players must craft before equipping
        const craftedTools = player.craftedTools || [];

        if (craftedTools.length === 0) {
            this.elements.availableToolsGrid.innerHTML = `
                <div style="color: #666; font-size: 11px; padding: 16px; text-align: center;">
                    No tools crafted yet.<br>
                    Use the Bio-Forge [B] to craft living tools.
                </div>
            `;
            return;
        }

        const html = craftedTools.map(tool => {
            // Check if this tool is currently equipped
            const equippedTools = Object.values(player.livingTools);
            const isEquipped = equippedTools.some(t => t && t.id === tool.id);
            const broodClass = tool.brood || '';

            return `
                <div class="tool-card ${broodClass} ${isEquipped ? 'equipped' : ''}"
                     data-tool-id="${tool.id}"
                     data-category="${tool.category}">
                    <div class="tool-card-name">${tool.name}${isEquipped ? ' (Equipped)' : ''}</div>
                    <div class="tool-card-category">${tool.category} - Tier ${tool.tier}</div>
                    <div class="tool-card-desc">${tool.description}</div>
                </div>
            `;
        }).join('');

        this.elements.availableToolsGrid.innerHTML = html;

        // Use event delegation on the grid itself (set up once)
        // Remove old handler and add new one to prevent accumulation
        if (!this.toolGridHandlerAttached) {
            this.elements.availableToolsGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.tool-card');
                if (!card || card.classList.contains('equipped')) return;

                const toolId = card.dataset.toolId;
                if (toolId && this.currentPlayer) {
                    this.onEquipTool(toolId, card.dataset.category);
                    this.renderEquipment(this.currentPlayer);
                }
            });
            this.toolGridHandlerAttached = true;
        }
    }

    /**
     * Check if player has materials to craft/use a tool
     */
    canCraftTool(tool, player) {
        // For now, all tools are available
        // In full implementation, check tool.feedCost against player.inventory
        return true;
    }

    // ============ BIO-FORGE SYSTEM ============

    /**
     * Show Bio-Forge panel
     */
    showBioForge(player) {
        if (!this.elements.bioforgePanel) return;

        this.currentPlayer = player;
        this.bioforgeOpen = true;
        this.elements.bioforgePanel.classList.remove('hidden');

        // Reset the forge state and UI
        this.resetBioForge();
    }

    /**
     * Reset Bio-Forge to initial state
     */
    resetBioForge() {
        this.forgeState = {
            chassis: null,
            strain: null,
            catalyst: null,
        };

        // Reset dropdown displays
        if (this.elements.chassisSelected) {
            this.elements.chassisSelected.textContent = 'Select Chassis...';
        }
        if (this.elements.strainSelected) {
            this.elements.strainSelected.textContent = 'Select Strain...';
        }
        if (this.elements.catalystSelected) {
            this.elements.catalystSelected.textContent = 'No Catalyst';
        }

        // Clear selected states
        document.querySelectorAll('.dropdown-option.selected').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Update preview
        this.updateForgePreview();
    }

    /**
     * Hide Bio-Forge panel
     */
    hideBioForge() {
        if (this.elements.bioforgePanel) {
            this.elements.bioforgePanel.classList.add('hidden');
        }
        this.bioforgeOpen = false;
    }

    /**
     * Toggle Bio-Forge
     */
    toggleBioForge(player) {
        if (this.bioforgeOpen) {
            this.hideBioForge();
        } else {
            this.showBioForge(player);
        }
    }

    /**
     * Check if any panel is open
     */
    isAnyPanelOpen() {
        return this.inventoryOpen || this.equipmentOpen || this.bioforgeOpen;
    }

    /**
     * Close all panels
     */
    closeAllPanels() {
        this.hideInventory();
        this.hideEquipment();
        this.hideBioForge();
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
