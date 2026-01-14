// src/shared/imageStorage.js
// Utility for storing and retrieving user profile images
// Images are stored as base64 in db.json via JSON Server API

// Save image to db.json via API
// Note: The actual saving to db.json happens through apiService.updateUser()
// This function just ensures the data is ready and provides a cache
export async function saveUserAvatar(userId, imageData) {
    try {
        // Store in localStorage as cache for quick access
        // The actual persistent storage is in db.json via the API
        localStorage.setItem(`avatar_${userId}`, imageData);
        return true;
    } catch (error) {
        console.error('Error caching avatar:', error);
        return false;
    }
}

// Get image from user object (from db.json) or cache
// Priority: 1. user.avatar (from db.json), 2. localStorage cache
export async function getUserAvatar(userId, userObject = null) {
    // First priority: Check user object from db.json (via API)
    if (userObject && userObject.avatar) {
        // Cache it for faster access next time
        localStorage.setItem(`avatar_${userId}`, userObject.avatar);
        return userObject.avatar;
    }
    
    // Second priority: Check localStorage cache (fallback)
    const cachedData = localStorage.getItem(`avatar_${userId}`);
    if (cachedData) {
        return cachedData;
    }
    
    return null;
}

// Delete user avatar
export async function deleteUserAvatar(userId) {
    // Remove from cache
    localStorage.removeItem(`avatar_${userId}`);
    return true;
}

// Convert file to base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Validate image file
export function validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' };
    }
    
    if (file.size > maxSize) {
        return { valid: false, error: 'File size too large. Maximum size is 5MB.' };
    }
    
    return { valid: true };
}

