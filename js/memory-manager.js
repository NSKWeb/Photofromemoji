/**
 * Memory Manager
 * Monitors memory usage and performs cleanup
 */

let memoryState = {
    imageCount: 0,
    lastCleanup: Date.now(),
    isMonitoring: false
};

/**
 * Initialize memory manager
 */
export function initMemoryManager() {
    if (memoryState.isMonitoring) {
        return;
    }

    memoryState.isMonitoring = true;

    // Monitor memory pressure
    startMemoryMonitoring();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Cleanup on page hide (mobile)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    console.log('🧠 Memory manager initialized');
}

/**
 * Start monitoring memory usage
 */
function startMemoryMonitoring() {
    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);

    // Initial check
    checkMemory();
}

/**
 * Check current memory usage
 */
function checkMemory() {
    // Check if performance.memory is available (Chrome)
    if (performance.memory) {
        const { usedJSHeapSize, jsHeapSizeLimit, totalJSHeapSize } = performance.memory;
        const usedMB = Math.round(usedJSHeapSize / 1048576);
        const limitMB = Math.round(jsHeapSizeLimit / 1048576);
        const usagePercent = ((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(1);

        console.log(`🧠 Memory: ${usedMB}MB / ${limitMB}MB (${usagePercent}%)`);

        // Warn if memory usage is high
        if (usagePercent > 80) {
            console.warn('⚠️ High memory usage detected!');
            suggestCleanup();
        }
    }
}

/**
 * Handle visibility change
 */
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // Page is hidden, consider cleanup
        console.log('🧠 Page hidden, performing light cleanup...');
        performLightCleanup();
    }
}

/**
 * Suggest cleanup to user
 */
function suggestCleanup() {
    // Check if there's an image loaded
    const hasImage = document.querySelector('#main-canvas').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0;

    if (hasImage) {
        console.log('💡 Tip: Click "New Image" to free up memory');
    }
}

/**
 * Perform light cleanup
 */
function performLightCleanup() {
    // Clear any cached data
    if (typeof caches !== 'undefined') {
        caches.keys().then(names => {
            names.forEach(name => {
                // Don't clear our own caches
                if (!name.includes('emoji-app')) {
                    caches.delete(name);
                }
            });
        });
    }

    memoryState.lastCleanup = Date.now();
}

/**
 * Full cleanup - call before page unload
 */
export function cleanup() {
    console.log('🧠 Performing memory cleanup...');

    // Clear all canvases
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
    });

    // Clear any stored image data
    const state = window.emojiApp?.getState();
    if (state && state.hasImageData) {
        // State cleanup is handled by main.js
        console.log('🧠 Image data cleared');
    }

    // Force garbage collection hint (Chrome)
    if (window.gc) {
        console.log('🧠 Forcing garbage collection...');
        window.gc();
    }

    memoryState.lastCleanup = Date.now();
    console.log('🧠 Cleanup complete');
}

/**
 * Get memory usage info
 */
export function getMemoryInfo() {
    const info = {
        timestamp: Date.now(),
        lastCleanup: memoryState.lastCleanup,
        imageCount: memoryState.imageCount
    };

    // Add performance.memory if available
    if (performance.memory) {
        info.memory = {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
            total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
        };
        info.memory.usagePercent = ((info.memory.used / info.memory.limit) * 100).toFixed(1);
    }

    return info;
}

/**
 * Check if device has enough memory for operation
 * @param {string} operation - Operation type ('process', 'export')
 * @param {number} gridSize - Grid size
 * @returns {boolean} True if device has enough memory
 */
export function checkAvailableMemory(operation, gridSize) {
    // Check performance.memory (Chrome only)
    if (performance.memory) {
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

        // Calculate estimated memory needed
        let neededMB = 0;

        if (operation === 'process') {
            // Processing: estimate based on grid size
            neededMB = (gridSize * gridSize * 8) / 1048576; // Rough estimate
        } else if (operation === 'export') {
            // Export: 8K needs more memory
            neededMB = 500; // Conservative estimate for 8K export
        }

        const availableMB = (jsHeapSizeLimit - usedJSHeapSize) / 1048576;

        if (availableMB < neededMB) {
            console.warn(`⚠️ Not enough memory for ${operation}: need ${neededMB}MB, have ${availableMB}MB`);
            return false;
        }
    }

    return true;
}

/**
 * Register an image load
 */
export function registerImageLoad() {
    memoryState.imageCount++;
    console.log(`🧠 Image loaded. Total images this session: ${memoryState.imageCount}`);
}

/**
 * Register an image unload
 */
export function registerImageUnload() {
    if (memoryState.imageCount > 0) {
        memoryState.imageCount--;
        console.log(`🧠 Image unloaded. Total images this session: ${memoryState.imageCount}`);
    }
}

/**
 * Export memory manager functions
 */
export default {
    initMemoryManager,
    cleanup,
    getMemoryInfo,
    checkAvailableMemory,
    registerImageLoad,
    registerImageUnload
};
