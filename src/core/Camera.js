/**
 * Camera System
 * Handles viewport positioning and smooth following
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './Constants.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;

        this.target = null;
        this.followSpeed = 0.1;
        this.deadzone = { x: 50, y: 30 };

        // Shake effect
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = { x: 0, y: 0 };

        // Bounds
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: WORLD_WIDTH * TILE_SIZE - this.width,
            maxY: WORLD_HEIGHT * TILE_SIZE - this.height,
        };
    }

    /**
     * Set the entity for the camera to follow
     */
    follow(entity) {
        this.target = entity;
    }

    /**
     * Update camera position
     */
    update(deltaTime) {
        if (this.target) {
            // Calculate target camera position (center on target)
            const targetX = this.target.x + this.target.width / 2 - this.width / 2;
            const targetY = this.target.y + this.target.height / 2 - this.height / 2;

            // Smooth follow with deadzone
            const dx = targetX - this.x;
            const dy = targetY - this.y;

            if (Math.abs(dx) > this.deadzone.x) {
                this.x += (dx - Math.sign(dx) * this.deadzone.x) * this.followSpeed;
            }
            if (Math.abs(dy) > this.deadzone.y) {
                this.y += (dy - Math.sign(dy) * this.deadzone.y) * this.followSpeed;
            }
        }

        // Apply bounds
        this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
        this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));

        // Update shake
        this.updateShake(deltaTime);
    }

    /**
     * Update screen shake effect
     */
    updateShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeOffset.x = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() - 0.5) * 2 * this.shakeIntensity;

            // Decay intensity
            this.shakeIntensity *= 0.95;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
    }

    /**
     * Trigger screen shake
     */
    shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    /**
     * Get camera position with shake offset
     */
    getRenderPosition() {
        return {
            x: Math.floor(this.x + this.shakeOffset.x),
            y: Math.floor(this.y + this.shakeOffset.y),
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y,
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y,
        };
    }

    /**
     * Check if a world rectangle is visible in the camera
     */
    isVisible(x, y, width, height) {
        return x + width > this.x &&
               x < this.x + this.width &&
               y + height > this.y &&
               y < this.y + this.height;
    }

    /**
     * Get visible tile range
     */
    getVisibleTileRange() {
        const startX = Math.floor(this.x / TILE_SIZE) - 1;
        const startY = Math.floor(this.y / TILE_SIZE) - 1;
        const endX = Math.ceil((this.x + this.width) / TILE_SIZE) + 1;
        const endY = Math.ceil((this.y + this.height) / TILE_SIZE) + 1;

        return { startX, startY, endX, endY };
    }
}

export default Camera;
