/**
 * Web Worker for Image Processing
 * Handles CPU-intensive image processing in a separate thread
 */

// Worker code as a string to create a blob URL
const workerCode = `
/**
 * Photo to Emoji Converter - Web Worker
 * Processes image data in a separate thread to prevent UI freezing
 */

let state = {
    imageData: null,
    gridSize: 100,
    palette: [],
    chunkSize: 10
};

/**
 * Euclidean distance between two colors in RGB space
 * Returns a value between 0 and 441.67 (max distance)
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(
        Math.pow(r2 - r1, 2) +
        Math.pow(g2 - g1, 2) +
        Math.pow(b2 - b1, 2)
    );
}

/**
 * Find the closest matching emoji for a given color
 */
function findClosestEmoji(r, g, b, palette) {
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < palette.length; i++) {
        const emoji = palette[i];
        const distance = colorDistance(r, g, b, emoji.r, emoji.g, emoji.b);

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }

    return closestIndex;
}

/**
 * Get average color of a pixel region
 */
function getRegionColor(imageData, startX, startY, width, height, imgWidth) {
    let r = 0, g = 0, b = 0;
    let count = 0;

    for (let y = startY; y < startY + height && y < imageData.height; y++) {
        for (let x = startX; x < startX + width && x < imageData.width; x++) {
            const index = (y * imgWidth + x) * 4;
            r += imageData.data[index];
            g += imageData.data[index + 1];
            b += imageData.data[index + 2];
            count++;
        }
    }

    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
}

/**
 * Process image and convert to emoji matrix
 */
function processImage(imageData, gridSize, palette) {
    const width = imageData.width;
    const height = imageData.height;

    // Calculate cell size
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // Initialize emoji matrix
    const emojiMatrix = [];

    // Process each cell
    for (let row = 0; row < gridSize; row++) {
        const emojiRow = [];
        const startY = Math.floor(row * cellHeight);
        const endY = Math.min(Math.ceil((row + 1) * cellHeight), height);

        for (let col = 0; col < gridSize; col++) {
            const startX = Math.floor(col * cellWidth);
            const endX = Math.min(Math.ceil((col + 1) * cellWidth), width);

            // Get average color of this region
            const color = getRegionColor(
                imageData,
                startX,
                startY,
                endX - startX,
                endY - startY,
                width
            );

            // Find closest emoji
            const emojiIndex = findClosestEmoji(color.r, color.g, color.b, palette);
            emojiRow.push(emojiIndex);
        }

        emojiMatrix.push(emojiRow);

        // Send progress update
        const progress = ((row + 1) / gridSize) * 100;
        self.postMessage({
            type: 'progress',
            data: {
                percent: progress,
                message: \`Processing row \${row + 1} of \${gridSize}...\`
            }
        });
    }

    return emojiMatrix;
}

/**
 * Main message handler
 */
self.onmessage = function(e) {
    const { type, data } = e.data;

    switch (type) {
        case 'process':
            handleProcess(data);
            break;

        case 'cancel':
            handleCancel();
            break;

        default:
            self.postMessage({
                type: 'error',
                data: { error: 'Unknown message type: ' + type }
            });
    }
};

/**
 * Handle process request
 */
function handleProcess(data) {
    try {
        const { imageData, gridSize, palette } = data;

        // Validate inputs
        if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
            throw new Error('Invalid image data');
        }

        if (!palette || palette.length === 0) {
            throw new Error('Empty emoji palette');
        }

        if (gridSize < 10 || gridSize > 500) {
            throw new Error('Grid size must be between 10 and 500');
        }

        // Update state
        state.imageData = imageData;
        state.gridSize = gridSize;
        state.palette = palette;

        // Process image
        const emojiMatrix = processImage(imageData, gridSize, palette);

        // Send result
        self.postMessage({
            type: 'complete',
            data: { emojiMatrix }
        });

        // Clean up
        state.imageData = null;

    } catch (error) {
        self.postMessage({
            type: 'error',
            data: { error: error.message }
        });
    }
}

/**
 * Handle cancel request
 */
function handleCancel() {
    state.imageData = null;
    state.palette = [];
}
`;

/**
 * Create a Web Worker from inline code
 * @returns {Worker} The worker instance
 */
export function createWorker() {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
}

/**
 * Clean up blob URL when done
 */
export function cleanupWorker(worker) {
    if (worker) {
        worker.terminate();
    }
}
