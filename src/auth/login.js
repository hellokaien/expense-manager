import authManager from '../auth/auth.js';
import { showNotification, API_BASE_URL } from '../shared/utils.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const forgotPasswordBtn = document.getElementById('forgotPassword');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const closeForgotModalBtn = document.getElementById('closeForgotModal');
const cancelForgotBtn = document.getElementById('cancelForgot');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const notificationToast = document.getElementById('notificationToast');
const notificationMessage = document.getElementById('notificationMessage');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    authManager.checkAuthStatus().then(isAuthenticated => {
        if (isAuthenticated) {
            window.location.href = '../dashboard/dashboard.html';
        }
    });
    
    setupEventListeners();
});

function setupEventListeners() {
    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>' : '<i class="fas fa-eye-slash text-gray-400 hover:text-gray-600"></i>';
    });

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Simple validation
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Demo account check (for backward compatibility)
        if (email === 'demo@moneyflow.com' && password === 'demo123') {
            handleDemoLogin(email, rememberMe);
            return;
        }
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
        submitBtn.disabled = true;
        
        try {
            // Check credentials against JSON Server
            const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
            const users = await response.json();
            
            if (users.length === 0) {
                throw new Error('No account found with this email');
            }
            
            const user = users[0];
            
            // Check password (in production, you should use proper hashing)
            // Note: The signup page encodes password with btoa(), so we compare the same way
            const encodedPassword = btoa(password);
            
            if (user.password !== encodedPassword) {
                throw new Error('Invalid password');
            }
            
            // Update last login
            await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lastLogin: new Date().toISOString()
                })
            });
            
            // Store user data in localStorage FIRST
            localStorage.setItem('moneyflow_user', JSON.stringify({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                accountId: user.accountId,
                initials: user.initials || getInitials(user.firstName, user.lastName),
                premiumTrial: user.premiumTrial,
                currency: user.currency || 'USD',
                country: user.country || 'US',
                avatar: user.avatar || null
            }));
            
            // Set login flag SECOND
            localStorage.setItem('moneyflow_logged_in', 'true');
            localStorage.setItem('moneyflow_user_id', user.id);
            
            // If remember me is checked, store for 30 days
            if (rememberMe) {
                localStorage.setItem('moneyflow_remember_me', 'true');
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 30);
                localStorage.setItem('moneyflow_session_expiry', expirationDate.toISOString());
            } else {
                localStorage.removeItem('moneyflow_remember_me');
                localStorage.removeItem('moneyflow_session_expiry');
            }
            
            // Force localStorage to persist
            localStorageSync();
            
            // Show success message
            showNotification(`Welcome back, ${user.firstName}!`, 'success');
            
            // Add a small delay to ensure localStorage is saved
            setTimeout(() => {
                // Redirect to dashboard
                window.location.href = '../dashboard/dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Forgot password modal
    forgotPasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        forgotPasswordModal.classList.remove('hidden');
    });

    closeForgotModalBtn.addEventListener('click', closeForgotModal);
    cancelForgotBtn.addEventListener('click', closeForgotModal);

    // Close modal when clicking outside
    forgotPasswordModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeForgotModal();
        }
    });

    // Forgot password form submission
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            showNotification('Please enter your email address', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
        submitBtn.disabled = true;
        
        try {
            // Check if email exists
            const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
            const users = await response.json();
            
            if (users.length === 0) {
                throw new Error('No account found with this email');
            }
            
            // In a real app, you would send a reset email
            // For demo purposes, we'll simulate it
            showNotification('Password reset link sent to your email! Check your inbox.', 'success');
            closeForgotModal();
            
        } catch (error) {
            console.error('Password reset error:', error);
            showNotification(error.message || 'Failed to send reset link', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Google login button
    document.querySelector('.btn-google i.fa-google').closest('button').addEventListener('click', function() {
        showNotification('Google login would be implemented here', 'info');
    });

    // Apple login button
    document.querySelector('.btn-google i.fa-apple').closest('button').addEventListener('click', function() {
        showNotification('Apple login would be implemented here', 'info');
    });
}

// Helper function for demo login (for backward compatibility)
function handleDemoLogin(email, rememberMe) {
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Signing in...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Create demo user data
        const demoUser = {
            id: 'demo-user-001',
            firstName: 'Demo',
            lastName: 'User',
            email: email,
            accountId: 'MFDEMO001',
            initials: 'DU',
            premiumTrial: true,
            currency: 'USD',
            country: 'US'
        };
        
        // Store in localStorage
        localStorage.setItem('moneyflow_user', JSON.stringify(demoUser));
        localStorage.setItem('moneyflow_logged_in', 'true');
        localStorage.setItem('moneyflow_user_id', demoUser.id);
        
        // If remember me is checked, store for 30 days
        if (rememberMe) {
            localStorage.setItem('moneyflow_remember_me', 'true');
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            localStorage.setItem('moneyflow_session_expiry', expirationDate.toISOString());
        } else {
            localStorage.removeItem('moneyflow_remember_me');
            localStorage.removeItem('moneyflow_session_expiry');
        }
        
        // Force localStorage to persist
        localStorageSync();
        
        showNotification('Demo login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1500);
    }, 1500);
}

function closeForgotModal() {
    forgotPasswordModal.classList.add('hidden');
    forgotPasswordForm.reset();
}

function getInitials(firstName, lastName) {
    if (!firstName || !lastName) return 'MF';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

// Helper function to ensure localStorage is saved
function localStorageSync() {
    // Force localStorage to sync
    const dummyKey = 'moneyflow_sync_' + Date.now();
    localStorage.setItem(dummyKey, 'sync');
    localStorage.removeItem(dummyKey);
}

function showNotification2(message, type = 'success') {
    notificationMessage.textContent = message;
    
    // Set color based on type
    if (type === 'success') {
        notificationToast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
        notificationToast.innerHTML = '<i class="fas fa-check-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
    } else if (type === 'error') {
        notificationToast.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
        notificationToast.innerHTML = '<i class="fas fa-exclamation-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
    } else if (type === 'info') {
        notificationToast.className = 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
        notificationToast.innerHTML = '<i class="fas fa-info-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
    }
    
    // Show notification
    notificationToast.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notificationToast.classList.add('hidden');
    }, 3000);
}