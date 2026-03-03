/**
 * Canvas Renderer - Handles rendering emoji art to canvas
 * Supports both preview and high-res export rendering
 */

let renderState = {
    canvas: null,
    ctx: null,
    emojiMatrix: null,
    palette: null,
    gridSize: 0,
    fontSize: 16
};

/**
 * Initialize renderer with canvas and data
 * @param {HTMLCanvasElement} canvas - Canvas element to render to
 * @param {Array} emojiMatrix - 2D array of emoji indices
 * @param {Array} palette - Emoji palette
 * @param {number} gridSize - Grid dimensions (gridSize x gridSize)
 */
export function initRenderer(canvas, emojiMatrix, palette, gridSize) {
    renderState.canvas = canvas;
    renderState.ctx = canvas.getContext('2d');
    renderState.emojiMatrix = emojiMatrix;
    renderState.palette = palette;
    renderState.gridSize = gridSize;

    // Set initial canvas size
    setCanvasSize(canvas, 800);

    // Initial render
    render();

    return renderState;
}

/**
 * Set canvas size for rendering
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} size - Size in pixels (square)
 */
export function setCanvasSize(canvas, size) {
    // Get device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;

    // Set display size
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // Set actual size (scaled for retina displays)
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    // Scale context
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    renderState.fontSize = size / renderState.gridSize;
}

/**
 * Render emoji matrix to canvas
 */
export function render() {
    if (!renderState.ctx || !renderState.emojiMatrix || !renderState.palette) {
        return;
    }

    const { ctx, canvas, emojiMatrix, palette, gridSize, fontSize } = renderState;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate cell size
    const cellSize = canvas.width / (window.devicePixelRatio || 1) / gridSize;

    // Render each emoji
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const emojiIndex = emojiMatrix[row][col];
            const emoji = palette[emojiIndex];

            if (emoji) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;

                ctx.fillText(emoji.emoji, x, y);
            }
        }
    }
}

/**
 * Render to a specific size (for export)
 * @param {number} size - Export size in pixels
 * @returns {HTMLCanvasElement} The rendered canvas
 */
export function renderForExport(size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Calculate font size
    const fontSize = size / renderState.gridSize;

    // Set font
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate cell size
    const cellSize = size / renderState.gridSize;

    // Render each emoji
    for (let row = 0; row < renderState.gridSize; row++) {
        for (let col = 0; col < renderState.gridSize; col++) {
            const emojiIndex = renderState.emojiMatrix[row][col];
            const emoji = renderState.palette[emojiIndex];

            if (emoji) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;

                ctx.fillText(emoji.emoji, x, y);
            }
        }
    }

    return canvas;
}

/**
 * Progressive rendering - render row by row
 * Useful for large grids to show progress
 */
export function renderProgressive(onProgress) {
    if (!renderState.ctx || !renderState.emojiMatrix || !renderState.palette) {
        return;
    }

    const { ctx, canvas, emojiMatrix, palette, gridSize, fontSize } = renderState;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate cell size
    const cellSize = canvas.width / (window.devicePixelRatio || 1) / gridSize;

    let row = 0;

    function renderNextRow() {
        if (row >= gridSize) {
            if (onProgress) onProgress(100);
            return;
        }

        // Render this row
        for (let col = 0; col < gridSize; col++) {
            const emojiIndex = emojiMatrix[row][col];
            const emoji = palette[emojiIndex];

            if (emoji) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;

                ctx.fillText(emoji.emoji, x, y);
            }
        }

        row++;

        // Report progress
        const progress = (row / gridSize) * 100;
        if (onProgress) onProgress(progress);

        // Schedule next row
        if (row < gridSize) {
            requestAnimationFrame(renderNextRow);
        }
    }

    // Start rendering
    renderNextRow();
}

/**
 * Clear the canvas
 */
export function clearCanvas() {
    if (renderState.ctx && renderState.canvas) {
        renderState.ctx.clearRect(0, 0, renderState.canvas.width, renderState.canvas.height);
    }
}

/**
 * Get current render state
 */
export function getRenderState() {
    return {
        ...renderState,
        canvas: null, // Don't expose canvas reference
        ctx: null, // Don't expose context reference
        hasMatrix: !!renderState.emojiMatrix,
        matrixSize: renderState.emojiMatrix ? renderState.emojiMatrix.length : 0,
        paletteSize: renderState.palette ? renderState.palette.length : 0
    };
}

/**
 * Export rendering functions
 */
export default {
    initRenderer,
    setCanvasSize,
    render,
    renderForExport,
    renderProgressive,
    clearCanvas,
    getRenderState
};
