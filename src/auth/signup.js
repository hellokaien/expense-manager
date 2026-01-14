import authManager from '../auth/auth.js';
import { showNotification, API_BASE_URL } from '../shared/utils.js';
import { saveUserAvatar, fileToBase64, validateImageFile } from '../shared/imageStorage.js';
import apiService from '../shared/apiService.js';

// DOM Elements
const signupForm = document.getElementById('signupForm');
const toggleSignupPasswordBtn = document.getElementById('toggleSignupPassword');
const signupPasswordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordMatchDiv = document.getElementById('passwordMatch');
const passwordStrengthMeter = document.getElementById('passwordStrength');
const strengthText = document.getElementById('strengthText');
const avatarUpload = document.getElementById('avatarUpload');
const avatarPreview = document.getElementById('avatarPreview');
const notificationToast = document.getElementById('notificationToast');
const notificationMessage = document.getElementById('notificationMessage');
const welcomeModal = document.getElementById('welcomeModal');
const goToDashboardBtn = document.getElementById('goToDashboard');

// Step navigation elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const nextToStep2Btn = document.getElementById('nextToStep2');
const nextToStep3Btn = document.getElementById('nextToStep3');
const backToStep1Btn = document.getElementById('backToStep1');
const backToStep2Btn = document.getElementById('backToStep2');
const createAccountBtn = document.getElementById('createAccountBtn');

// Step indicators
const step1Indicator = document.querySelector('.step-indicator:first-child');
const step2Indicator = document.querySelectorAll('.step-indicator')[1];
const step3Indicator = document.querySelectorAll('.step-indicator')[2];

// Current step
let currentStep = 1;

// User data object to collect all form data
let userData = {
    account: {},
    profile: {},
    preferences: {}
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    authManager.checkAuthStatus().then(isAuthenticated => {
        if (isAuthenticated) {
            window.location.href = '../dashboard/dashboard.html';
        }
    });
    setupEventListeners();
    updateAvatarPreview();
});

function setupEventListeners() {
    // Toggle password visibility
    toggleSignupPasswordBtn.addEventListener('click', function() {
        const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        signupPasswordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>' : '<i class="fas fa-eye-slash text-gray-400 hover:text-gray-600"></i>';
    });
    
    // Check password strength
    signupPasswordInput.addEventListener('input', checkPasswordStrength);
    
    // Check password match
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    
    // Avatar upload
    avatarUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file
            const validation = validateImageFile(file);
            if (!validation.valid) {
                showNotification(validation.error, 'error');
                e.target.value = ''; // Reset file input
                return;
            }
            
            try {
                // Convert to base64
                const base64Data = await fileToBase64(file);
                
                // Create a circular image preview
                avatarPreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = base64Data;
                img.classList.add('w-full', 'h-full', 'rounded-full', 'object-cover');
                avatarPreview.appendChild(img);
                
                // Store base64 image data
                userData.profile.avatar = base64Data;
            } catch (error) {
                console.error('Error processing image:', error);
                showNotification('Failed to process image. Please try again.', 'error');
                e.target.value = ''; // Reset file input
            }
        }
    });
    
    // Step navigation
    nextToStep2Btn.addEventListener('click', validateStep1);
    nextToStep3Btn.addEventListener('click', validateStep2);
    backToStep1Btn.addEventListener('click', () => goToStep(1));
    backToStep2Btn.addEventListener('click', () => goToStep(2));
    
    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await createAccount();
    });
    
    // Go to dashboard button
    goToDashboardBtn.addEventListener('click', function() {
        // Redirect to dashboard
        window.location.href = '../dashboard/dashboard.html';
    });
    
    // Google signup button
    document.querySelector('.btn-google i.fa-google').closest('button').addEventListener('click', function() {
        showNotification('Google signup would be implemented here', 'info');
    });
    
    // Apple signup button
    document.querySelector('.btn-google i.fa-apple').closest('button').addEventListener('click', function() {
        showNotification('Apple signup would be implemented here', 'info');
    });
}

function validateStep1() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Basic validation
    if (!firstName || !lastName) {
        showNotification('Please enter your first and last name', 'error');
        return;
    }
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Please create a password', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (!terms) {
        showNotification('Please agree to the terms and privacy policy', 'error');
        return;
    }
    
    // Store account data
    userData.account = {
        firstName,
        lastName,
        email,
        password: password, // Store plain password - authManager will encode it
        termsAccepted: terms
    };
    
    // Update avatar preview with initials
    updateAvatarPreview();
    
    // Go to step 2
    goToStep(2);
}

function validateStep2() {
    const phone = document.getElementById('phone').value;
    const country = document.getElementById('country').value;
    const currency = document.getElementById('currency').value;
    
    // Store profile data
    userData.profile = {
        ...userData.profile, // Keep avatar if uploaded
        phone,
        country,
        currency,
        initials: getInitials()
    };
    
    goToStep(3);
}

function goToStep(step) {
    // Hide all steps
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    
    // Show current step
    if (step === 1) {
        step1.classList.add('active');
        // Reset step indicators
        step1Indicator.className = 'step-indicator step-completed';
        step1Indicator.innerHTML = '<i class="fas fa-check"></i>';
        
        step2Indicator.className = 'step-indicator step-inactive';
        step2Indicator.innerHTML = '2';
        
        step3Indicator.className = 'step-indicator step-inactive';
        step3Indicator.innerHTML = '3';
    } else if (step === 2) {
        step2.classList.add('active');
        // Update step indicators
        step1Indicator.className = 'step-indicator step-completed';
        step1Indicator.innerHTML = '<i class="fas fa-check"></i>';
        
        step2Indicator.className = 'step-indicator step-active';
        step2Indicator.innerHTML = '2';
        
        step3Indicator.className = 'step-indicator step-inactive';
        step3Indicator.innerHTML = '3';
    } else if (step === 3) {
        step3.classList.add('active');
        // Update step indicators
        step1Indicator.className = 'step-indicator step-completed';
        step1Indicator.innerHTML = '<i class="fas fa-check"></i>';
        
        step2Indicator.className = 'step-indicator step-completed';
        step2Indicator.innerHTML = '<i class="fas fa-check"></i>';
        
        step3Indicator.className = 'step-indicator step-active';
        step3Indicator.innerHTML = '3';
    }
    
    currentStep = step;
}

async function createAccount() {
    // Collect preferences data
    const goals = Array.from(document.querySelectorAll('input[name="goals"]:checked'))
        .map(checkbox => checkbox.value);
    const newsletter = document.getElementById('newsletter').checked;
    const experience = document.getElementById('experience').value;
    
    userData.preferences = {
        goals,
        newsletter,
        experience
    };
    
    // Show loading state
    createAccountBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating Account...';
    createAccountBtn.disabled = true;
    
    try {
        // Combine all user data
        const completeUserData = {
            ...userData.account,
            ...userData.profile,
            ...userData.preferences
        };
        
        // Use authManager to register the user
        const result = await authManager.register(completeUserData);
        
        if (result.success) {
            // Save avatar image to db.json if uploaded
            if (userData.profile.avatar && result.user && result.user.id) {
                try {
                    // Save to db.json via API (this is the persistent storage)
                    await apiService.updateUser(result.user.id, { avatar: userData.profile.avatar });
                    // Cache in localStorage for quick access
                    await saveUserAvatar(result.user.id, userData.profile.avatar);
                } catch (error) {
                    console.error('Error saving avatar:', error);
                    // Don't fail account creation if avatar save fails
                }
            }
            
            // Show success message
            showNotification('Account created successfully!', 'success');
            
            // Show welcome modal after a short delay
            setTimeout(() => {
                welcomeModal.classList.remove('hidden');
            }, 800);
            
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Error creating account:', error);
        showNotification(error.message || 'Failed to create account. Please try again.', 'error');
    } finally {
        // Reset button
        createAccountBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i> Create Account';
        createAccountBtn.disabled = false;
    }
}

function checkPasswordStrength() {
    const password = signupPasswordInput.value;
    let strength = 0;
    let text = 'Weak';
    let className = 'strength-weak';
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength === 4) {
        text = 'Strong';
        className = 'strength-strong';
    } else if (strength === 3) {
        text = 'Good';
        className = 'strength-good';
    } else if (strength === 2) {
        text = 'Fair';
        className = 'strength-fair';
    }
    
    passwordStrengthMeter.className = `password-strength-meter ${className}`;
    strengthText.textContent = text;
}

function checkPasswordMatch() {
    const password = signupPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password === confirmPassword) {
        passwordMatchDiv.classList.remove('hidden');
    } else {
        passwordMatchDiv.classList.add('hidden');
    }
}

function updateAvatarPreview() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    
    if (firstName && lastName) {
        const initials = getInitials();
        avatarPreview.textContent = initials;
    }
}

function getInitials() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
}

// function showNotification(message, type = 'success') {
//     notificationMessage.textContent = message;
    
//     // Set color based on type
//     if (type === 'success') {
//         notificationToast.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
//         notificationToast.innerHTML = '<i class="fas fa-check-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
//     } else if (type === 'error') {
//         notificationToast.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
//         notificationToast.innerHTML = '<i class="fas fa-exclamation-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
//     } else if (type === 'info') {
//         notificationToast.className = 'fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center slide-in';
//         notificationToast.innerHTML = '<i class="fas fa-info-circle mr-3 text-xl"></i>' + `<span id="notificationMessage">${message}</span>`;
//     }
    
//     // Show notification
//     notificationToast.classList.remove('hidden');
    
//     // Hide after 3 seconds
//     setTimeout(() => {
//         notificationToast.classList.add('hidden');
//     }, 3000);
// }