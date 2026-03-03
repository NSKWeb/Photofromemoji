/**
 * Ultra HD Photo to Emoji Converter - Main Application
 * Fully client-side application - no data leaves the browser
 */

// Import modules
import { initUpload } from './upload.js';
import { initRenderer } from './renderer.js';
import { initZoom } from './zoom.js';
import { initExport } from './export.js';
import { initMemoryManager } from './memory-manager.js';
import { createWorker } from './worker.js';
import { emojiData } from './emojis.js';

/**
 * Application State
 * All state is stored in memory and cleared on page refresh
 */
const state = {
    // Image data (never persisted)
    originalImage: null,
    imageData: null,
    
    // Processing settings
    gridSize: 100,
    emojiMode: 'full',
    exportResolution: '4K',
    
    // Processing results (never persisted)
    emojiMatrix: null,
    processed: false,
    
    // UI state
    zoom: 100,
    isProcessing: false,
    currentWorker: null
};

/**
 * DOM Elements Cache
 */
const elements = {};

/**
 * Initialize DOM elements cache
 */
function cacheElements() {
    elements.uploadZone = document.getElementById('upload-zone');
    elements.fileInput = document.getElementById('file-input');
    elements.controlsSection = document.getElementById('controls-section');
    elements.progressSection = document.getElementById('progress-section');
    elements.canvasSection = document.getElementById('canvas-section');
    elements.downloadSection = document.getElementById('download-section');
    elements.gridSizeInput = document.getElementById('grid-size');
    elements.gridSizeValue = document.getElementById('grid-size-value');
    elements.gridSizeValue2 = document.getElementById('grid-size-value-2');
    elements.emojiModeSelect = document.getElementById('emoji-mode');
    elements.exportResolutionSelect = document.getElementById('export-resolution');
    elements.exportWarning = document.getElementById('export-warning');
    elements.processBtn = document.getElementById('process-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.progressFill = document.getElementById('progress-fill');
    elements.progressText = document.getElementById('progress-text');
    elements.progressPercent = document.getElementById('progress-percent');
    elements.mainCanvas = document.getElementById('main-canvas');
    elements.canvasContainer = document.getElementById('canvas-container');
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Grid size control
    elements.gridSizeInput.addEventListener('input', (e) => {
        state.gridSize = parseInt(e.target.value);
        elements.gridSizeValue.textContent = state.gridSize;
        elements.gridSizeValue2.textContent = state.gridSize;
    });

    // Emoji mode select
    elements.emojiModeSelect.addEventListener('change', (e) => {
        state.emojiMode = e.target.value;
    });

    // Export resolution select
    elements.exportResolutionSelect.addEventListener('change', (e) => {
        state.exportResolution = e.target.value;
        // Show warning for 8K
        if (state.exportResolution === '8K') {
            elements.exportWarning.classList.remove('hidden');
        } else {
            elements.exportWarning.classList.add('hidden');
        }
    });

    // Process button
    elements.processBtn.addEventListener('click', handleProcess);

    // Reset button
    elements.resetBtn.addEventListener('click', handleReset);

    // Mobile ad close
    const mobileAdClose = document.getElementById('close-mobile-ad');
    if (mobileAdClose) {
        mobileAdClose.addEventListener('click', () => {
            document.querySelector('.ad-mobile-sticky').style.display = 'none';
        });
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
}

/**
 * Handle image processing
 */
async function handleProcess() {
    if (!state.imageData || state.isProcessing) {
        return;
    }

    state.isProcessing = true;
    state.processed = false;
    elements.processBtn.disabled = true;
    elements.processBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Processing...</span>';
    elements.progressSection.classList.remove('hidden');

    try {
        // Create worker for processing
        const worker = createWorker();
        state.currentWorker = worker;

        // Get emoji palette based on mode
        const palette = getEmojiPalette(state.emojiMode);

        // Send data to worker
        worker.postMessage({
            type: 'process',
            imageData: state.imageData,
            gridSize: state.gridSize,
            palette: palette
        });

        // Listen for progress updates
        worker.onmessage = (e) => {
            const { type, data } = e.data;

            switch (type) {
                case 'progress':
                    updateProgress(data.percent, data.message);
                    break;

                case 'complete':
                    handleProcessingComplete(data.emojiMatrix);
                    break;

                case 'error':
                    handleProcessingError(data.error);
                    break;
            }
        };

        worker.onerror = (e) => {
            handleProcessingError(e.message);
        };

    } catch (error) {
        handleProcessingError(error.message);
    }
}

/**
 * Get emoji palette based on mode
 */
function getEmojiPalette(mode) {
    switch (mode) {
        case 'faces':
            return emojiData.faces;
        case 'optimized':
            return emojiData.optimized;
        case 'full':
        default:
            return emojiData.full;
    }
}

/**
 * Update progress UI
 */
function updateProgress(percent, message) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = message;
    elements.progressPercent.textContent = `${Math.round(percent)}%`;
}

/**
 * Handle processing completion
 */
function handleProcessingComplete(emojiMatrix) {
    state.emojiMatrix = emojiMatrix;
    state.processed = true;
    state.isProcessing = false;

    // Update UI
    elements.processBtn.disabled = false;
    elements.processBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Convert to Emoji</span>';

    // Render canvas
    renderCanvas();

    // Show canvas and download sections
    elements.canvasSection.classList.remove('hidden');
    elements.canvasSection.classList.add('animate-fade-in');
    elements.downloadSection.classList.remove('hidden');
    elements.downloadSection.classList.add('animate-fade-in');

    // Clear progress after delay
    setTimeout(() => {
        elements.progressSection.classList.add('hidden');
        updateProgress(0, 'Ready');
    }, 1000);

    // Terminate worker
    if (state.currentWorker) {
        state.currentWorker.terminate();
        state.currentWorker = null;
    }
}

/**
 * Handle processing error
 */
function handleProcessingError(error) {
    state.isProcessing = false;
    elements.processBtn.disabled = false;
    elements.processBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Convert to Emoji</span>';
    updateProgress(0, 'Error');
    
    alert(`Processing error: ${error}`);
    
    setTimeout(() => {
        elements.progressSection.classList.add('hidden');
    }, 3000);
}

/**
 * Render the emoji canvas
 */
function renderCanvas() {
    if (!state.emojiMatrix) {
        return;
    }

    const palette = getEmojiPalette(state.emojiMode);
    initRenderer(elements.mainCanvas, state.emojiMatrix, palette, state.gridSize);
}

/**
 * Handle reset - clear all data and start over
 */
function handleReset() {
    // Terminate any running worker
    if (state.currentWorker) {
        state.currentWorker.terminate();
        state.currentWorker = null;
    }

    // Clear state
    state.originalImage = null;
    state.imageData = null;
    state.emojiMatrix = null;
    state.processed = false;
    state.isProcessing = false;
    state.zoom = 100;

    // Clear canvas
    const ctx = elements.mainCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.mainCanvas.width, elements.mainCanvas.height);

    // Hide sections
    elements.controlsSection.classList.add('hidden');
    elements.progressSection.classList.add('hidden');
    elements.canvasSection.classList.add('hidden');
    elements.downloadSection.classList.add('hidden');

    // Reset UI
    elements.uploadZone.classList.remove('hidden');
    elements.processBtn.disabled = false;
    elements.processBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Convert to Emoji</span>';
    updateProgress(0, 'Ready');

    // Reset file input
    elements.fileInput.value = '';
}

/**
 * Cleanup function - clear all data from memory
 */
function cleanup() {
    // Terminate worker
    if (state.currentWorker) {
        state.currentWorker.terminate();
        state.currentWorker = null;
    }

    // Clear image data
    if (state.imageData) {
        state.imageData = null;
    }

    // Clear original image
    if (state.originalImage) {
        state.originalImage = null;
    }

    // Clear emoji matrix
    if (state.emojiMatrix) {
        state.emojiMatrix = null;
    }

    // Clear canvas
    if (elements.mainCanvas) {
        const ctx = elements.mainCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.mainCanvas.width, elements.mainCanvas.height);
    }

    // Clear state
    Object.keys(state).forEach(key => {
        if (key !== 'gridSize' && key !== 'emojiMode' && key !== 'exportResolution') {
            state[key] = typeof state[key] === 'object' ? null : undefined;
        }
    });
}

/**
 * Get current state (for debugging)
 */
function getState() {
    return {
        ...state,
        hasImageData: !!state.imageData,
        hasEmojiMatrix: !!state.emojiMatrix,
        isProcessing: state.isProcessing,
        processed: state.processed
    };
}

/**
 * Expose API for other modules
 */
const app = {
    getState,
    getEmojiPalette,
    renderCanvas,
    cleanup
};

// Export for other modules
export { state, elements, app };

/**
 * Initialize application when DOM is ready
 */
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

/**
 * Initialize all app components
 */
function initApp() {
    console.log('🎨 Ultra HD Photo to Emoji Converter initializing...');
    
    // Cache DOM elements
    cacheElements();

    // Initialize components
    initUpload(state, elements);
    initZoom(state, elements, app);
    initExport(state, elements, app);
    initMemoryManager();

    // Initialize event listeners
    initEventListeners();

    console.log('✅ Application ready');
    console.log('🔒 Privacy: All processing is client-side. No data is stored or uploaded.');
}

// Start the application
init();

// Export app for debugging (only in development)
if (typeof window !== 'undefined') {
    window.emojiApp = app;
}
