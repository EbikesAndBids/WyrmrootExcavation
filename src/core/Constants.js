/**
 * Game Constants and Configuration
 * Wyrmroot: Deep Excavation
 */

export const TILE_SIZE = 16;
export const CHUNK_SIZE = 32;

// Canvas settings
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// World generation
export const WORLD_WIDTH_CHUNKS = 8;
export const WORLD_HEIGHT_CHUNKS = 48; // Deeper world for 3 biomes
export const WORLD_WIDTH = WORLD_WIDTH_CHUNKS * CHUNK_SIZE;
export const WORLD_HEIGHT = WORLD_HEIGHT_CHUNKS * CHUNK_SIZE;
export const SURFACE_LEVEL = 20; // More sky space above ground
export const MINE_ENTRANCE_DEPTH = 30; // How deep the pre-dug mine shaft goes

// Tile types - organized by category
export const TILE_TYPES = {
    // Basic
    AIR: 0,
    SKY: 101, // Blue sky background

    // Surface tiles
    GRASS: 102,
    SURFACE_DIRT: 103,
    MINE_SUPPORT: 104, // Wooden beams
    MINE_LADDER: 105,
    SURFACE_STONE: 106,

    // Terrain - Layer 1: Verdant Crust
    DIRT: 1,
    STONE: 2,
    PETRIFIED_WOOD: 3,
    AMBER: 4,
    GRAVEL: 5, // Falls when unsupported

    // Terrain - Layer 2: Magma Ribs
    VOLCANIC_ROCK: 10,
    BASALT: 11,
    OBSIDIAN: 12,
    ASH: 13, // Falls

    // Terrain - Layer 3: Abyssal Deep
    VOID_STONE: 20,
    CRYSTAL: 21,
    FLOATING_ROCK: 22, // Defies gravity
    SHADOW_GLASS: 23,

    // Fluids
    WATER: 30,
    LAVA: 31,
    ACID: 32,
    UMBRA_OOZE: 33,

    // Gases
    GAS_POCKET: 40,
    TOXIC_SPORE: 41,
    STEAM: 42,

    // Dragon Roots - Layer 1: Vitae
    VITAE_CAPILLARY: 50,
    VITAE_ROOT: 51,
    VITAE_CORE: 52,

    // Dragon Roots - Layer 2: Ignis
    IGNIS_CAPILLARY: 60,
    IGNIS_ROOT: 61,
    IGNIS_CORE: 62,

    // Dragon Roots - Layer 3: Umbra
    UMBRA_CAPILLARY: 70,
    UMBRA_ROOT: 71,
    UMBRA_CORE: 72,

    // Fossils
    FOSSIL_BONE: 80,
    FOSSIL_CLAW: 81,
    FOSSIL_TOOTH: 82,
    FOSSIL_SKULL: 83,
    FOSSIL_RIBCAGE: 84,

    // Structures/Machines
    PIPE: 90,
    EXTRACTOR: 91,
    PUMP: 92,
    TURRET: 93,
    OXYGEN_STATION: 94,

    // Building materials (craftable)
    WOOD_PLANK: 110,
    LADDER: 111,
    PLATFORM: 112,
    TORCH: 113,
    STORAGE_CRATE: 114,
    REINFORCED_STONE: 115,
    GLASS_PANE: 116,

    // Bedrock
    BEDROCK: 100,
};

// Tile properties
export const TILE_PROPERTIES = {
    [TILE_TYPES.AIR]: { solid: false, hardness: 0, drops: null },
    [TILE_TYPES.SKY]: { solid: false, hardness: 0, drops: null, sky: true },

    // Surface tiles
    [TILE_TYPES.GRASS]: { solid: true, hardness: 1, drops: 'dirt', surface: true },
    [TILE_TYPES.SURFACE_DIRT]: { solid: true, hardness: 1, drops: 'dirt', surface: true },
    [TILE_TYPES.SURFACE_STONE]: { solid: true, hardness: 2, drops: 'stone', surface: true },
    [TILE_TYPES.MINE_SUPPORT]: { solid: true, hardness: 1, drops: null, climbable: true },
    [TILE_TYPES.MINE_LADDER]: { solid: false, hardness: 1, drops: null, climbable: true },

    // Layer 1 terrain
    [TILE_TYPES.DIRT]: { solid: true, hardness: 1, drops: 'dirt', layer: 1 },
    [TILE_TYPES.STONE]: { solid: true, hardness: 2, drops: 'stone', layer: 1 },
    [TILE_TYPES.PETRIFIED_WOOD]: { solid: true, hardness: 2, drops: 'petrified_wood', layer: 1 },
    [TILE_TYPES.AMBER]: { solid: true, hardness: 3, drops: 'amber', glows: true, glowColor: 'rgba(255, 200, 100, 0.3)', layer: 1 },
    [TILE_TYPES.GRAVEL]: { solid: true, hardness: 1, drops: 'gravel', falls: true, layer: 1 },

    // Layer 2 terrain
    [TILE_TYPES.VOLCANIC_ROCK]: { solid: true, hardness: 3, drops: 'volcanic_rock', hot: true, layer: 2 },
    [TILE_TYPES.BASALT]: { solid: true, hardness: 4, drops: 'basalt', layer: 2 },
    [TILE_TYPES.OBSIDIAN]: { solid: true, hardness: 6, drops: 'obsidian', layer: 2 },
    [TILE_TYPES.ASH]: { solid: true, hardness: 1, drops: 'ash', falls: true, hot: true, layer: 2 },

    // Layer 3 terrain
    [TILE_TYPES.VOID_STONE]: { solid: true, hardness: 5, drops: 'void_stone', layer: 3 },
    [TILE_TYPES.CRYSTAL]: { solid: true, hardness: 4, drops: 'crystal', glows: true, glowColor: 'rgba(150, 100, 255, 0.4)', layer: 3 },
    [TILE_TYPES.FLOATING_ROCK]: { solid: true, hardness: 3, drops: 'floating_rock', floats: true, layer: 3 },
    [TILE_TYPES.SHADOW_GLASS]: { solid: true, hardness: 2, drops: 'shadow_glass', layer: 3 },

    // Fluids
    [TILE_TYPES.WATER]: { solid: false, hardness: 0, fluid: true, density: 1, damage: 0 },
    [TILE_TYPES.LAVA]: { solid: false, hardness: 0, fluid: true, density: 2, damage: 10, hot: true, glows: true, glowColor: 'rgba(255, 100, 0, 0.5)' },
    [TILE_TYPES.ACID]: { solid: false, hardness: 0, fluid: true, density: 1, damage: 5, glows: true, glowColor: 'rgba(100, 255, 0, 0.3)' },
    [TILE_TYPES.UMBRA_OOZE]: { solid: false, hardness: 0, fluid: true, density: 3, damage: 3, glows: true, glowColor: 'rgba(100, 0, 150, 0.4)' },

    // Gases
    [TILE_TYPES.GAS_POCKET]: { solid: false, hardness: 0, gas: true, explosive: true },
    [TILE_TYPES.TOXIC_SPORE]: { solid: false, hardness: 0, gas: true, damage: 2, rises: true },
    [TILE_TYPES.STEAM]: { solid: false, hardness: 0, gas: true, rises: true, hot: true },

    // Vitae Roots
    [TILE_TYPES.VITAE_CAPILLARY]: { solid: true, hardness: 2, drops: 'vitae_sap_small', glows: true, glowColor: 'rgba(0, 255, 170, 0.3)', rootType: 'vitae' },
    [TILE_TYPES.VITAE_ROOT]: { solid: true, hardness: 3, drops: 'vitae_sap', glows: true, glowColor: 'rgba(0, 255, 170, 0.5)', rootType: 'vitae', extractable: true },
    [TILE_TYPES.VITAE_CORE]: { solid: true, hardness: 5, drops: 'vitae_sap_pure', glows: true, glowColor: 'rgba(0, 255, 200, 0.7)', rootType: 'vitae', extractable: true },

    // Ignis Roots
    [TILE_TYPES.IGNIS_CAPILLARY]: { solid: true, hardness: 3, drops: 'ignis_plasma_small', glows: true, glowColor: 'rgba(255, 100, 0, 0.3)', rootType: 'ignis', hot: true },
    [TILE_TYPES.IGNIS_ROOT]: { solid: true, hardness: 4, drops: 'ignis_plasma', glows: true, glowColor: 'rgba(255, 150, 0, 0.5)', rootType: 'ignis', extractable: true, hot: true },
    [TILE_TYPES.IGNIS_CORE]: { solid: true, hardness: 6, drops: 'ignis_plasma_pure', glows: true, glowColor: 'rgba(255, 200, 50, 0.7)', rootType: 'ignis', extractable: true, hot: true },

    // Umbra Roots
    [TILE_TYPES.UMBRA_CAPILLARY]: { solid: true, hardness: 4, drops: 'umbra_ichor_small', glows: true, glowColor: 'rgba(100, 0, 150, 0.3)', rootType: 'umbra' },
    [TILE_TYPES.UMBRA_ROOT]: { solid: true, hardness: 5, drops: 'umbra_ichor', glows: true, glowColor: 'rgba(150, 0, 200, 0.5)', rootType: 'umbra', extractable: true },
    [TILE_TYPES.UMBRA_CORE]: { solid: true, hardness: 7, drops: 'umbra_ichor_pure', glows: true, glowColor: 'rgba(200, 50, 255, 0.7)', rootType: 'umbra', extractable: true },

    // Fossils
    [TILE_TYPES.FOSSIL_BONE]: { solid: true, hardness: 3, drops: 'dragon_bone' },
    [TILE_TYPES.FOSSIL_CLAW]: { solid: true, hardness: 4, drops: 'dragon_claw' },
    [TILE_TYPES.FOSSIL_TOOTH]: { solid: true, hardness: 4, drops: 'dragon_tooth' },
    [TILE_TYPES.FOSSIL_SKULL]: { solid: true, hardness: 5, drops: 'dragon_skull' },
    [TILE_TYPES.FOSSIL_RIBCAGE]: { solid: true, hardness: 5, drops: 'dragon_ribcage' },

    // Structures
    [TILE_TYPES.PIPE]: { solid: false, hardness: 1, drops: 'pipe', placeable: true },
    [TILE_TYPES.EXTRACTOR]: { solid: true, hardness: 2, drops: 'extractor', placeable: true },
    [TILE_TYPES.PUMP]: { solid: true, hardness: 2, drops: 'pump', placeable: true },
    [TILE_TYPES.TURRET]: { solid: true, hardness: 2, drops: 'turret', placeable: true },
    [TILE_TYPES.OXYGEN_STATION]: { solid: true, hardness: 2, drops: 'oxygen_station', placeable: true },

    // Building materials (craftable)
    [TILE_TYPES.WOOD_PLANK]: { solid: true, hardness: 1, drops: 'wood_plank', placeable: true },
    [TILE_TYPES.LADDER]: { solid: false, hardness: 1, drops: 'ladder', placeable: true, climbable: true },
    [TILE_TYPES.PLATFORM]: { solid: false, hardness: 1, drops: 'platform', placeable: true, platform: true },
    [TILE_TYPES.TORCH]: { solid: false, hardness: 1, drops: 'torch', placeable: true, glows: true, glowColor: 'rgba(255, 200, 100, 0.5)', glowRadius: 6 },
    [TILE_TYPES.STORAGE_CRATE]: { solid: true, hardness: 2, drops: 'storage_crate', placeable: true, storage: true, storageSlots: 20 },
    [TILE_TYPES.REINFORCED_STONE]: { solid: true, hardness: 4, drops: 'reinforced_stone', placeable: true },
    [TILE_TYPES.GLASS_PANE]: { solid: true, hardness: 1, drops: 'glass_pane', placeable: true, transparent: true },

    [TILE_TYPES.BEDROCK]: { solid: true, hardness: -1, drops: null },
};

// Biome definitions
export const BIOMES = {
    SURFACE: {
        id: 'surface',
        name: 'Surface',
        minDepth: 0,
        maxDepth: SURFACE_LEVEL,
        ambientColor: '#1a1512',
    },
    VERDANT_CRUST: {
        id: 'verdant',
        name: 'The Verdant Crust',
        description: 'Fossilized Forest Dragons. Tangled with petrified wood and amber.',
        minDepth: SURFACE_LEVEL,
        maxDepth: 300,
        rootType: 'vitae',
        ambientColor: '#0f1a0f',
        hazards: ['gas_pocket', 'gravel_fall'],
        enemies: ['root_tick', 'spore_crawler'],
    },
    MAGMA_RIBS: {
        id: 'magma',
        name: 'The Magma Ribs',
        description: 'Volcanic Dragons. Scorching heat requires cooling.',
        minDepth: 300,
        maxDepth: 600,
        rootType: 'ignis',
        ambientColor: '#1a0a0a',
        hazards: ['lava', 'steam', 'heat'],
        enemies: ['magma_slug', 'fire_wasp'],
    },
    ABYSSAL_DEEP: {
        id: 'abyss',
        name: 'The Abyssal Deep',
        description: 'Void Dragons. Gravity is distorted here.',
        minDepth: 600,
        maxDepth: WORLD_HEIGHT,
        rootType: 'umbra',
        ambientColor: '#0a0a1a',
        hazards: ['gravity_distortion', 'void_corruption'],
        enemies: ['void_leech', 'shadow_stalker'],
    },
};

// Player settings
export const PLAYER = {
    SPEED: 3,
    JUMP_FORCE: 5.5, // Reduced for ~2 block jump height
    GRAVITY: 0.4,
    MAX_FALL_SPEED: 12,
    WIDTH: 12,
    HEIGHT: 24,
    DRILL_RANGE: 2.5,
    DRILL_POWER: 3, // Can mine stone(2), petrified_wood(2), vitae roots(2-3), amber(3)
    MAX_HEALTH: 100,
    MAX_OXYGEN: 100,
    MAX_HEAT: 100,
    OXYGEN_DRAIN_RATE: 0.02, // Per frame in underground
    HEAT_GAIN_RATE: 0.05, // Per frame near hot tiles
    HEAT_DECAY_RATE: 0.02, // Per frame when not near heat
    // Inventory settings
    BASE_INVENTORY_SLOTS: 20,
    DEFAULT_STACK_LIMIT: 99,
    JUMP_BUFFER_TIME: 100, // ms to buffer jump input
};

// Equipment Slots
export const EQUIPMENT_SLOTS = {
    EXCAVATOR: 'excavator',
    SUIT: 'suit',
    BACKPACK: 'backpack',
    UTILITY: 'utility',
    SYMBIOTE: 'symbiote',
};

// Chassis types for Bio-Forge crafting
export const CHASSIS_TYPES = {
    // Excavator chassis
    BASIC_DRILL: {
        id: 'basic_drill',
        name: 'Basic Drill Chassis',
        slot: 'excavator',
        tier: 1,
        cost: { stone: 20, petrified_wood: 5 },
    },
    TITANIUM_DRILL: {
        id: 'titanium_drill',
        name: 'Titanium Drill Chassis',
        slot: 'excavator',
        tier: 2,
        cost: { obsidian: 10, basalt: 20 },
    },
    VOID_DRILL: {
        id: 'void_drill',
        name: 'Void Drill Chassis',
        slot: 'excavator',
        tier: 3,
        cost: { void_stone: 15, crystal: 10 },
    },
    // Suit chassis
    BASIC_SUIT: {
        id: 'basic_suit',
        name: 'Basic Exosuit Chassis',
        slot: 'suit',
        tier: 1,
        cost: { stone: 30, petrified_wood: 10 },
    },
    THERMAL_SUIT: {
        id: 'thermal_suit',
        name: 'Thermal Exosuit Chassis',
        slot: 'suit',
        tier: 2,
        cost: { volcanic_rock: 20, obsidian: 10 },
    },
    PHASE_SUIT: {
        id: 'phase_suit',
        name: 'Phase Exosuit Chassis',
        slot: 'suit',
        tier: 3,
        cost: { shadow_glass: 15, crystal: 15 },
    },
    // Backpack chassis
    BASIC_PACK: {
        id: 'basic_pack',
        name: 'Basic Backpack Frame',
        slot: 'backpack',
        tier: 1,
        cost: { stone: 15, petrified_wood: 5 },
    },
    REFINERY_PACK: {
        id: 'refinery_pack',
        name: 'Refinery Backpack Frame',
        slot: 'backpack',
        tier: 2,
        cost: { basalt: 15, volcanic_rock: 10 },
    },
    // Utility chassis
    GRAPPLE_FRAME: {
        id: 'grapple_frame',
        name: 'Grappling Hook Frame',
        slot: 'utility',
        tier: 1,
        cost: { stone: 10, petrified_wood: 10 },
    },
    SCANNER_FRAME: {
        id: 'scanner_frame',
        name: 'Scanner Frame',
        slot: 'utility',
        tier: 2,
        cost: { crystal: 5, amber: 10 },
    },
};

// Living Tools - Full equipment system
// Power Progression: Base drill (3) -> Tier 1 (4) -> Tier 2 (5) -> Tier 3 (7)
export const LIVING_TOOLS = {
    // === EXCAVATORS ===
    // Tier 1: basic_drill + strain (power 4, can mine ignis capillaries)
    VORPAL_CLAW: {
        id: 'vorpal_claw',
        name: 'Vorpal Claw',
        category: 'excavator',
        brood: 'vitae',
        tier: 1,
        power: 4,
        description: 'Living dragon claw. Swipes in an arc, good for soft materials.',
        feedCost: { vitae_sap_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    MAGMA_WORM: {
        id: 'magma_worm',
        name: 'Magma-Worm',
        category: 'excavator',
        brood: 'ignis',
        tier: 1,
        power: 4,
        heatResistant: true,
        description: 'Fiery worm that burrows through rock. Resists heat damage.',
        feedCost: { ignis_plasma_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    VOID_BORER: {
        id: 'void_borer',
        name: 'Void Borer',
        category: 'excavator',
        brood: 'umbra',
        tier: 1,
        power: 4,
        phaseChance: 0.1,
        description: 'Umbral drill. Small chance to phase through blocks.',
        feedCost: { umbra_ichor_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 2: titanium_drill + strain (power 5, can mine umbra capillaries, ignis roots)
    SPORE_DRILL: {
        id: 'spore_drill',
        name: 'Spore-Spitter Drill',
        category: 'excavator',
        brood: 'vitae',
        tier: 2,
        power: 5,
        acidDamage: true,
        description: 'Dissolves rock with acid. Extra damage to organic materials.',
        feedCost: { vitae_sap: 8 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    INFERNO_JET: {
        id: 'inferno_jet',
        name: 'Inferno Jet',
        category: 'excavator',
        brood: 'ignis',
        tier: 2,
        power: 5,
        meltRock: true,
        heatGeneration: 0.3,
        description: 'Melts rock with plasma. Generates heat when used.',
        feedCost: { ignis_plasma: 8 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    SINGULARITY_PICK: {
        id: 'singularity_pick',
        name: 'Singularity Pick',
        category: 'excavator',
        brood: 'umbra',
        tier: 2,
        power: 5,
        pullResources: true,
        description: 'Void-touched pick. Pulls mined resources toward you.',
        feedCost: { umbra_ichor: 8 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 3: void_drill + strain (power 7, can mine everything)
    ROOT_SINGER: {
        id: 'root_singer',
        name: 'Root Singer',
        category: 'excavator',
        brood: 'vitae',
        tier: 3,
        power: 7,
        healOnMine: true,
        description: 'Harmonizes with dragon roots. Heals when mining organic matter.',
        feedCost: { vitae_sap_pure: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    CORE_BURNER: {
        id: 'core_burner',
        name: 'Core Burner',
        category: 'excavator',
        brood: 'ignis',
        tier: 3,
        power: 7,
        aoeMinning: true,
        description: 'Dragon-fire drill. Mines 3x3 area but generates significant heat.',
        feedCost: { ignis_plasma_pure: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    NULL_BREAKER: {
        id: 'null_breaker',
        name: 'Null Breaker',
        category: 'excavator',
        brood: 'umbra',
        tier: 3,
        power: 7,
        phaseThrough: true,
        description: 'Erases matter from existence. Can phase through any block.',
        feedCost: { umbra_ichor_pure: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === SUITS ===
    // Tier 1: basic_suit + strain
    PHOTOSYNTHESIS_PLATING: {
        id: 'photosynthesis_plating',
        name: 'Photosynthesis Plating',
        category: 'suit',
        brood: 'vitae',
        tier: 1,
        healthBonus: 15,
        regenNearLight: true,
        description: 'Regenerates HP when standing near light sources.',
        feedCost: { vitae_sap_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    HEAT_SHELL: {
        id: 'heat_shell',
        name: 'Heat Shell',
        category: 'suit',
        brood: 'ignis',
        tier: 1,
        heatResistance: 25,
        description: 'Basic heat protection for venturing into warm areas.',
        feedCost: { ignis_plasma_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    SHADOW_CLOAK: {
        id: 'shadow_cloak',
        name: 'Shadow Cloak',
        category: 'suit',
        brood: 'umbra',
        tier: 1,
        stealthBonus: 0.3,
        description: 'Reduces enemy detection range by 30%.',
        feedCost: { umbra_ichor_small: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 2: thermal_suit + strain
    REGEN_SUIT: {
        id: 'regen_suit',
        name: 'Regeneration Suit',
        category: 'suit',
        brood: 'vitae',
        tier: 2,
        healthBonus: 25,
        healthRegen: 0.1,
        description: 'Slowly regenerates health over time.',
        feedCost: { vitae_sap: 8, dragon_bone: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    THERMAL_VENT_RIG: {
        id: 'thermal_vent_rig',
        name: 'Thermal Vent Rig',
        category: 'suit',
        brood: 'ignis',
        tier: 2,
        heatResistance: 50,
        heatToSpeed: true,
        explodeOnOverheat: true,
        description: 'Converts Heat into Speed. Explode on overheat instead of dying.',
        feedCost: { ignis_plasma: 8, dragon_bone: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    VOID_SUIT: {
        id: 'void_suit',
        name: 'Void Suit',
        category: 'suit',
        brood: 'umbra',
        tier: 2,
        oxygenEfficiency: 0.5,
        gravityResist: true,
        description: 'Reduces oxygen consumption by 50%. Resists gravity distortion.',
        feedCost: { umbra_ichor: 8, dragon_bone: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 3: phase_suit + strain
    LIVING_ARMOR: {
        id: 'living_armor',
        name: 'Living Armor',
        category: 'suit',
        brood: 'vitae',
        tier: 3,
        healthBonus: 50,
        healthRegen: 0.2,
        damageReduction: 0.2,
        description: 'Symbiotic armor that heals and protects its wearer.',
        feedCost: { vitae_sap_pure: 5, dragon_ribcage: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    MAGMA_SKIN: {
        id: 'magma_skin',
        name: 'Magma Skin',
        category: 'suit',
        brood: 'ignis',
        tier: 3,
        heatResistance: 100,
        lavaImmunity: true,
        contactDamage: 10,
        description: 'Full lava immunity. Enemies take damage on contact.',
        feedCost: { ignis_plasma_pure: 5, dragon_ribcage: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    PHASE_SHIFT_ARMOR: {
        id: 'phase_shift_armor',
        name: 'Phase-Shift Armor',
        category: 'suit',
        brood: 'umbra',
        tier: 3,
        phaseOnDamage: true,
        phaseDuration: 2000,
        description: 'Taking damage gives 2 seconds of intangibility.',
        feedCost: { umbra_ichor_pure: 5, shadow_glass: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === BACKPACKS ===
    // Tier 1: basic_pack + strain
    GULPER_SACK: {
        id: 'gulper_sack',
        name: 'Gulper Sack',
        category: 'backpack',
        brood: 'vitae',
        tier: 1,
        capacityBonus: 50,
        digestsStone: true,
        description: 'Digests unwanted stone into fuel.',
        feedCost: { vitae_sap_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    HEAT_PACK: {
        id: 'heat_pack',
        name: 'Heat Pack',
        category: 'backpack',
        brood: 'ignis',
        tier: 1,
        capacityBonus: 30,
        heatStorage: true,
        description: 'Stores excess heat, releasing it slowly over time.',
        feedCost: { ignis_plasma_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    TURRET_MOUNT: {
        id: 'turret_mount',
        name: 'Turret Mount',
        category: 'backpack',
        brood: 'umbra',
        tier: 1,
        capacityBonus: 20,
        autoTurret: true,
        turretDamage: 5,
        description: 'Auto-firing gun on your shoulder for combat.',
        feedCost: { umbra_ichor_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 2: refinery_pack + strain
    GARDEN_PACK: {
        id: 'garden_pack',
        name: 'Garden Pack',
        category: 'backpack',
        brood: 'vitae',
        tier: 2,
        capacityBonus: 40,
        growSap: true,
        sapGrowthRate: 0.1,
        description: 'Living pack that slowly generates sap over time.',
        feedCost: { vitae_sap: 6 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    MOBILE_REFINERY: {
        id: 'mobile_refinery',
        name: 'Mobile Refinery',
        category: 'backpack',
        brood: 'ignis',
        tier: 2,
        capacityBonus: 30,
        autoSmelt: true,
        description: 'Smelts ore while you walk (passive income).',
        feedCost: { ignis_plasma: 6 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    VOID_PACK: {
        id: 'void_pack',
        name: 'Void Pack',
        category: 'backpack',
        brood: 'umbra',
        tier: 2,
        capacityBonus: 100,
        dimensionalStorage: true,
        description: 'Pocket dimension storage with massive capacity.',
        feedCost: { umbra_ichor: 6, crystal: 3 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === UTILITIES ===
    // Tier 1: grapple_frame + strain
    VINE_GRAPPLE: {
        id: 'vine_grapple',
        name: 'Vine Grapple',
        category: 'utility',
        brood: 'vitae',
        tier: 1,
        grapple: true,
        grappleRange: 10,
        description: 'Living vines for vertical movement.',
        feedCost: { vitae_sap_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    FLAME_JETS: {
        id: 'flame_jets',
        name: 'Flame Jets',
        category: 'utility',
        brood: 'ignis',
        tier: 1,
        jetBoost: true,
        boostPower: 1.5,
        description: 'Fire-powered jets for quick horizontal dashes.',
        feedCost: { ignis_plasma_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    STASIS_FIELD: {
        id: 'stasis_field',
        name: 'Stasis Field',
        category: 'utility',
        brood: 'umbra',
        tier: 1,
        freezeRadius: 5,
        freezeDuration: 3000,
        description: 'Freezes falling rocks or enemies temporarily.',
        feedCost: { umbra_ichor_small: 4 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    // Tier 2: scanner_frame + strain
    ROOT_SENSE: {
        id: 'root_sense',
        name: 'Root Sense',
        category: 'utility',
        brood: 'vitae',
        tier: 2,
        revealRoots: true,
        revealSap: true,
        scanRange: 25,
        description: 'Senses dragon roots and sap deposits through walls.',
        feedCost: { vitae_sap: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    ORE_SCANNER: {
        id: 'ore_scanner',
        name: 'Ore Scanner',
        category: 'utility',
        brood: 'ignis',
        tier: 2,
        revealOre: true,
        revealWeakness: true,
        scanRange: 20,
        description: 'Reveals hidden ores and structural weaknesses.',
        feedCost: { ignis_plasma: 5 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    VOID_SIGHT: {
        id: 'void_sight',
        name: 'Void Sight',
        category: 'utility',
        brood: 'umbra',
        tier: 2,
        seeThrough: true,
        revealEnemies: true,
        sightRange: 15,
        description: 'See through walls and detect hidden enemies.',
        feedCost: { umbra_ichor: 5, crystal: 2 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === SYMBIOTES ===
    LOOT_BEETLE: {
        id: 'loot_beetle',
        name: 'Loot Beetle',
        category: 'symbiote',
        brood: 'vitae',
        tier: 1,
        autoLoot: true,
        lootRange: 5,
        description: 'Small beetle that auto-collects nearby loot.',
        feedCost: { vitae_sap: 3, dragon_claw: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    FLAME_WISP: {
        id: 'flame_wisp',
        name: 'Flame Wisp',
        category: 'symbiote',
        brood: 'ignis',
        tier: 2,
        lightRadius: 6,
        burnDamage: 3,
        description: 'Floating light source that burns nearby enemies.',
        feedCost: { ignis_plasma: 5, ignis_plasma_pure: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    SHADOW_ORB: {
        id: 'shadow_orb',
        name: 'Shadow Orb',
        category: 'symbiote',
        brood: 'umbra',
        tier: 3,
        combatSupport: true,
        damage: 8,
        attackRate: 1000,
        description: 'Orbiting void sphere that attacks enemies.',
        feedCost: { umbra_ichor: 8, umbra_ichor_pure: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === MOVEMENT (kept for compatibility) ===
    VOID_WINGS: {
        id: 'void_wings',
        name: 'Void Wings',
        category: 'movement',
        brood: 'umbra',
        tier: 2,
        glide: true,
        doubleJump: true,
        description: 'Leathery wings for gliding and double jumps.',
        feedCost: { umbra_ichor: 3, dragon_bone: 2 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    SPIDER_LIMBS: {
        id: 'spider_limbs',
        name: 'Spider-Limbs',
        category: 'movement',
        brood: 'vitae',
        tier: 2,
        wallClimb: true,
        description: 'Mechanical spider legs for wall climbing.',
        feedCost: { vitae_sap: 3, dragon_claw: 2 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },

    // === VISION ===
    SONAR_PULSE: {
        id: 'sonar_pulse',
        name: 'Sonar Pulse',
        category: 'vision',
        brood: 'vitae',
        tier: 1,
        range: 60,
        revealOre: true,
        description: 'Highlights ore density and structures.',
        feedCost: { vitae_sap: 2 },
        evolvesTo: 'predator_sight',
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
    PREDATOR_SIGHT: {
        id: 'predator_sight',
        name: 'Predator Sight',
        category: 'vision',
        brood: 'ignis',
        tier: 2,
        range: 40,
        revealEnemies: true,
        seeThrough: true,
        description: 'Highlights enemies in red through walls.',
        feedCost: { ignis_plasma: 3, dragon_tooth: 1 },
        xp: 0,
        level: 1,
        maxLevel: 20,
    },
};

// Equipment Set Bonuses
export const EQUIPMENT_SETS = {
    VITAE: {
        id: 'vitae',
        name: 'The Vitae Brood',
        description: 'Forest / Acid / Life',
        aesthetic: 'Overgrown, mossy metal, pulsing green veins',
        bonuses: {
            2: { name: 'Verdant Touch', effect: 'healthRegen', value: 0.05 },
            3: { name: 'Root Network', effect: 'pipeTravel', value: true },
        },
    },
    IGNIS: {
        id: 'ignis',
        name: 'The Ignis Brood',
        description: 'Fire / Magma / Speed',
        aesthetic: 'Charred black metal, glowing vents, smoke exhaust',
        bonuses: {
            2: { name: 'Thermal Surge', effect: 'heatToSpeed', value: 0.5 },
            3: { name: 'Magma Walker', effect: 'lavaImmunity', value: true },
        },
    },
    UMBRA: {
        id: 'umbra',
        name: 'The Umbra Brood',
        description: 'Void / Gravity / Tech',
        aesthetic: 'Sleek chrome, floating shapes, purple energy',
        bonuses: {
            2: { name: 'Void Touch', effect: 'phaseChance', value: 0.1 },
            3: { name: 'Gravity Well', effect: 'wallWalk', value: true },
        },
    },
};

// Mutation/Evolution paths for tools
export const MUTATIONS = {
    // Level 5 mutations
    SERRATED_TEETH: {
        id: 'serrated_teeth',
        name: 'Serrated Teeth',
        level: 5,
        effect: 'hardRockBonus',
        value: 0.2,
        description: '+20% Dig Speed against Hard Rock',
    },
    GAPING_MAW: {
        id: 'gaping_maw',
        name: 'Gaping Maw',
        level: 5,
        effect: 'dropRate',
        value: 0.5,
        description: '+50% Resource Drop Rate',
    },
    // Level 10 mutations
    ADRENALINE_GLANDS: {
        id: 'adrenaline_glands',
        name: 'Adrenaline Glands',
        level: 10,
        effect: 'speedRamp',
        value: 0.1,
        description: 'Digging speed increases the longer you hold',
    },
    VENOM_SACS: {
        id: 'venom_sacs',
        name: 'Venom Sacs',
        level: 10,
        effect: 'poisonDamage',
        value: 5,
        description: 'Drilling an enemy poisons them',
    },
    // Level 20 ultimate mutations
    WORLD_EATER: {
        id: 'world_eater',
        name: 'The World Eater',
        level: 20,
        effect: 'drillSize',
        value: 2,
        description: 'Drill size doubles (2x2 tunnel)',
    },
    HIVE_MIND: {
        id: 'hive_mind',
        name: 'The Hive Mind',
        level: 20,
        effect: 'spawnBeetles',
        value: 3,
        description: 'Spawns friendly beetles that mine nearby ores',
    },
};

// Artifacts (end-game collectibles)
export const ARTIFACTS = {
    DRAGONS_EYE: {
        id: 'dragons_eye',
        name: "The Dragon's Eye",
        description: 'Permanently reveals the map in a radius around the player.',
        effect: 'revealRadius',
        value: 15,
        found: false,
    },
    PETRIFIED_HEART: {
        id: 'petrified_heart',
        name: 'The Petrified Heart',
        description: 'Increases max HP by 50%.',
        effect: 'maxHealthBonus',
        value: 0.5,
        found: false,
    },
    CHRONO_SCALE: {
        id: 'chrono_scale',
        name: 'The Chrono-Scale',
        description: 'Machines on the surface work 2x faster.',
        effect: 'machineSpeed',
        value: 2,
        found: false,
    },
    VOID_CRYSTAL: {
        id: 'void_crystal',
        name: 'The Void Crystal',
        description: 'Reduces oxygen drain by 50%.',
        effect: 'oxygenEfficiency',
        value: 0.5,
        found: false,
    },
    FLAME_CORE: {
        id: 'flame_core',
        name: 'The Flame Core',
        description: 'Heat damage reduced by 75%.',
        effect: 'heatResistance',
        value: 0.75,
        found: false,
    },
};

// Extraction settings
export const EXTRACTION = {
    SAP_FLOW_RATE: 0.5,
    PIPE_CAPACITY: 100,
    EXTRACTOR_RANGE: 3,
    DEFENSE_DURATION: 60000, // 60 seconds
    WAVE_INTERVAL: 15000, // 15 seconds between waves
    WAVES_PER_EXTRACTION: 4,
};

// Enemy types
export const ENEMIES = {
    // Layer 1 enemies
    ROOT_TICK: {
        id: 'root_tick',
        name: 'Root Tick',
        health: 20,
        damage: 5,
        speed: 1.5,
        behavior: 'swarm',
        layer: 1,
    },
    SPORE_CRAWLER: {
        id: 'spore_crawler',
        name: 'Spore Crawler',
        health: 30,
        damage: 8,
        speed: 1,
        behavior: 'ranged',
        projectile: 'toxic_spore',
        layer: 1,
    },

    // Layer 2 enemies
    MAGMA_SLUG: {
        id: 'magma_slug',
        name: 'Magma Slug',
        health: 50,
        damage: 15,
        speed: 0.8,
        behavior: 'charge',
        leaveTrail: 'lava',
        layer: 2,
    },
    FIRE_WASP: {
        id: 'fire_wasp',
        name: 'Fire Wasp',
        health: 25,
        damage: 10,
        speed: 3,
        behavior: 'flying',
        layer: 2,
    },

    // Layer 3 enemies
    VOID_LEECH: {
        id: 'void_leech',
        name: 'Void Leech',
        health: 40,
        damage: 12,
        speed: 2,
        behavior: 'teleport',
        drainOxygen: true,
        layer: 3,
    },
    SHADOW_STALKER: {
        id: 'shadow_stalker',
        name: 'Shadow Stalker',
        health: 80,
        damage: 25,
        speed: 1.5,
        behavior: 'ambush',
        invisible: true,
        layer: 3,
    },
};

// Sonar settings
export const SONAR = {
    RANGE: 60,
    COOLDOWN: 3000,
    PING_DURATION: 2000,
    REVEAL_DURATION: 8000,
};

// Physics settings
export const PHYSICS = {
    FLUID_SPREAD_RATE: 2, // Tiles per second
    FLUID_MAX_LEVEL: 8, // Sub-tile levels for smooth flow
    GRAVITY_TICK: 100, // MS between falling checks
    GAS_RISE_RATE: 1,
    EXPLOSION_RADIUS: 5,
};

// Input bindings
export const KEYS = {
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],
    JUMP: ['KeyW', 'ArrowUp', 'Space'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    DRILL: ['Mouse0'],
    PLACE_BLOCK: ['Mouse2'], // Right-click to place blocks
    SONAR: ['KeyE'],
    TOOL_1: ['Digit1'],
    TOOL_2: ['Digit2'],
    TOOL_3: ['Digit3'],
    TOOL_4: ['Digit4'],
    TOOL_5: ['Digit5'],
    TOOL_6: ['Digit6'],
    TOOL_7: ['Digit7'],
    TOOL_8: ['Digit8'],
    TOOL_9: ['Digit9'],
    INVENTORY: ['Tab', 'KeyI'],
    PAUSE: ['Escape'],
    PLACE_TURRET: ['KeyT'],
    PLACE_EXTRACTOR: ['KeyR'],
    PLACE_OXYGEN: ['KeyO'],
    RECALL: ['KeyH'],
    EQUIPMENT: ['KeyQ'],
    BIOFORGE: ['KeyB'],
    CYCLE_PLACEABLE: ['KeyC'], // Cycle through placeable blocks
};

// Item definitions with stack limits and properties
export const ITEMS = {
    // Terrain materials (high stack limit)
    dirt: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.DIRT },
    stone: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.STONE },
    petrified_wood: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.PETRIFIED_WOOD },
    gravel: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.GRAVEL },
    volcanic_rock: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.VOLCANIC_ROCK },
    basalt: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.BASALT },
    obsidian: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.OBSIDIAN },
    void_stone: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.VOID_STONE },
    shadow_glass: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.SHADOW_GLASS },

    // Special materials (medium stack limit)
    amber: { stackLimit: 99, placeable: false },
    crystal: { stackLimit: 99, placeable: true, tileType: TILE_TYPES.CRYSTAL },
    floating_rock: { stackLimit: 99, placeable: true, tileType: TILE_TYPES.FLOATING_ROCK },
    ash: { stackLimit: 999, placeable: true, tileType: TILE_TYPES.ASH },

    // Dragon materials (low stack limit, valuable)
    vitae_sap_small: { stackLimit: 99, placeable: false },
    vitae_sap: { stackLimit: 50, placeable: false },
    vitae_sap_pure: { stackLimit: 20, placeable: false },
    ignis_plasma_small: { stackLimit: 99, placeable: false },
    ignis_plasma: { stackLimit: 50, placeable: false },
    ignis_plasma_pure: { stackLimit: 20, placeable: false },
    umbra_ichor_small: { stackLimit: 99, placeable: false },
    umbra_ichor: { stackLimit: 50, placeable: false },
    umbra_ichor_pure: { stackLimit: 20, placeable: false },

    // Fossils (very low stack limit)
    dragon_bone: { stackLimit: 20, placeable: false },
    dragon_claw: { stackLimit: 10, placeable: false },
    dragon_tooth: { stackLimit: 10, placeable: false },
    dragon_skull: { stackLimit: 5, placeable: false },
    dragon_ribcage: { stackLimit: 5, placeable: false },

    // Craftable building materials
    wood_plank: { stackLimit: 999, placeable: true, craftable: true, tileType: TILE_TYPES.WOOD_PLANK },
    ladder: { stackLimit: 99, placeable: true, craftable: true, tileType: TILE_TYPES.LADDER },
    platform: { stackLimit: 99, placeable: true, craftable: true, tileType: TILE_TYPES.PLATFORM },
    torch: { stackLimit: 99, placeable: true, craftable: true, tileType: TILE_TYPES.TORCH },
    storage_crate: { stackLimit: 10, placeable: true, craftable: true, tileType: TILE_TYPES.STORAGE_CRATE },
    reinforced_stone: { stackLimit: 999, placeable: true, craftable: true, tileType: TILE_TYPES.REINFORCED_STONE },
    glass_pane: { stackLimit: 99, placeable: true, craftable: true, tileType: TILE_TYPES.GLASS_PANE },

    // Equipment/Machines
    pipe: { stackLimit: 50, placeable: true },
    extractor: { stackLimit: 10, placeable: true },
    turret: { stackLimit: 10, placeable: true },
    oxygen_station: { stackLimit: 5, placeable: true },
    pump: { stackLimit: 10, placeable: true },
};

// Game states
export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    EXTRACTION_EVENT: 'extraction',
    INVENTORY: 'inventory',
    LAB: 'lab',
    MARKET: 'market',
    GAME_OVER: 'game_over',
};

// Tools
export const TOOLS = {
    DRILL: 'drill',
    SONAR: 'sonar',
    PIPE: 'pipe',
    EXTRACTOR: 'extractor',
    TURRET: 'turret',
};

// Contract types for market
export const CONTRACT_TYPES = {
    COLLECT: 'collect',
    EXPLORE: 'explore',
    DEFEAT: 'defeat',
    EXTRACT: 'extract',
};

// Tile colors for rendering
export const TILE_COLORS = {
    [TILE_TYPES.AIR]: 'transparent',
    [TILE_TYPES.SKY]: '#4a90c8',

    // Surface tiles
    [TILE_TYPES.GRASS]: '#2d8a2d',
    [TILE_TYPES.SURFACE_DIRT]: '#5a4530',
    [TILE_TYPES.SURFACE_STONE]: '#6a6a6a',
    [TILE_TYPES.MINE_SUPPORT]: '#6b4423',
    [TILE_TYPES.MINE_LADDER]: '#7a5533',

    // Layer 1: Verdant Crust
    [TILE_TYPES.DIRT]: '#3a2718',
    [TILE_TYPES.STONE]: '#4a4a4a',
    [TILE_TYPES.PETRIFIED_WOOD]: '#5a4030',
    [TILE_TYPES.AMBER]: '#d4a020',
    [TILE_TYPES.GRAVEL]: '#6a6a5a',

    // Layer 2: Magma Ribs
    [TILE_TYPES.VOLCANIC_ROCK]: '#3a2020',
    [TILE_TYPES.BASALT]: '#2a2a2a',
    [TILE_TYPES.OBSIDIAN]: '#1a1a2a',
    [TILE_TYPES.ASH]: '#5a5050',

    // Layer 3: Abyssal Deep
    [TILE_TYPES.VOID_STONE]: '#1a0a2a',
    [TILE_TYPES.CRYSTAL]: '#8060c0',
    [TILE_TYPES.FLOATING_ROCK]: '#4a3a5a',
    [TILE_TYPES.SHADOW_GLASS]: '#2a2040',

    // Fluids
    [TILE_TYPES.WATER]: '#2a5080',
    [TILE_TYPES.LAVA]: '#ff4400',
    [TILE_TYPES.ACID]: '#40ff40',
    [TILE_TYPES.UMBRA_OOZE]: '#6020a0',

    // Gases
    [TILE_TYPES.GAS_POCKET]: '#80a060',
    [TILE_TYPES.TOXIC_SPORE]: '#a0ff80',
    [TILE_TYPES.STEAM]: '#c0c0d0',

    // Vitae Roots
    [TILE_TYPES.VITAE_CAPILLARY]: '#00aa77',
    [TILE_TYPES.VITAE_ROOT]: '#00ffaa',
    [TILE_TYPES.VITAE_CORE]: '#00ffdd',

    // Ignis Roots
    [TILE_TYPES.IGNIS_CAPILLARY]: '#cc6600',
    [TILE_TYPES.IGNIS_ROOT]: '#ff9900',
    [TILE_TYPES.IGNIS_CORE]: '#ffcc00',

    // Umbra Roots
    [TILE_TYPES.UMBRA_CAPILLARY]: '#6600aa',
    [TILE_TYPES.UMBRA_ROOT]: '#9900ff',
    [TILE_TYPES.UMBRA_CORE]: '#cc66ff',

    // Fossils
    [TILE_TYPES.FOSSIL_BONE]: '#d0c8b0',
    [TILE_TYPES.FOSSIL_CLAW]: '#c0b8a0',
    [TILE_TYPES.FOSSIL_TOOTH]: '#e0d8c0',
    [TILE_TYPES.FOSSIL_SKULL]: '#d8d0b8',
    [TILE_TYPES.FOSSIL_RIBCAGE]: '#c8c0a8',

    // Structures
    [TILE_TYPES.PIPE]: '#707080',
    [TILE_TYPES.EXTRACTOR]: '#8844aa',
    [TILE_TYPES.PUMP]: '#aa8844',
    [TILE_TYPES.TURRET]: '#668866',
    [TILE_TYPES.OXYGEN_STATION]: '#4488cc',

    // Building materials
    [TILE_TYPES.WOOD_PLANK]: '#8b6914',
    [TILE_TYPES.LADDER]: '#9a7b2a',
    [TILE_TYPES.PLATFORM]: '#7a6b5a',
    [TILE_TYPES.TORCH]: '#ffd700',
    [TILE_TYPES.STORAGE_CRATE]: '#8b7355',
    [TILE_TYPES.REINFORCED_STONE]: '#5a5a6a',
    [TILE_TYPES.GLASS_PANE]: '#aaccee',

    // Bedrock
    [TILE_TYPES.BEDROCK]: '#1a1a1a',
};
