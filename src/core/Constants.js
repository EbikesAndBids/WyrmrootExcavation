/**
 * Game Constants and Configuration
 * Central place for all game settings - easy to tweak and balance
 */

export const TILE_SIZE = 16; // Pixels per tile
export const CHUNK_SIZE = 32; // Tiles per chunk

// Canvas settings
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const RENDER_SCALE = 2; // For crisp pixel art

// World generation
export const WORLD_WIDTH_CHUNKS = 8;
export const WORLD_HEIGHT_CHUNKS = 32;
export const WORLD_WIDTH = WORLD_WIDTH_CHUNKS * CHUNK_SIZE;
export const WORLD_HEIGHT = WORLD_HEIGHT_CHUNKS * CHUNK_SIZE;

// Surface level (in tiles from top)
export const SURFACE_LEVEL = 4;

// Tile types
export const TILE_TYPES = {
    AIR: 0,
    DIRT: 1,
    STONE: 2,
    HARD_STONE: 3,
    BEDROCK: 4,
    CAPILLARY: 10,      // Small dragon veins
    DRAGON_ROOT: 11,    // Main dragon root
    ROOT_CORE: 12,      // Core of dragon root (higher yield)
    FOSSIL_BONE: 20,    // Dragon fossils
    FOSSIL_CLAW: 21,
    FOSSIL_TOOTH: 22,
    PIPE: 30,
    EXTRACTOR: 31,
    PUMP: 32,
};

// Tile properties
export const TILE_PROPERTIES = {
    [TILE_TYPES.AIR]: { solid: false, hardness: 0, drops: null },
    [TILE_TYPES.DIRT]: { solid: true, hardness: 1, drops: 'dirt' },
    [TILE_TYPES.STONE]: { solid: true, hardness: 2, drops: 'stone' },
    [TILE_TYPES.HARD_STONE]: { solid: true, hardness: 4, drops: 'stone' },
    [TILE_TYPES.BEDROCK]: { solid: true, hardness: -1, drops: null }, // Unbreakable
    [TILE_TYPES.CAPILLARY]: { solid: true, hardness: 1, drops: 'wyrm_sap_small', glows: true },
    [TILE_TYPES.DRAGON_ROOT]: { solid: true, hardness: 3, drops: 'wyrm_sap', glows: true },
    [TILE_TYPES.ROOT_CORE]: { solid: true, hardness: 5, drops: 'wyrm_sap_pure', glows: true },
    [TILE_TYPES.FOSSIL_BONE]: { solid: true, hardness: 3, drops: 'dragon_bone' },
    [TILE_TYPES.FOSSIL_CLAW]: { solid: true, hardness: 4, drops: 'dragon_claw' },
    [TILE_TYPES.FOSSIL_TOOTH]: { solid: true, hardness: 4, drops: 'dragon_tooth' },
    [TILE_TYPES.PIPE]: { solid: false, hardness: 1, drops: 'pipe', placeable: true },
    [TILE_TYPES.EXTRACTOR]: { solid: true, hardness: 2, drops: 'extractor', placeable: true },
    [TILE_TYPES.PUMP]: { solid: true, hardness: 2, drops: 'pump', placeable: true },
};

// Tile colors (placeholder - will be replaced with sprites)
export const TILE_COLORS = {
    [TILE_TYPES.AIR]: 'transparent',
    [TILE_TYPES.DIRT]: '#4a3728',
    [TILE_TYPES.STONE]: '#5a5a5a',
    [TILE_TYPES.HARD_STONE]: '#3a3a3a',
    [TILE_TYPES.BEDROCK]: '#1a1a1a',
    [TILE_TYPES.CAPILLARY]: '#00aa77',
    [TILE_TYPES.DRAGON_ROOT]: '#00ffaa',
    [TILE_TYPES.ROOT_CORE]: '#00ffdd',
    [TILE_TYPES.FOSSIL_BONE]: '#d4c4a8',
    [TILE_TYPES.FOSSIL_CLAW]: '#c4b498',
    [TILE_TYPES.FOSSIL_TOOTH]: '#e4d4b8',
    [TILE_TYPES.PIPE]: '#666666',
    [TILE_TYPES.EXTRACTOR]: '#8844aa',
    [TILE_TYPES.PUMP]: '#aa8844',
};

// Biome types (based on depth)
export const BIOMES = {
    SURFACE: { minDepth: 0, maxDepth: 20, name: 'Surface' },
    SHALLOW: { minDepth: 20, maxDepth: 100, name: 'Shallow Earth' },
    DEEP: { minDepth: 100, maxDepth: 300, name: 'Deep Stone' },
    ABYSS: { minDepth: 300, maxDepth: 600, name: 'The Abyss' },
    CORE: { minDepth: 600, maxDepth: Infinity, name: 'Dragon Core' },
};

// Player settings
export const PLAYER = {
    SPEED: 3,
    JUMP_FORCE: 8,
    GRAVITY: 0.4,
    MAX_FALL_SPEED: 12,
    WIDTH: 12,
    HEIGHT: 24,
    DRILL_RANGE: 2, // Tiles
    DRILL_POWER: 1,
    MAX_HEALTH: 100,
    MAX_OXYGEN: 100,
    OXYGEN_DRAIN_RATE: 0.1,
};

// Sonar settings
export const SONAR = {
    RANGE: 50, // Tiles
    COOLDOWN: 3000, // Milliseconds
    PING_DURATION: 2000,
    REVEAL_DURATION: 5000,
};

// Extraction settings
export const EXTRACTION = {
    SAP_FLOW_RATE: 0.5,
    PIPE_CAPACITY: 100,
    EXTRACTOR_RANGE: 3,
};

// Colors for glow effects
export const GLOW_COLORS = {
    CAPILLARY: 'rgba(0, 170, 119, 0.3)',
    DRAGON_ROOT: 'rgba(0, 255, 170, 0.5)',
    ROOT_CORE: 'rgba(0, 255, 221, 0.7)',
    SONAR_PING: 'rgba(68, 170, 255, 0.4)',
};

// Input key bindings
export const KEYS = {
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],
    JUMP: ['KeyW', 'ArrowUp', 'Space'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    DRILL: ['Mouse0'], // Left click
    SONAR: ['KeyE'],
    TOOL_1: ['Digit1'],
    TOOL_2: ['Digit2'],
    TOOL_3: ['Digit3'],
    TOOL_4: ['Digit4'],
    INVENTORY: ['Tab', 'KeyI'],
    PAUSE: ['Escape'],
};

// Game states
export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    INVENTORY: 'inventory',
    LAB: 'lab',
};

// Tool types
export const TOOLS = {
    DRILL: 'drill',
    SONAR: 'sonar',
    PIPE: 'pipe',
    EXTRACTOR: 'extractor',
};
