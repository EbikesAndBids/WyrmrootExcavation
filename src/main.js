/**
 * Wyrmroot Excavation
 * Main Entry Point
 *
 * A mining game where you excavate the fossilized remains of ancient dragons.
 * Follow the glowing capillaries deep into the earth to find the Dragon Roots.
 */

import { Game } from './core/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=================================');
    console.log('  WYRMROOT EXCAVATION');
    console.log('  v0.1.0 - Development Build');
    console.log('=================================');

    // Create and initialize the game
    const game = new Game();

    try {
        await game.init();
        game.run();
    } catch (error) {
        console.error('Failed to initialize game:', error);

        // Show error to user
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = `
                <h1 style="color: #ff4444;">Error</h1>
                <p>Failed to initialize game.</p>
                <p style="font-size: 12px; color: #666;">${error.message}</p>
            `;
        }
    }
});

// Prevent context menu on right click
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Game paused (tab hidden)');
    } else {
        console.log('Game resumed');
    }
});
