/**
 * Zoom and Pan Controls
 * Handles user interactions for zooming and panning the canvas
 */

let zoomState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    minScale: 0.5,
    maxScale: 8,
    container: null,
    canvas: null
};

/**
 * Initialize zoom controls
 * @param {Object} state - App state
 * @param {Object} elements - DOM elements
 * @param {Object} app - App instance
 */
export function initZoom(state, elements, app) {
    const container = elements.canvasContainer;
    const canvas = elements.mainCanvas;

    if (!container || !canvas) {
        console.warn('Canvas container or canvas not found');
        return;
    }

    zoomState.container = container;
    zoomState.canvas = canvas;

    // Initialize zoom buttons
    initZoomButtons(elements);

    // Initialize mouse events
    initMouseEvents(container, canvas);

    // Initialize touch events
    initTouchEvents(container, canvas);

    // Initialize preview zoom slider
    initPreviewZoom(elements);
}

/**
 * Initialize zoom button controls
 */
function initZoomButtons(elements) {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');
    const indicator = document.getElementById('zoom-indicator');

    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            zoom(zoomState.scale * 1.25, indicator);
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            zoom(zoomState.scale / 1.25, indicator);
        });
    }

    if (zoomReset) {
        zoomReset.addEventListener('click', () => {
            resetZoom(indicator);
        });
    }
}

/**
 * Initialize preview zoom slider
 */
function initPreviewZoom(elements) {
    const slider = document.getElementById('preview-zoom');
    const valueDisplay = document.getElementById('zoom-level-value');

    if (slider) {
        slider.addEventListener('input', (e) => {
            const zoomLevel = parseInt(e.target.value) / 100;
            zoomState.scale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, zoomLevel));

            if (valueDisplay) {
                valueDisplay.textContent = `${Math.round(zoomState.scale * 100)}%`;
            }

            applyTransform();
        });
    }
}

/**
 * Initialize mouse events for zoom and pan
 */
function initMouseEvents(container, canvas) {
    // Mouse wheel zoom
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Mouse down - start drag
    canvas.addEventListener('mousedown', handleMouseDown);

    // Mouse move - drag
    container.addEventListener('mousemove', handleMouseMove);

    // Mouse up - end drag
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    // Double click to reset
    canvas.addEventListener('dblclick', () => {
        resetZoom(document.getElementById('zoom-indicator'));
    });
}

/**
 * Initialize touch events for pinch zoom and pan
 */
function initTouchEvents(container, canvas) {
    let initialDistance = 0;
    let initialScale = 1;

    // Touch start
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Single touch - start drag
            zoomState.isDragging = true;
            zoomState.lastMouseX = e.touches[0].clientX;
            zoomState.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Pinch zoom - calculate initial distance
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialDistance = Math.sqrt(dx * dx + dy * dy);
            initialScale = zoomState.scale;
        }
    }, { passive: true });

    // Touch move
    container.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling

        if (e.touches.length === 1 && zoomState.isDragging) {
            // Single touch - drag
            const dx = e.touches[0].clientX - zoomState.lastMouseX;
            const dy = e.touches[0].clientY - zoomState.lastMouseY;

            zoomState.translateX += dx;
            zoomState.translateY += dy;

            zoomState.lastMouseX = e.touches[0].clientX;
            zoomState.lastMouseY = e.touches[0].clientY;

            applyTransform();
        } else if (e.touches.length === 2 && initialDistance > 0) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const scale = (distance / initialDistance) * initialScale;
            zoomState.scale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, scale));

            updateZoomIndicator();
            applyTransform();
        }
    }, { passive: false });

    // Touch end
    container.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            zoomState.isDragging = false;
            initialDistance = 0;
        }
    });

    // Touch cancel
    container.addEventListener('touchcancel', () => {
        zoomState.isDragging = false;
        initialDistance = 0;
    });
}

/**
 * Handle mouse wheel zoom
 */
function handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = zoomState.scale * delta;

    zoom(newScale, document.getElementById('zoom-indicator'));
}

/**
 * Handle mouse down
 */
function handleMouseDown(e) {
    zoomState.isDragging = true;
    zoomState.lastMouseX = e.clientX;
    zoomState.lastMouseY = e.clientY;
}

/**
 * Handle mouse move (drag)
 */
function handleMouseMove(e) {
    if (!zoomState.isDragging) return;

    const dx = e.clientX - zoomState.lastMouseX;
    const dy = e.clientY - zoomState.lastMouseY;

    zoomState.translateX += dx;
    zoomState.translateY += dy;

    zoomState.lastMouseX = e.clientX;
    zoomState.lastMouseY = e.clientY;

    applyTransform();
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
    zoomState.isDragging = false;
}

/**
 * Zoom to specific scale
 * @param {number} scale - New scale value
 * @param {HTMLElement} indicator - Optional indicator element to update
 */
function zoom(scale, indicator) {
    zoomState.scale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, scale));

    if (indicator) {
        indicator.textContent = `${Math.round(zoomState.scale * 100)}%`;
    }

    applyTransform();
}

/**
 * Reset zoom to default
 * @param {HTMLElement} indicator - Optional indicator element to update
 */
function resetZoom(indicator) {
    zoomState.scale = 1;
    zoomState.translateX = 0;
    zoomState.translateY = 0;

    if (indicator) {
        indicator.textContent = '100%';
    }

    applyTransform();
}

/**
 * Apply transform to canvas
 */
function applyTransform() {
    if (!zoomState.canvas) return;

    zoomState.canvas.style.transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
    zoomState.canvas.style.transformOrigin = 'center center';
}

/**
 * Update zoom indicator
 */
function updateZoomIndicator() {
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) {
        indicator.textContent = `${Math.round(zoomState.scale * 100)}%`;
    }

    // Also update preview zoom slider if it exists
    const slider = document.getElementById('preview-zoom');
    const valueDisplay = document.getElementById('zoom-level-value');
    if (slider && valueDisplay) {
        const sliderValue = Math.round(zoomState.scale * 100);
        slider.value = Math.max(50, Math.min(400, sliderValue));
        valueDisplay.textContent = `${sliderValue}%`;
    }
}

/**
 * Get current zoom state
 */
export function getZoomState() {
    return {
        scale: zoomState.scale,
        translateX: zoomState.translateX,
        translateY: zoomState.translateY
    };
}

/**
 * Reset zoom from external call
 */
export function resetZoomExternal() {
    resetZoom(document.getElementById('zoom-indicator'));
}

/**
 * Set zoom level from external call
 */
export function setZoomLevel(scale) {
    zoom(scale, document.getElementById('zoom-indicator'));
}

/**
 * Export zoom functions
 */
export default {
    initZoom,
    getZoomState,
    resetZoomExternal,
    setZoomLevel
};
