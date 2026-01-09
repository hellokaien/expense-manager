// src/shared/utils.js

// Centralized API configuration
export const API_BASE_URL = 'http://localhost:3000';

// Centralized localStorage keys
export const STORAGE_KEYS = {
    USER: 'moneyflow_user',
    LOGGED_IN: 'moneyflow_logged_in',
    USER_ID: 'moneyflow_user_id',
    REMEMBER_ME: 'moneyflow_remember_me',
    SESSION_EXPIRY: 'moneyflow_session_expiry'
};

// Notification system (single source of truth)
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notificationToast');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (!notification || !notificationMessage) {
        console.warn('Notification elements not found');
        return;
    }
    
    notification.classList.remove('notification-slide-in', 'notification-slide-out');
    notificationMessage.textContent = message;
    
    const typeConfig = {
        success: {
            className: 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center',
            icon: 'fa-check-circle'
        },
        error: {
            className: 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center',
            icon: 'fa-exclamation-circle'
        },
        warning: {
            className: 'fixed top-4 right-4 z-50 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center',
            icon: 'fa-exclamation-triangle'
        },
        info: {
            className: 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center',
            icon: 'fa-info-circle'
        }
    };
    
    const config = typeConfig[type] || typeConfig.success;
    notification.className = config.className;
    notification.innerHTML = `<i class="fas ${config.icon} mr-3 text-xl"></i><span id="notificationMessage">${message}</span>`;
    
    notification.classList.remove('hidden');
    void notification.offsetWidth; // Force reflow
    notification.classList.add('notification-slide-in');
    
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('notification-slide-in');
        notification.classList.add('notification-slide-out');
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('notification-slide-out');
        }, 300);
    }, 3000);
}

// Helper to get initials
export function getInitials(firstName, lastName) {
    if (!firstName || !lastName) return 'MF';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

// Email validation
export function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
}