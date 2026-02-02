# Wyrmroot Excavation

A mining game where you excavate the fossilized remains of ancient celestial Dragons that crashed into the planet eons ago. Follow the glowing capillaries deep into the earth to find the Dragon Roots—massive, petrified veins that still pulse with magical energy.

## Game Concept

**You are a Xeno-Archeologist.** Your job is to dig deep into the crust to find Dragon Roots and extract their precious Wyrm Sap. Use the sap to grow biological tools and companions in your lab.

### Core Gameplay Loop

1. **The Dig** - Drill downwards through procedurally generated rock layers
2. **The Hunt** - Use sonar to locate dragon roots and capillaries
3. **The Harvest** - Build extraction pipelines to collect Wyrm Sap
4. **The Lab** - Grow living tools and companions from DNA samples

## Running the Game

Simply open `index.html` in a modern web browser. No build step required!

For local development with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Space | Jump |
| Mouse | Aim |
| Left Click | Use Tool (Drill/Place) |
| 1 | Select Drill |
| 2 | Select Sonar |
| 3 | Select Pipe |
| 4 | Select Extractor |
| E | Activate Sonar |
| Tab / I | Inventory |
| Escape | Pause |

## Replacing Placeholder Assets

The game uses procedurally generated placeholder sprites that can be easily replaced with custom pixel art.

### Asset Structure

```
assets/
├── sprites/
│   ├── tiles/           # 16x16 tile sprites
│   │   ├── dirt.png
│   │   ├── stone.png
│   │   ├── hard_stone.png
│   │   ├── bedrock.png
│   │   ├── capillary.png
│   │   ├── dragon_root.png
│   │   ├── root_core.png
│   │   ├── fossil_bone.png
│   │   ├── fossil_claw.png
│   │   ├── fossil_tooth.png
│   │   ├── pipe.png
│   │   ├── extractor.png
│   │   └── pump.png
│   ├── player/          # Player sprites (16x32)
│   │   ├── idle.png
│   │   ├── walk.png     # Sprite sheet
│   │   ├── drill.png
│   │   └── fall.png
│   ├── tools/           # Tool icons (24x24)
│   │   ├── drill.png
│   │   ├── sonar.png
│   │   ├── pipe.png
│   │   └── extractor.png
│   ├── effects/         # Effect sprites (32x32)
│   │   ├── sonar_ping.png
│   │   ├── drill_particles.png
│   │   ├── sap_drip.png
│   │   └── glow.png
│   ├── creatures/       # Creature sprites (24x24)
│   │   ├── antibody.png
│   │   └── wyrm.png
│   └── ui/              # UI elements
│       ├── heart.png
│       └── sap_icon.png
└── audio/               # Sound effects
    ├── drill.wav
    ├── break.wav
    ├── sonar.wav
    ├── sap_flow.wav
    ├── discovery.wav
    └── ambient.ogg
```

### Creating Custom Assets

1. **Tile Sprites (16x16):**
   - Use the exact dimensions: 16x16 pixels
   - Save as PNG with transparency
   - For animated tiles, use sprite sheets (horizontal strip)

2. **Player Sprites (16x32):**
   - Width: 16px, Height: 32px
   - For walk animation: horizontal sprite sheet with 4 frames

3. **Color Palette Suggestions:**
   ```
   Dirt:        #4a3728, #5a4738, #3a2718
   Stone:       #5a5a5a, #4a4a4a, #6a6a6a
   Capillary:   #00aa77, #00cc88, #008866
   Dragon Root: #00ffaa, #00ddaa, #00ffcc
   Root Core:   #00ffdd, #00ffff, #88ffff
   Fossil:      #d4c4a8, #e4d4b8, #c4b498
   ```

### Asset Loading System

The game's `AssetManager` (`src/core/AssetManager.js`) automatically:
- Attempts to load custom assets from the defined paths
- Falls back to generated placeholders if assets are missing
- Logs which assets are using placeholders

To add a new sprite:
1. Place the image file in the appropriate folder
2. Add the path to the `manifest` in `AssetManager.js`
3. The game will automatically use it on next load

## Project Structure

```
WyrmrootExcavation/
├── index.html              # Entry point
├── styles/
│   └── main.css            # UI styling
├── src/
│   ├── main.js             # Game initialization
│   ├── core/
│   │   ├── Constants.js    # Game configuration
│   │   ├── AssetManager.js # Asset loading & placeholders
│   │   ├── Input.js        # Input handling
│   │   ├── Camera.js       # Viewport management
│   │   ├── Renderer.js     # Drawing system
│   │   └── Game.js         # Main game loop
│   ├── world/
│   │   ├── World.js        # Tile management
│   │   └── WorldGenerator.js # Procedural generation
│   ├── entities/
│   │   └── Player.js       # Player entity
│   ├── systems/
│   │   ├── ExtractionSystem.js # Pipeline network
│   │   └── LabSystem.js    # DNA & growth system
│   └── ui/
│       └── UIManager.js    # UI updates
└── assets/
    ├── sprites/            # Image assets
    ├── audio/              # Sound assets
    └── data/               # JSON data files
```

## Development Roadmap

### Phase 1: Core Mining (Current)
- [x] Tile-based world with chunks
- [x] Procedural dragon root generation
- [x] Player movement and mining
- [x] Sonar ping mechanic
- [x] Basic UI

### Phase 2: Extraction
- [x] Pipeline system foundation
- [ ] Fluid simulation for sap flow
- [ ] Immune response enemies
- [ ] Tower defense mechanics

### Phase 3: Lab & Growth
- [x] Lab system foundation
- [ ] DNA collection
- [ ] Tool incubation UI
- [ ] Companion creatures

### Phase 4: Biomes
- [ ] Ice Dragon biome
- [ ] Magma Dragon biome
- [ ] Void Dragon biome
- [ ] Unique resources per biome

### Phase 5: Polish
- [ ] Sound effects
- [ ] Music
- [ ] Save/Load system
- [ ] Achievement system

## Technical Notes

- **No Build Step:** Pure ES6 modules, runs directly in browser
- **Canvas Rendering:** 2D context with pixel-perfect rendering
- **Chunk System:** Lazy loading for infinite depth
- **Procedural Generation:** Seeded for reproducible worlds

## License

This project is for educational and personal use.

---

*"The world didn't evolve from dust; it grew from the corpses of celestial Dragons."*
