/**
 * Input Handler
 * Manages keyboard and mouse input with configurable bindings
 */

import { KEYS } from './Constants.js';

class InputManager {
    constructor() {
        this.keys = new Map();
        this.keysJustPressed = new Set();
        this.keysJustReleased = new Set();

        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            buttons: new Map(),
            buttonsJustPressed: new Set(),
            buttonsJustReleased: new Set(),
            wheel: 0,
        };

        this.canvas = null;
        this.camera = null;

        this.init();
    }

    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: true });
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setCanvas(canvas) {
        this.canvas = canvas;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    handleKeyDown(e) {
        if (!this.keys.get(e.code)) {
            this.keysJustPressed.add(e.code);
        }
        this.keys.set(e.code, true);

        // Prevent default for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        this.keys.set(e.code, false);
        this.keysJustReleased.add(e.code);
    }

    handleMouseMove(e) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;

            // Calculate world position if camera is set
            if (this.camera) {
                this.mouse.worldX = this.mouse.x + this.camera.x;
                this.mouse.worldY = this.mouse.y + this.camera.y;
            }
        }
    }

    handleMouseDown(e) {
        // Only register mouse clicks on the canvas, not UI elements
        // This prevents clicking hotbar slots from triggering game actions
        if (e.target !== this.canvas && e.target.id !== 'game-canvas') {
            return;
        }

        const button = `Mouse${e.button}`;
        if (!this.mouse.buttons.get(button)) {
            this.mouse.buttonsJustPressed.add(button);
        }
        this.mouse.buttons.set(button, true);
        e.preventDefault();
    }

    handleMouseUp(e) {
        const button = `Mouse${e.button}`;
        this.mouse.buttons.set(button, false);
        this.mouse.buttonsJustReleased.add(button);
    }

    handleWheel(e) {
        this.mouse.wheel = e.deltaY;
    }

    /**
     * Check if a key code is used by the game
     */
    isGameKey(code) {
        for (const binding of Object.values(KEYS)) {
            if (binding.includes(code)) return true;
        }
        return false;
    }

    /**
     * Check if an action is currently pressed
     */
    isActionPressed(action) {
        const bindings = KEYS[action];
        if (!bindings) return false;

        for (const binding of bindings) {
            if (binding.startsWith('Mouse')) {
                if (this.mouse.buttons.get(binding)) return true;
            } else {
                if (this.keys.get(binding)) return true;
            }
        }
        return false;
    }

    /**
     * Check if an action was just pressed this frame
     */
    isActionJustPressed(action) {
        const bindings = KEYS[action];
        if (!bindings) return false;

        for (const binding of bindings) {
            if (binding.startsWith('Mouse')) {
                if (this.mouse.buttonsJustPressed.has(binding)) return true;
            } else {
                if (this.keysJustPressed.has(binding)) return true;
            }
        }
        return false;
    }

    /**
     * Check if an action was just released this frame
     */
    isActionJustReleased(action) {
        const bindings = KEYS[action];
        if (!bindings) return false;

        for (const binding of bindings) {
            if (binding.startsWith('Mouse')) {
                if (this.mouse.buttonsJustReleased.has(binding)) return true;
            } else {
                if (this.keysJustReleased.has(binding)) return true;
            }
        }
        return false;
    }

    /**
     * Get horizontal input (-1, 0, or 1)
     */
    getHorizontal() {
        let h = 0;
        if (this.isActionPressed('MOVE_LEFT')) h -= 1;
        if (this.isActionPressed('MOVE_RIGHT')) h += 1;
        return h;
    }

    /**
     * Get vertical input (-1, 0, or 1)
     */
    getVertical() {
        let v = 0;
        if (this.isActionPressed('JUMP')) v -= 1;
        if (this.isActionPressed('MOVE_DOWN')) v += 1;
        return v;
    }

    /**
     * Get mouse position in screen space
     */
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Get mouse position in world space
     */
    getMouseWorldPosition() {
        return { x: this.mouse.worldX, y: this.mouse.worldY };
    }

    /**
     * Clear just-pressed/released states (call at end of frame)
     */
    update() {
        this.keysJustPressed.clear();
        this.keysJustReleased.clear();
        this.mouse.buttonsJustPressed.clear();
        this.mouse.buttonsJustReleased.clear();
        this.mouse.wheel = 0;
    }
}

// Export singleton
export const input = new InputManager();
export default input;
