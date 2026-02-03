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

        // Catalyst rarities
        this.catalysts = {
            common: { multiplier: 1, dropChance: 0.3 },
            uncommon: { multiplier: 1.5, dropChance: 0.15 },
            rare: { multiplier: 2, dropChance: 0.05 },
            legendary: { multiplier: 3, dropChance: 0.01 },
        };
    }

    /**
     * Initialize crafting recipes
     */
    initializeRecipes() {
        return {
            // Excavators
            'basic_drill+vitae': 'vorpal_claw',
            'basic_drill+ignis': 'magma_worm',
            'basic_drill+umbra': 'void_borer',
            'titanium_drill+vitae': 'spore_drill',
            'titanium_drill+ignis': 'inferno_jet',
            'titanium_drill+umbra': 'singularity_pick',

            // Suits
            'basic_suit+vitae': 'photosynthesis_plating',
            'thermal_suit+ignis': 'thermal_vent_rig',
            'phase_suit+umbra': 'phase_shift_armor',

            // Backpacks
            'basic_pack+vitae': 'gulper_sack',
            'refinery_pack+ignis': 'mobile_refinery',
            'basic_pack+umbra': 'turret_mount',

            // Utilities
            'grapple_frame+vitae': 'vine_grapple',
            'scanner_frame+ignis': 'ore_scanner',
            'grapple_frame+umbra': 'stasis_field',

            // Symbiotes (require specific catalyst)
            'catalyst+vitae': 'loot_beetle',
            'catalyst+ignis': 'flame_wisp',
            'catalyst+umbra': 'shadow_orb',
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
     */
    getStrainCost(strainType, tier) {
        const amounts = { 1: 5, 2: 10, 3: 20 };
        const amount = amounts[tier] || 5;

        switch (strainType) {
            case 'vitae':
                return { vitae_sap: amount };
            case 'ignis':
                return { ignis_plasma: amount };
            case 'umbra':
                return { umbra_ichor: amount };
            default:
                return {};
        }
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
