/**
 * Lab System
 * Handles DNA incubation, tool growth, and creature companions
 *
 * Instead of buying upgrades, you GROW them using Wyrm Sap and DNA samples.
 */

/**
 * DNA Types - collected from different dragon root varieties
 */
export const DNA_TYPES = {
    // Common (found in shallow depths)
    WYRM_BASIC: {
        id: 'wyrm_basic',
        name: 'Common Wyrm DNA',
        rarity: 'common',
        color: '#00aa77',
        description: 'Basic genetic material from surface capillaries.',
    },

    // Uncommon (found in medium depths)
    WYRM_MAGMA: {
        id: 'wyrm_magma',
        name: 'Magma Wyrm DNA',
        rarity: 'uncommon',
        color: '#ff6644',
        description: 'Heat-resistant genetic material from thermal vents.',
    },
    WYRM_CRYSTAL: {
        id: 'wyrm_crystal',
        name: 'Crystal Wyrm DNA',
        rarity: 'uncommon',
        color: '#44aaff',
        description: 'Crystalline DNA structure that enhances perception.',
    },

    // Rare (found in deep areas)
    WYRM_VOID: {
        id: 'wyrm_void',
        name: 'Void Wyrm DNA',
        rarity: 'rare',
        color: '#aa44ff',
        description: 'Mysterious DNA that bends space itself.',
    },
    WYRM_ANCIENT: {
        id: 'wyrm_ancient',
        name: 'Ancient Dragon DNA',
        rarity: 'rare',
        color: '#ffaa00',
        description: 'Primordial genetic material from the dragon cores.',
    },

    // Legendary (extremely rare)
    WYRM_CELESTIAL: {
        id: 'wyrm_celestial',
        name: 'Celestial Dragon DNA',
        rarity: 'legendary',
        color: '#ffffff',
        description: 'Pure essence from the original sky dragons.',
    },
};

/**
 * Growable Tool Types
 */
export const GROWABLE_TOOLS = {
    // Drills
    LIVING_DRILL: {
        id: 'living_drill',
        name: 'Living Drill',
        type: 'drill',
        dnaRequired: ['wyrm_basic'],
        sapCost: 50,
        growthTime: 30000, // 30 seconds
        stats: {
            power: 2,
            speed: 1.2,
        },
        description: 'A biological drill that regenerates its teeth.',
    },
    MAGMA_BORE: {
        id: 'magma_bore',
        name: 'Magma Bore',
        type: 'drill',
        dnaRequired: ['wyrm_basic', 'wyrm_magma'],
        sapCost: 150,
        growthTime: 60000,
        stats: {
            power: 4,
            speed: 1.0,
            meltStone: true,
        },
        description: 'A superheated drill that melts through stone.',
    },
    VOID_EXCAVATOR: {
        id: 'void_excavator',
        name: 'Void Excavator',
        type: 'drill',
        dnaRequired: ['wyrm_basic', 'wyrm_void'],
        sapCost: 500,
        growthTime: 120000,
        stats: {
            power: 3,
            speed: 2.0,
            teleportDebris: true,
        },
        description: 'Teleports mined material directly to storage.',
    },

    // Light sources
    BIOLUM_MOSS: {
        id: 'biolum_moss',
        name: 'Bioluminescent Moss',
        type: 'light',
        dnaRequired: ['wyrm_basic'],
        sapCost: 25,
        growthTime: 15000,
        stats: {
            lightRadius: 100,
        },
        description: 'Grows on your helmet, providing gentle illumination.',
    },
    CRYSTAL_LANTERN: {
        id: 'crystal_lantern',
        name: 'Crystal Lantern',
        type: 'light',
        dnaRequired: ['wyrm_crystal'],
        sapCost: 100,
        growthTime: 45000,
        stats: {
            lightRadius: 200,
            revealHidden: true,
        },
        description: 'A crystalline growth that reveals hidden veins.',
    },

    // Sonar upgrades
    ECHO_ORGAN: {
        id: 'echo_organ',
        name: 'Echo Organ',
        type: 'sonar',
        dnaRequired: ['wyrm_basic', 'wyrm_crystal'],
        sapCost: 200,
        growthTime: 90000,
        stats: {
            range: 75,
            cooldown: 2000,
        },
        description: 'A biological sonar with extended range.',
    },

    // Movement
    GRIP_TENDRILS: {
        id: 'grip_tendrils',
        name: 'Grip Tendrils',
        type: 'movement',
        dnaRequired: ['wyrm_basic'],
        sapCost: 75,
        growthTime: 45000,
        stats: {
            wallClimb: true,
        },
        description: 'Allows climbing on walls and ceilings.',
    },
};

/**
 * Companion Creatures
 */
export const COMPANIONS = {
    MINING_WYRM: {
        id: 'mining_wyrm',
        name: 'Mining Wyrm',
        dnaRequired: ['wyrm_basic', 'wyrm_basic'],
        sapCost: 100,
        growthTime: 60000,
        abilities: ['auto_mine', 'carry_resources'],
        description: 'A small wyrm that helps mine soft materials.',
    },
    GLOW_SPRITE: {
        id: 'glow_sprite',
        name: 'Glow Sprite',
        dnaRequired: ['wyrm_crystal'],
        sapCost: 50,
        growthTime: 30000,
        abilities: ['light', 'reveal_veins'],
        description: 'A floating companion that illuminates the darkness.',
    },
    DEFENDER_POLYP: {
        id: 'defender_polyp',
        name: 'Defender Polyp',
        dnaRequired: ['wyrm_magma', 'wyrm_basic'],
        sapCost: 200,
        growthTime: 90000,
        abilities: ['attack', 'defend_pipes'],
        description: 'Protects your pipelines from immune responses.',
    },
};

/**
 * Incubation Pod - where things grow
 */
class IncubationPod {
    constructor(id) {
        this.id = id;
        this.item = null;       // What's growing
        this.progress = 0;       // 0 to 1
        this.startTime = 0;
        this.totalTime = 0;
        this.complete = false;
    }

    /**
     * Start incubating an item
     */
    startIncubation(item, currentTime) {
        this.item = item;
        this.startTime = currentTime;
        this.totalTime = item.growthTime;
        this.progress = 0;
        this.complete = false;
    }

    /**
     * Update incubation progress
     */
    update(currentTime) {
        if (!this.item || this.complete) return;

        const elapsed = currentTime - this.startTime;
        this.progress = Math.min(1, elapsed / this.totalTime);

        if (this.progress >= 1) {
            this.complete = true;
        }
    }

    /**
     * Harvest the completed item
     */
    harvest() {
        if (!this.complete || !this.item) return null;

        const harvested = this.item;
        this.item = null;
        this.progress = 0;
        this.complete = false;

        return harvested;
    }

    /**
     * Cancel incubation (partial refund)
     */
    cancel() {
        const refund = this.item ? Math.floor(this.item.sapCost * (1 - this.progress) * 0.5) : 0;
        this.item = null;
        this.progress = 0;
        this.complete = false;

        return refund;
    }
}

/**
 * Main Lab System
 */
export class LabSystem {
    constructor() {
        // DNA collection
        this.dnaInventory = new Map();

        // Incubation pods (start with 2)
        this.pods = [
            new IncubationPod(0),
            new IncubationPod(1),
        ];

        // Grown tools/equipment
        this.grownEquipment = new Map();

        // Active companions
        this.companions = [];

        // Unlock progress
        this.unlockedRecipes = new Set(['living_drill', 'biolum_moss']);

        // Lab level (affects pod count and growth speed)
        this.level = 1;
    }

    /**
     * Add DNA to inventory
     */
    addDNA(dnaType, amount = 1) {
        const current = this.dnaInventory.get(dnaType.id) || 0;
        this.dnaInventory.set(dnaType.id, current + amount);

        // Check for recipe unlocks
        this.checkUnlocks();
    }

    /**
     * Get DNA count
     */
    getDNACount(dnaId) {
        return this.dnaInventory.get(dnaId) || 0;
    }

    /**
     * Check if player has required DNA for a recipe
     */
    hasRequiredDNA(recipe) {
        const required = new Map();

        for (const dnaId of recipe.dnaRequired) {
            const count = required.get(dnaId) || 0;
            required.set(dnaId, count + 1);
        }

        for (const [dnaId, count] of required) {
            if (this.getDNACount(dnaId) < count) return false;
        }

        return true;
    }

    /**
     * Consume DNA for a recipe
     */
    consumeDNA(recipe) {
        const required = new Map();

        for (const dnaId of recipe.dnaRequired) {
            const count = required.get(dnaId) || 0;
            required.set(dnaId, count + 1);
        }

        for (const [dnaId, count] of required) {
            const current = this.dnaInventory.get(dnaId) || 0;
            this.dnaInventory.set(dnaId, current - count);
        }
    }

    /**
     * Start growing an item
     */
    startGrowth(recipeId, podIndex, sapAvailable, currentTime) {
        const pod = this.pods[podIndex];
        if (!pod || pod.item) return { success: false, error: 'Pod occupied' };

        // Find recipe
        const recipe = GROWABLE_TOOLS[recipeId.toUpperCase()] ||
                      COMPANIONS[recipeId.toUpperCase()];

        if (!recipe) return { success: false, error: 'Unknown recipe' };
        if (!this.unlockedRecipes.has(recipeId)) return { success: false, error: 'Recipe locked' };
        if (!this.hasRequiredDNA(recipe)) return { success: false, error: 'Missing DNA' };
        if (sapAvailable < recipe.sapCost) return { success: false, error: 'Not enough sap' };

        // Consume resources
        this.consumeDNA(recipe);
        pod.startIncubation(recipe, currentTime);

        return { success: true, sapCost: recipe.sapCost };
    }

    /**
     * Update all incubation pods
     */
    update(currentTime) {
        for (const pod of this.pods) {
            pod.update(currentTime);
        }
    }

    /**
     * Harvest from a pod
     */
    harvest(podIndex) {
        const pod = this.pods[podIndex];
        if (!pod) return null;

        const item = pod.harvest();
        if (!item) return null;

        // Add to appropriate collection
        if (item.abilities) {
            // It's a companion
            this.companions.push({
                type: item,
                health: 100,
                active: true,
            });
        } else {
            // It's equipment
            this.grownEquipment.set(item.id, item);
        }

        return item;
    }

    /**
     * Check for new recipe unlocks based on DNA collection
     */
    checkUnlocks() {
        // Unlock recipes based on DNA types discovered
        if (this.getDNACount('wyrm_magma') > 0) {
            this.unlockedRecipes.add('magma_bore');
        }
        if (this.getDNACount('wyrm_crystal') > 0) {
            this.unlockedRecipes.add('crystal_lantern');
            this.unlockedRecipes.add('glow_sprite');
        }
        if (this.getDNACount('wyrm_void') > 0) {
            this.unlockedRecipes.add('void_excavator');
        }
        if (this.getDNACount('wyrm_basic') >= 2) {
            this.unlockedRecipes.add('mining_wyrm');
            this.unlockedRecipes.add('grip_tendrils');
        }
        if (this.getDNACount('wyrm_crystal') > 0 && this.getDNACount('wyrm_basic') > 0) {
            this.unlockedRecipes.add('echo_organ');
        }
        if (this.getDNACount('wyrm_magma') > 0 && this.getDNACount('wyrm_basic') > 0) {
            this.unlockedRecipes.add('defender_polyp');
        }
    }

    /**
     * Upgrade lab (more pods, faster growth)
     */
    upgradeLab(sapCost) {
        this.level++;

        // Add new pod every 2 levels
        if (this.level % 2 === 0) {
            this.pods.push(new IncubationPod(this.pods.length));
        }

        return true;
    }

    /**
     * Get growth speed multiplier
     */
    getGrowthSpeedMultiplier() {
        return 1 + (this.level - 1) * 0.1; // 10% faster per level
    }

    /**
     * Get lab status
     */
    getStatus() {
        return {
            level: this.level,
            podCount: this.pods.length,
            activePods: this.pods.filter(p => p.item && !p.complete).length,
            completedPods: this.pods.filter(p => p.complete).length,
            dnaTypes: this.dnaInventory.size,
            equipmentCount: this.grownEquipment.size,
            companionCount: this.companions.length,
            unlockedRecipes: this.unlockedRecipes.size,
        };
    }

    /**
     * Get available recipes
     */
    getAvailableRecipes() {
        const recipes = [];

        for (const id of this.unlockedRecipes) {
            const tool = GROWABLE_TOOLS[id.toUpperCase()];
            const companion = COMPANIONS[id.toUpperCase()];
            const recipe = tool || companion;

            if (recipe) {
                recipes.push({
                    ...recipe,
                    canGrow: this.hasRequiredDNA(recipe),
                    isCompanion: !!companion,
                });
            }
        }

        return recipes;
    }
}

export default LabSystem;
