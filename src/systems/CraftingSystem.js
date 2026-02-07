/**
 * Crafting System - The Bio-Forge
 * Handles equipment crafting using Chassis + Strain + Catalyst
 * Also manages tool evolution/mutation
 */

import {
    CHASSIS_TYPES, LIVING_TOOLS, MUTATIONS, ARTIFACTS,
    EQUIPMENT_SETS, EQUIPMENT_SLOTS
} from '../core/Constants.js';

export class CraftingSystem {
    constructor() {
        // Recipes: chassis + strain combination -> result
        this.recipes = this.initializeRecipes();

        // Material crafting recipes: input materials -> output
        this.materialRecipes = this.initializeMaterialRecipes();

        // Catalyst rarities
        this.catalysts = {
            common: { multiplier: 1, dropChance: 0.3 },
            uncommon: { multiplier: 1.5, dropChance: 0.15 },
            rare: { multiplier: 2, dropChance: 0.05 },
            legendary: { multiplier: 3, dropChance: 0.01 },
        };
    }

    /**
     * Initialize material crafting recipes
     * Format: { id, name, inputs: { item: count }, outputs: { item: count }, category }
     */
    initializeMaterialRecipes() {
        return [
            // Basic Building Materials
            {
                id: 'wood_plank',
                name: 'Wood Planks',
                category: 'building',
                inputs: { petrified_wood: 2 },
                outputs: { wood_plank: 4 },
            },
            {
                id: 'ladder',
                name: 'Ladder',
                category: 'building',
                inputs: { wood_plank: 3 },
                outputs: { ladder: 2 },
            },
            {
                id: 'platform',
                name: 'Platform',
                category: 'building',
                inputs: { wood_plank: 2 },
                outputs: { platform: 3 },
            },
            {
                id: 'torch',
                name: 'Torch',
                category: 'lighting',
                inputs: { wood_plank: 1, vitae_sap_small: 1 },
                outputs: { torch: 4 },
            },
            {
                id: 'torch_ignis',
                name: 'Ignis Torch',
                category: 'lighting',
                inputs: { wood_plank: 1, ignis_plasma_small: 1 },
                outputs: { torch: 6 },
            },
            // Storage
            {
                id: 'storage_crate',
                name: 'Storage Crate',
                category: 'storage',
                inputs: { wood_plank: 8, stone: 4 },
                outputs: { storage_crate: 1 },
            },
            // Advanced Building Materials
            {
                id: 'reinforced_stone',
                name: 'Reinforced Stone',
                category: 'building',
                inputs: { stone: 4, basalt: 2 },
                outputs: { reinforced_stone: 4 },
            },
            {
                id: 'glass_pane',
                name: 'Glass Pane',
                category: 'building',
                inputs: { crystal: 2 },
                outputs: { glass_pane: 4 },
            },
            {
                id: 'glass_pane_amber',
                name: 'Amber Glass',
                category: 'building',
                inputs: { amber: 2 },
                outputs: { glass_pane: 3 },
            },
            // Equipment crafting materials
            {
                id: 'pipe_craft',
                name: 'Pipe',
                category: 'equipment',
                inputs: { stone: 5, basalt: 2 },
                outputs: { pipe: 3 },
            },
            {
                id: 'extractor_craft',
                name: 'Extractor',
                category: 'equipment',
                inputs: { stone: 10, obsidian: 3, vitae_sap: 2 },
                outputs: { extractor: 1 },
            },
            {
                id: 'turret_craft',
                name: 'Turret',
                category: 'equipment',
                inputs: { basalt: 8, obsidian: 2, ignis_plasma: 2 },
                outputs: { turret: 1 },
            },
            {
                id: 'oxygen_station_craft',
                name: 'Oxygen Station',
                category: 'equipment',
                inputs: { stone: 15, crystal: 5, vitae_sap: 5 },
                outputs: { oxygen_station: 1 },
            },
            // Refined materials
            {
                id: 'pure_vitae',
                name: 'Purify Vitae Sap',
                category: 'refining',
                inputs: { vitae_sap: 5 },
                outputs: { vitae_sap_pure: 1 },
            },
            {
                id: 'pure_ignis',
                name: 'Purify Ignis Plasma',
                category: 'refining',
                inputs: { ignis_plasma: 5 },
                outputs: { ignis_plasma_pure: 1 },
            },
            {
                id: 'pure_umbra',
                name: 'Purify Umbra Ichor',
                category: 'refining',
                inputs: { umbra_ichor: 5 },
                outputs: { umbra_ichor_pure: 1 },
            },
        ];
    }

    /**
     * Initialize crafting recipes
     * Format: 'chassis_id+strain' => 'tool_id'
     */
    initializeRecipes() {
        return {
            // === EXCAVATORS ===
            // Tier 1: basic_drill (power 4)
            'basic_drill+vitae': 'vorpal_claw',
            'basic_drill+ignis': 'magma_worm',
            'basic_drill+umbra': 'void_borer',
            // Tier 2: titanium_drill (power 5)
            'titanium_drill+vitae': 'spore_drill',
            'titanium_drill+ignis': 'inferno_jet',
            'titanium_drill+umbra': 'singularity_pick',
            // Tier 3: void_drill (power 7)
            'void_drill+vitae': 'root_singer',
            'void_drill+ignis': 'core_burner',
            'void_drill+umbra': 'null_breaker',

            // === SUITS ===
            // Tier 1
            'basic_suit+vitae': 'photosynthesis_plating',
            'basic_suit+ignis': 'heat_shell',
            'basic_suit+umbra': 'shadow_cloak',
            // Tier 2
            'thermal_suit+vitae': 'regen_suit',
            'thermal_suit+ignis': 'thermal_vent_rig',
            'thermal_suit+umbra': 'void_suit',
            // Tier 3
            'phase_suit+vitae': 'living_armor',
            'phase_suit+ignis': 'magma_skin',
            'phase_suit+umbra': 'phase_shift_armor',

            // === BACKPACKS ===
            // Tier 1
            'basic_pack+vitae': 'gulper_sack',
            'basic_pack+ignis': 'heat_pack',
            'basic_pack+umbra': 'turret_mount',
            // Tier 2
            'refinery_pack+vitae': 'garden_pack',
            'refinery_pack+ignis': 'mobile_refinery',
            'refinery_pack+umbra': 'void_pack',

            // === UTILITIES ===
            // Tier 1
            'grapple_frame+vitae': 'vine_grapple',
            'grapple_frame+ignis': 'flame_jets',
            'grapple_frame+umbra': 'stasis_field',
            // Tier 2
            'scanner_frame+vitae': 'root_sense',
            'scanner_frame+ignis': 'ore_scanner',
            'scanner_frame+umbra': 'void_sight',
        };
    }

    /**
     * Attempt to craft an item
     * @param {Object} player - Player with inventory
     * @param {string} chassisId - ID of chassis to use
     * @param {string} strainType - 'vitae', 'ignis', or 'umbra'
     * @param {string} catalystRarity - Rarity of catalyst (optional, affects stats)
     * @returns {Object|null} Crafted tool or null if failed
     */
    craft(player, chassisId, strainType, catalystRarity = null) {
        const chassis = CHASSIS_TYPES[chassisId.toUpperCase()];
        if (!chassis) {
            return { success: false, error: 'Invalid chassis' };
        }

        // Check chassis cost
        if (!this.hasResources(player, chassis.cost)) {
            return { success: false, error: 'Missing chassis materials' };
        }

        // Check strain cost (sap/plasma/ichor)
        const strainCost = this.getStrainCost(strainType, chassis.tier);
        if (!this.hasResources(player, strainCost)) {
            return { success: false, error: 'Missing strain materials' };
        }

        // Find recipe result
        const recipeKey = `${chassis.id}+${strainType}`;
        const resultId = this.recipes[recipeKey];

        if (!resultId) {
            return { success: false, error: 'Invalid combination' };
        }

        // Get the tool template
        const toolTemplate = LIVING_TOOLS[resultId.toUpperCase()];
        if (!toolTemplate) {
            return { success: false, error: 'Tool not found' };
        }

        // Consume resources
        this.consumeResources(player, chassis.cost);
        this.consumeResources(player, strainCost);

        // Create tool instance
        const tool = this.createToolInstance(toolTemplate, catalystRarity);

        // Add to player's crafted tools inventory
        player.addCraftedTool(tool);

        return { success: true, tool };
    }

    /**
     * Get strain cost based on type and tier
     * Tier 1: uses small/trace sap (from capillaries, easier to get)
     * Tier 2: uses regular sap (from roots)
     * Tier 3: uses pure sap (from cores)
     */
    getStrainCost(strainType, tier) {
        // Tier 1 uses small amounts of easier materials
        // Tier 2 uses regular sap
        // Tier 3 uses pure/concentrated sap
        const tierMaterials = {
            vitae: {
                1: { vitae_sap_small: 8 },   // From capillaries (hardness 2)
                2: { vitae_sap: 10 },         // From roots (hardness 3)
                3: { vitae_sap_pure: 5 },     // From cores (hardness 5)
            },
            ignis: {
                1: { ignis_plasma_small: 8 }, // From capillaries (hardness 3)
                2: { ignis_plasma: 10 },      // From roots (hardness 4)
                3: { ignis_plasma_pure: 5 },  // From cores (hardness 6)
            },
            umbra: {
                1: { umbra_ichor_small: 8 },  // From capillaries (hardness 4)
                2: { umbra_ichor: 10 },       // From roots (hardness 5)
                3: { umbra_ichor_pure: 5 },   // From cores (hardness 7)
            },
        };

        return tierMaterials[strainType]?.[tier] || {};
    }

    /**
     * Check if player has required resources
     */
    hasResources(player, cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if ((player.inventory[resource] || 0) < amount) {
                return false;
            }
        }
        return true;
    }

    /**
     * Consume resources from player inventory
     */
    consumeResources(player, cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            player.inventory[resource] = (player.inventory[resource] || 0) - amount;
        }
    }

    /**
     * Add resources to player inventory
     */
    addResources(player, items) {
        for (const [resource, amount] of Object.entries(items)) {
            if (!player.inventory.hasOwnProperty(resource)) {
                player.inventory[resource] = 0;
            }
            player.inventory[resource] += amount;
        }
    }

    /**
     * Craft a material recipe
     * @param {Object} player - Player with inventory
     * @param {string} recipeId - ID of the recipe to craft
     * @param {number} count - Number of times to craft (default 1)
     * @returns {Object} Result with success status
     */
    craftMaterial(player, recipeId, count = 1) {
        const recipe = this.materialRecipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: 'Recipe not found' };
        }

        // Calculate total inputs needed
        const totalInputs = {};
        for (const [item, amount] of Object.entries(recipe.inputs)) {
            totalInputs[item] = amount * count;
        }

        // Check if player has resources
        if (!this.hasResources(player, totalInputs)) {
            return { success: false, error: 'Missing materials' };
        }

        // Consume inputs and give outputs
        this.consumeResources(player, totalInputs);

        const totalOutputs = {};
        for (const [item, amount] of Object.entries(recipe.outputs)) {
            totalOutputs[item] = amount * count;
        }
        this.addResources(player, totalOutputs);

        return {
            success: true,
            recipe: recipe,
            crafted: totalOutputs,
        };
    }

    /**
     * Check if player can craft a material recipe
     */
    canCraftMaterial(player, recipeId, count = 1) {
        const recipe = this.materialRecipes.find(r => r.id === recipeId);
        if (!recipe) return false;

        const totalInputs = {};
        for (const [item, amount] of Object.entries(recipe.inputs)) {
            totalInputs[item] = amount * count;
        }

        return this.hasResources(player, totalInputs);
    }

    /**
     * Get all material recipes, optionally filtered by category
     */
    getMaterialRecipes(category = null) {
        if (category) {
            return this.materialRecipes.filter(r => r.category === category);
        }
        return this.materialRecipes;
    }

    /**
     * Get available material recipes the player can craft
     */
    getAvailableMaterialRecipes(player) {
        return this.materialRecipes.map(recipe => ({
            ...recipe,
            canCraft: this.canCraftMaterial(player, recipe.id),
            maxCraftable: this.getMaxCraftable(player, recipe),
        }));
    }

    /**
     * Calculate maximum number of times a recipe can be crafted
     */
    getMaxCraftable(player, recipe) {
        let maxCraft = Infinity;
        for (const [item, amount] of Object.entries(recipe.inputs)) {
            const available = player.inventory[item] || 0;
            const possible = Math.floor(available / amount);
            maxCraft = Math.min(maxCraft, possible);
        }
        return maxCraft === Infinity ? 0 : maxCraft;
    }

    /**
     * Create a tool instance from template
     */
    createToolInstance(template, catalystRarity = null) {
        const tool = { ...template };
        tool.instanceId = Date.now() + Math.random();
        tool.xp = 0;
        tool.level = 1;
        tool.mutations = [];
        tool.biomass = 0;

        // Apply catalyst bonus
        if (catalystRarity) {
            const catalyst = this.catalysts[catalystRarity];
            if (catalyst) {
                tool.power = Math.floor((tool.power || 1) * catalyst.multiplier);
                tool.rarity = catalystRarity;
            }
        }

        return tool;
    }

    /**
     * Feed biomass to a tool to level it up
     * @param {Object} tool - Tool to feed
     * @param {number} biomass - Amount of biomass to feed
     * @returns {Object} Result with level changes
     */
    feedTool(tool, biomass) {
        if (!tool || biomass <= 0) return { leveled: false };

        tool.biomass = (tool.biomass || 0) + biomass;

        // XP required per level (exponential curve)
        const xpPerLevel = (level) => 100 * Math.pow(1.5, level - 1);

        let leveled = false;
        const mutations = [];

        while (tool.level < (tool.maxLevel || 20)) {
            const required = xpPerLevel(tool.level);
            if (tool.biomass >= required) {
                tool.biomass -= required;
                tool.level++;
                leveled = true;

                // Check for mutation opportunities
                if (tool.level === 5 || tool.level === 10 || tool.level === 20) {
                    mutations.push(this.getMutationChoices(tool.level));
                }
            } else {
                break;
            }
        }

        return {
            leveled,
            newLevel: tool.level,
            mutations,
            biomassRemaining: tool.biomass,
        };
    }

    /**
     * Get mutation choices for a level
     */
    getMutationChoices(level) {
        const mutations = Object.values(MUTATIONS).filter(m => m.level === level);
        // Return 2 random choices
        const shuffled = mutations.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }

    /**
     * Apply a mutation to a tool
     */
    applyMutation(tool, mutationId) {
        const mutation = MUTATIONS[mutationId.toUpperCase()];
        if (!mutation) return false;

        if (!tool.mutations) tool.mutations = [];

        // Check if already has mutation at this level
        const existingAtLevel = tool.mutations.find(m => MUTATIONS[m.toUpperCase()]?.level === mutation.level);
        if (existingAtLevel) return false;

        tool.mutations.push(mutationId);

        // Apply mutation effect
        switch (mutation.effect) {
            case 'hardRockBonus':
                tool.hardRockBonus = (tool.hardRockBonus || 0) + mutation.value;
                break;
            case 'dropRate':
                tool.dropRateBonus = (tool.dropRateBonus || 0) + mutation.value;
                break;
            case 'speedRamp':
                tool.speedRamp = mutation.value;
                break;
            case 'poisonDamage':
                tool.poisonDamage = mutation.value;
                break;
            case 'drillSize':
                tool.drillSize = mutation.value;
                break;
            case 'spawnBeetles':
                tool.beetleCount = mutation.value;
                break;
        }

        return true;
    }

    /**
     * Calculate set bonus for equipped items
     */
    calculateSetBonus(equippedTools) {
        const broodCounts = { vitae: 0, ignis: 0, umbra: 0 };

        // Count items per brood
        for (const tool of Object.values(equippedTools)) {
            if (tool && tool.brood) {
                broodCounts[tool.brood]++;
            }
        }

        // Find active bonuses
        const activeBonuses = [];

        for (const [broodId, count] of Object.entries(broodCounts)) {
            if (count >= 2) {
                const set = EQUIPMENT_SETS[broodId.toUpperCase()];
                if (set) {
                    if (count >= 2 && set.bonuses[2]) {
                        activeBonuses.push(set.bonuses[2]);
                    }
                    if (count >= 3 && set.bonuses[3]) {
                        activeBonuses.push(set.bonuses[3]);
                    }
                }
            }
        }

        return activeBonuses;
    }

    /**
     * Check if player can craft a specific item
     */
    canCraft(player, chassisId, strainType) {
        const chassis = CHASSIS_TYPES[chassisId.toUpperCase()];
        if (!chassis) return false;

        if (!this.hasResources(player, chassis.cost)) return false;

        const strainCost = this.getStrainCost(strainType, chassis.tier);
        if (!this.hasResources(player, strainCost)) return false;

        const recipeKey = `${chassis.id}+${strainType}`;
        return !!this.recipes[recipeKey];
    }

    /**
     * Get all available recipes for display
     */
    getAvailableRecipes(player) {
        const available = [];

        for (const [recipeKey, resultId] of Object.entries(this.recipes)) {
            const [chassisId, strainType] = recipeKey.split('+');
            const chassis = Object.values(CHASSIS_TYPES).find(c => c.id === chassisId);
            const tool = LIVING_TOOLS[resultId.toUpperCase()];

            if (chassis && tool) {
                const strainCost = this.getStrainCost(strainType, chassis.tier);
                const canCraft = this.hasResources(player, chassis.cost) &&
                               this.hasResources(player, strainCost);

                available.push({
                    recipeKey,
                    chassis,
                    strainType,
                    result: tool,
                    canCraft,
                    chassisCost: chassis.cost,
                    strainCost,
                });
            }
        }

        return available;
    }

    /**
     * Collect an artifact
     */
    collectArtifact(player, artifactId) {
        const artifact = ARTIFACTS[artifactId.toUpperCase()];
        if (!artifact || artifact.found) return false;

        artifact.found = true;

        if (!player.artifacts) player.artifacts = [];
        player.artifacts.push(artifactId);

        // Apply artifact effect
        this.applyArtifactEffect(player, artifact);

        return artifact;
    }

    /**
     * Apply artifact effects to player
     */
    applyArtifactEffect(player, artifact) {
        switch (artifact.effect) {
            case 'revealRadius':
                player.permanentRevealRadius = (player.permanentRevealRadius || 0) + artifact.value;
                break;
            case 'maxHealthBonus':
                player.maxHealth = player.maxHealth * (1 + artifact.value);
                player.health = Math.min(player.health, player.maxHealth);
                break;
            case 'machineSpeed':
                player.machineSpeedMultiplier = (player.machineSpeedMultiplier || 1) * artifact.value;
                break;
            case 'oxygenEfficiency':
                player.oxygenEfficiency = (player.oxygenEfficiency || 1) * (1 - artifact.value);
                break;
            case 'heatResistance':
                player.heatResistance = (player.heatResistance || 0) + artifact.value;
                break;
        }
    }
}

export default CraftingSystem;
