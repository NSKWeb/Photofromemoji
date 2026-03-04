/**
 * Export Functionality
 * Handles exporting emoji art in various formats: PNG, SVG, TXT
 */

import { renderForExport } from './renderer.js';

let exportState = {
    isExporting: false
};

// Store app reference for use in export functions
let appInstance = null;

/**
 * Initialize export controls
 * @param {Object} state - App state
 * @param {Object} elements - DOM elements
 * @param {Object} app - App instance
 */
export function initExport(state, elements, app) {
    const downloadPngBtn = document.getElementById('download-png');
    const downloadSvgBtn = document.getElementById('download-svg');
    const downloadTxtBtn = document.getElementById('download-txt');

    if (downloadPngBtn) {
        downloadPngBtn.addEventListener('click', () => exportAsPNG(state));
    }

    if (downloadSvgBtn) {
        downloadSvgBtn.addEventListener('click', () => exportAsSVG(state));
    }

    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => exportAsTXT(state));
    }
}

/**
 * Get export size in pixels based on resolution setting
 * @param {string} resolution - Resolution setting ('2K', '4K', '8K')
 * @returns {number} Size in pixels
 */
function getExportSize(resolution) {
    const sizes = {
        '2K': 2048,
        '4K': 4096,
        '8K': 8192
    };
    return sizes[resolution] || 4096;
}

/**
 * Export as PNG
 * @param {Object} state - App state
 */
async function exportAsPNG(state) {
    if (exportState.isExporting || !state.emojiMatrix) {
        return;
    }

    exportState.isExporting = true;
    const btn = document.getElementById('download-png');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Generating...</span>';

    try {
        const size = getExportSize(state.exportResolution);
        console.log(`Exporting PNG at ${size}px resolution...`);

        // Render at export size
        const canvas = renderForExport(size);

        // Convert to blob
        const blob = await new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emoji-art-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        URL.revokeObjectURL(url);
        console.log('PNG export complete');

    } catch (error) {
        console.error('PNG export error:', error);
        alert('Failed to export PNG: ' + error.message);
    } finally {
        exportState.isExporting = false;
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Export as SVG
 * @param {Object} state - App state
 */
async function exportAsSVG(state) {
    if (exportState.isExporting || !state.emojiMatrix) {
        return;
    }

    exportState.isExporting = true;
    const btn = document.getElementById('download-svg');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Generating...</span>';

    try {
        const palette = app.getEmojiPalette(state.emojiMode);
        const gridSize = state.gridSize;

        console.log('Generating SVG...');

        // Create SVG content
        let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 ${gridSize} ${gridSize}">
  <style>
    text {
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
      font-size: 1;
      text-anchor: middle;
      dominant-baseline: middle;
    }
  </style>
  <rect width="100%" height="100%" fill="#1a1a2e"/>
`;

        // Add emoji text elements
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const emojiIndex = state.emojiMatrix[row][col];
                const emoji = palette[emojiIndex];

                if (emoji) {
                    // SVG coordinates (center of cell)
                    const x = col + 0.5;
                    const y = row + 0.5;
                    svgContent += `  <text x="${x}" y="${y}">${emoji.emoji}</text>\n`;
                }
            }
        }

        svgContent += '</svg>';

        // Create blob
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emoji-art-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        URL.revokeObjectURL(url);
        console.log('SVG export complete');

    } catch (error) {
        console.error('SVG export error:', error);
        alert('Failed to export SVG: ' + error.message);
    } finally {
        exportState.isExporting = false;
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Export as TXT (copy to clipboard)
 * @param {Object} state - App state
 */
async function exportAsTXT(state) {
    if (!state.emojiMatrix) {
        return;
    }

    const btn = document.getElementById('download-txt');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Copying...</span>';

    try {
        const palette = app.getEmojiPalette(state.emojiMode);
        const gridSize = state.gridSize;

        // Build text matrix
        let textMatrix = '';
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const emojiIndex = state.emojiMatrix[row][col];
                const emoji = palette[emojiIndex];
                textMatrix += emoji ? emoji.emoji : ' ';
            }
            textMatrix += '\n';
        }

        // Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textMatrix);
            alert('Emoji art copied to clipboard! Paste it anywhere to share.');
        } else {
            // Fallback: create a download
            const blob = new Blob([textMatrix], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `emoji-art-${Date.now()}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Emoji art downloaded as text file.');
        }

        console.log('TXT export complete');

    } catch (error) {
        console.error('TXT export error:', error);
        alert('Failed to copy to clipboard: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Get export state
 */
export function getExportState() {
    return { ...exportState };
}

/**
 * Check if export is in progress
 */
export function isExporting() {
    return exportState.isExporting;
}

/**
 * Export functions
 */
export default {
    initExport,
    getExportState,
    isExporting
};
