/**
 * Upload Handler
 * Manages drag & drop and file selection for image upload
 */

/**
 * Initialize upload functionality
 * @param {Object} state - App state
 * @param {Object} elements - DOM elements
 */
export function initUpload(state, elements) {
    const uploadZone = elements.uploadZone;
    const fileInput = elements.fileInput;

    if (!uploadZone || !fileInput) {
        console.warn('Upload zone or file input not found');
        return;
    }

    // Click to browse
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0], state, elements);
        }
    });

    // Drag and drop events
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', (e) => handleDrop(e, state, elements));

    // Prevent default drag behavior on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    console.log('📤 Upload handler initialized');
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(e, state, elements) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0], state, elements);
    }
}

/**
 * Handle file selection
 * @param {File} file - Selected file
 * @param {Object} state - App state
 * @param {Object} elements - DOM elements
 */
function handleFile(file, state, elements) {
    // Validate file type
    if (!isValidImageType(file)) {
        alert('Please select a valid image file (JPG, PNG, or WebP).');
        return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        alert('File is too large. Please select an image smaller than 50MB.');
        return;
    }

    console.log(`📤 Processing file: ${file.name} (${formatFileSize(file.size)})`);

    // Read and process the image
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
            // Store original image
            state.originalImage = img;

            // Extract image data
            extractImageData(img, state, elements);
        };

        img.onerror = () => {
            alert('Failed to load the image. Please try a different file.');
        };

        img.src = e.target.result;
    };

    reader.onerror = () => {
        alert('Failed to read the file. Please try again.');
    };

    reader.readAsDataURL(file);
}

/**
 * Check if file is a valid image type
 * @param {File} file - File to check
 * @returns {boolean} True if valid image type
 */
function isValidImageType(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extract image data from loaded image
 * @param {HTMLImageElement} img - Loaded image
 * @param {Object} state - App state
 * @param {Object} elements - DOM elements
 */
function extractImageData(img, state, elements) {
    // Create offscreen canvas to extract image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate dimensions (max 4096px for memory safety)
    const maxSize = 4096;
    let width = img.width;
    let height = img.height;

    // Scale down if too large
    if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        console.log(`📤 Image scaled to ${width}x${height} for processing`);
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Get image data
    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        state.imageData = imageData;

        console.log(`✅ Image data extracted: ${width}x${height}, ${formatFileSize(imageData.data.length)}`);

        // Update UI
        showControls(elements);

        // Clear canvas to free memory
        ctx.clearRect(0, 0, width, height);
        canvas.width = 0;
        canvas.height = 0;

    } catch (error) {
        console.error('Failed to extract image data:', error);
        alert('Failed to process the image. Please try a different file.');
    }
}

/**
 * Show controls section after successful upload
 * @param {Object} elements - DOM elements
 */
function showControls(elements) {
    elements.uploadZone.classList.add('hidden');
    elements.controlsSection.classList.remove('hidden');
    elements.controlsSection.classList.add('animate-fade-in');
}

/**
 * Export upload functions
 */
export default {
    initUpload,
    isValidImageType,
    formatFileSize,
    extractImageData,
    showControls
};
