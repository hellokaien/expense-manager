    import { showNotification, API_BASE_URL, getInitials, STORAGE_KEYS } from '../shared/utils.js';
    import authManager from '../auth/auth.js';
    import apiService from '../shared/apiService.js';
    import { getUserAvatar, saveUserAvatar, fileToBase64, validateImageFile, deleteUserAvatar } from '../shared/imageStorage.js';
 
 // DOM Elements
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const settingsTabButtons = document.querySelectorAll('.settings-tab-btn');
    const settingsTabContents = document.querySelectorAll('.settings-tab-content');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const notificationToast = document.getElementById('notificationToast');
    const notificationMessage = document.getElementById('notificationMessage');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    
    // Navigation buttons
    const dashboardNav = document.getElementById('dashboardNav');
    const transactionsNav = document.getElementById('transactionsNav');
    const analyticsNav = document.getElementById('analyticsNav');
    const budgetNav = document.getElementById('budgetNav');
    const categoriesNav = document.getElementById('categoriesNav');
    const settingsNav = document.getElementById('settingsNav');

    // Initialize the settings page
    document.addEventListener('DOMContentLoaded', async function() {
        setupEventListeners();
        initializeThemeOptions();
        initializeAccordions();
        initializeRangeSliders();

        // Check authentication and load user data
        const isAuthenticated = await authManager.checkAuthStatus();
        if (!isAuthenticated) {
            window.location.href = '../auth/login.html';
            return;
        }

        const currentUser = authManager.getCurrentUser();
        if (currentUser) {
            // Load avatar from user object (which comes from db.json)
            await loadUserAvatar(currentUser.id, currentUser);
            updateUserInfo(currentUser);
            loadUserDataToForm(currentUser);
        } else {
            // Try to fetch from API if not in localStorage
            const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
            if (userId) {
                try {
                    const user = await apiService.getUser(userId);
                    // Load avatar from user object (from db.json)
                    await loadUserAvatar(userId, user);
                    updateUserInfo(user);
                    loadUserDataToForm(user);
                } catch (error) {
                    console.error('Failed to load user data:', error);
                    showNotification('Failed to load user data', 'error');
                }
            }
        }
    });

    function setupEventListeners() {
        // Toggle sidebar
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('ml-64');
            mainContent.classList.toggle('ml-20');
        });

        // Settings tab switching
        settingsTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchSettingsTab(tabId);
            });
        });

        // Save settings button
        saveSettingsBtn.addEventListener('click', saveSettings);

        // Logout button
        logoutBtn.addEventListener('click', () => {
            showConfirmationModal('Confirm Logout', 'Are you sure you want to logout?', () => {
                authManager.logout();
                showNotification('Logged out successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '../auth/login.html';
                }, 1500);
            });
        });

        // Modal confirm button
        modalConfirmBtn.addEventListener('click', () => {
            confirmationModal.classList.add('hidden');
        });

        // Theme option selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme') || this.getAttribute('data-color');
                selectThemeOption(this);
                
                // In a real app, you would save this preference
                console.log('Selected theme:', theme);
            });
        });

        // Navigation links
        const navLinks = [dashboardNav, transactionsNav, analyticsNav, budgetNav, categoriesNav, settingsNav];
        navLinks.forEach(link => {
            if (link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.id.replace('Nav', '').toLowerCase();
                    // In a real app, navigate to the page
                    console.log('Navigate to:', page);
                    if (page !== 'settings') {
                        window.location.href = `../${page}/${page}.html`;
                    }
                });
            }
        });

        // Profile form inputs - listen for changes to update avatar
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        if (firstNameInput) {
            firstNameInput.addEventListener('input', updateProfileAvatar);
        }
        if (lastNameInput) {
            lastNameInput.addEventListener('input', updateProfileAvatar);
        }
        
        // Avatar upload functionality
        setupAvatarUpload();
    }

    function switchSettingsTab(tabName) {
        // Update tab buttons
        settingsTabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === tabName) {
                button.classList.remove('settings-tab-inactive');
                button.classList.add('settings-tab-active');
            } else {
                button.classList.remove('settings-tab-active');
                button.classList.add('settings-tab-inactive');
            }
        });

        // Update tab content
        settingsTabContents.forEach(content => {
            if (content.id === tabName + 'Content') {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // Update page title and subtitle
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        
        const titles = {
            profile: { main: 'Profile Settings', sub: 'Manage your personal information' },
            preferences: { main: 'Preferences', sub: 'Customize your app experience' },
            notifications: { main: 'Notifications', sub: 'Configure alerts and reminders' },
            security: { main: 'Security', sub: 'Manage account security settings' },
            data: { main: 'Data Management', sub: 'Handle your data and backups' },
            billing: { main: 'Billing', sub: 'Manage subscription and payments' },
            about: { main: 'About', sub: 'App information and resources' }
        };

        if (titles[tabName]) {
            pageTitle.textContent = titles[tabName].main;
            pageSubtitle.textContent = titles[tabName].sub;
        }
    }

    function initializeThemeOptions() {
        // Set initial selected theme
        const themeOptions = document.querySelectorAll('.theme-option[data-theme]');
        const colorOptions = document.querySelectorAll('.theme-option[data-color]');
        
        // Select first theme option by default
        if (themeOptions.length > 0) {
            selectThemeOption(themeOptions[0]);
        }
        
        // Select first color option by default
        if (colorOptions.length > 0) {
            selectThemeOption(colorOptions[0]);
        }
    }

    function selectThemeOption(selectedOption) {
        // Remove selected class from all options in the same group
        const group = selectedOption.hasAttribute('data-theme') ? '[data-theme]' : '[data-color]';
        selectedOption.parentElement.querySelectorAll(group).forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        selectedOption.classList.add('selected');
    }

    function initializeAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const icon = this.querySelector('.accordion-icon');
                
                if (!content || !icon) return;
                
                // Toggle content
                const isOpen = content.classList.contains('open');
                content.classList.toggle('open');
                icon.classList.toggle('open');
                
                // Close other accordions in the same parent container
                const parentContainer = this.closest('.settings-card') || this.closest('.space-y-6');
                if (parentContainer) {
                    parentContainer.querySelectorAll('.accordion-content').forEach(accContent => {
                        if (accContent.id !== targetId) {
                            accContent.classList.remove('open');
                        }
                    });
                    
                    // Reset other icons
                    parentContainer.querySelectorAll('.accordion-icon').forEach(accIcon => {
                        if (accIcon !== icon) {
                            accIcon.classList.remove('open');
                        }
                    });
                }
            });
        });
    }

    async function saveSettings() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showNotification('User not found. Please login again.', 'error');
            return;
        }

        saveSettingsBtn.disabled = true;
        saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
        
        try {
            // Get current tab to save relevant settings
            const activeTab = document.querySelector('.settings-tab-active');
            const tabName = activeTab ? activeTab.getAttribute('data-tab') : 'profile';
            
            if (tabName === 'profile') {
                await saveProfileSettings(currentUser);
            } else {
                // For other tabs, you can add specific save logic
                await saveOtherSettings(currentUser, tabName);
            }
            
            showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings. Please try again.', 'error');
        } finally {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
        }
    }

    async function saveProfileSettings(currentUser) {
        // Get form values using IDs
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const bioTextarea = document.getElementById('bio');
        const locationInput = document.getElementById('location');
        const currencySelect = document.getElementById('currency');
        
        const updatedData = {
            firstName: firstNameInput ? firstNameInput.value.trim() : currentUser.firstName,
            lastName: lastNameInput ? lastNameInput.value.trim() : currentUser.lastName,
            email: emailInput ? emailInput.value.trim() : currentUser.email,
            phone: phoneInput ? phoneInput.value.trim() : currentUser.phone || '',
            bio: bioTextarea ? bioTextarea.value.trim() : currentUser.bio || '',
            location: locationInput ? locationInput.value.trim() : currentUser.location || ''
        };

        // Validate email
        if (updatedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
            throw new Error('Please enter a valid email address');
        }

        // Update initials if name changed
        if (updatedData.firstName || updatedData.lastName) {
            updatedData.initials = getInitials(updatedData.firstName, updatedData.lastName);
        }

        // Update currency if changed
        if (currencySelect) {
            updatedData.currency = currencySelect.value;
        }

        // Update date format if changed
        const dateFormatSelect = document.querySelectorAll('#profileContent select')[1];
        if (dateFormatSelect) {
            updatedData.dateFormat = dateFormatSelect.value;
        }

        // Update in API
        await apiService.updateUser(currentUser.id, updatedData);
        
        // Update in localStorage
        const updatedUser = { ...currentUser, ...updatedData };
        authManager.saveUserToLocalStorage(updatedUser, localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true');
        
        // Update authManager's current user
        authManager.currentUser = updatedUser;
        
        // Update displayed user info
        updateUserInfo(updatedUser);
    }

    async function saveOtherSettings(currentUser, tabName) {
        // Save preferences, notifications, etc.
        const settings = {};
        
        if (tabName === 'preferences') {
            // Save theme preferences
            const selectedTheme = document.querySelector('.theme-option[data-theme].selected');
            const selectedColor = document.querySelector('.theme-option[data-color].selected');
            
            if (selectedTheme) {
                settings.theme = selectedTheme.getAttribute('data-theme');
            }
            if (selectedColor) {
                settings.accentColor = selectedColor.getAttribute('data-color');
            }
            
            // Save toggle states
            const toggles = document.querySelectorAll('#preferencesContent .toggle-checkbox');
            toggles.forEach(toggle => {
                const id = toggle.id;
                settings[id] = toggle.checked;
            });
        }
        
        if (Object.keys(settings).length > 0) {
            await apiService.updateUser(currentUser.id, settings);
            const updatedUser = { ...currentUser, ...settings };
            authManager.saveUserToLocalStorage(updatedUser, localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true');
        }
    }

    function loadUserDataToForm(user) {
        // Load profile data using IDs
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const bioTextarea = document.getElementById('bio');
        const locationInput = document.getElementById('location');
        const currencySelect = document.getElementById('currency');
        
        if (firstNameInput) firstNameInput.value = user.firstName || '';
        if (lastNameInput) lastNameInput.value = user.lastName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (bioTextarea) bioTextarea.value = user.bio || '';
        if (locationInput) locationInput.value = user.location || '';

        // Load currency
        if (currencySelect && user.currency) {
            currencySelect.value = user.currency;
        }

        // Update profile avatar
        updateProfileAvatar();
    }

    function updateProfileAvatar() {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const avatarDiv = document.getElementById('profileAvatarDisplay');
        
        if (avatarDiv && firstNameInput && lastNameInput) {
            const firstName = firstNameInput.value.trim() || 'John';
            const lastName = lastNameInput.value.trim() || 'Doe';
            const initials = getInitials(firstName, lastName);
            
            // Only show initials if no image is loaded
            const currentUser = authManager.getCurrentUser();
            if (currentUser && currentUser.id) {
                getUserAvatar(currentUser.id, currentUser).then(avatarData => {
                    if (!avatarData) {
                        avatarDiv.textContent = initials;
                        avatarDiv.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500', 'flex', 'items-center', 'justify-center');
                    }
                });
            } else {
                avatarDiv.textContent = initials;
                avatarDiv.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500', 'flex', 'items-center', 'justify-center');
            }
        }
    }
    
    // Setup avatar upload functionality
    function setupAvatarUpload() {
        const avatarUploadInput = document.getElementById('profileAvatarUpload');
        const avatarDiv = document.getElementById('profileAvatarDisplay');
        const resetAvatarBtn = document.getElementById('resetAvatarBtn');
        const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
        
        // Also make the avatar div clickable
        if (avatarDiv && avatarUploadInput) {
            avatarDiv.addEventListener('click', function() {
                avatarUploadInput.click();
            });
        }
        
        if (avatarUploadInput) {
            avatarUploadInput.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if (file) {
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                        showNotification(validation.error, 'error');
                        e.target.value = '';
                        return;
                    }
                    
                    try {
                        const base64Data = await fileToBase64(file);
                        const currentUser = authManager.getCurrentUser();
                        
                        if (currentUser && currentUser.id) {
                            // Save to db.json via API (this is the persistent storage)
                            await apiService.updateUser(currentUser.id, { avatar: base64Data });
                            
                            // Cache in localStorage for quick access
                            await saveUserAvatar(currentUser.id, base64Data);
                            
                            // Update displayed avatar
                            displayAvatar(avatarDiv, base64Data);
                            
                            // Update user object in memory
                            const updatedUser = { ...currentUser, avatar: base64Data };
                            authManager.saveUserToLocalStorage(updatedUser, localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true');
                            authManager.currentUser = updatedUser;
                            
                            // Update sidebar avatar
                            updateUserInfo(updatedUser);
                            
                            showNotification('Profile picture updated successfully!', 'success');
                        }
                    } catch (error) {
                        console.error('Error uploading avatar:', error);
                        showNotification('Failed to upload image. Please try again.', 'error');
                        e.target.value = '';
                    }
                }
            });
        }
        
        // Reset avatar button
        if (resetAvatarBtn) {
            resetAvatarBtn.addEventListener('click', async function() {
                const currentUser = authManager.getCurrentUser();
                if (currentUser && currentUser.id) {
                    try {
                        // Remove from db.json via API first (persistent storage)
                        await apiService.updateUser(currentUser.id, { avatar: null });
                        // Then remove from cache
                        await deleteUserAvatar(currentUser.id);
                        
                        const updatedUser = { ...currentUser };
                        delete updatedUser.avatar;
                        authManager.saveUserToLocalStorage(updatedUser, localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true');
                        authManager.currentUser = updatedUser;
                        
                        // Reset to initials
                        updateProfileAvatar();
                        updateUserInfo(updatedUser);
                        
                        showNotification('Profile picture reset successfully!', 'success');
                    } catch (error) {
                        console.error('Error resetting avatar:', error);
                        showNotification('Failed to reset profile picture.', 'error');
                    }
                }
            });
        }
        
        // Upload button (triggers file input)
        if (uploadAvatarBtn) {
            uploadAvatarBtn.addEventListener('click', function() {
                if (avatarUploadInput) {
                    avatarUploadInput.click();
                }
            });
        }
    }
    
    // Load user avatar from storage
    async function loadUserAvatar(userId, userObject = null) {
        try {
            // Get avatar from user object (db.json) or cache
            const avatarData = await getUserAvatar(userId, userObject);
            if (avatarData) {
                // Update all avatar displays
                const avatarDivs = document.querySelectorAll('.w-32.h-32, .w-10.h-10');
                avatarDivs.forEach(div => {
                    displayAvatar(div, avatarData);
                });
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
        }
    }
    
    // Display avatar image
    function displayAvatar(avatarDiv, imageData) {
        if (!avatarDiv || !imageData) return;
        
        // Clear existing content
        avatarDiv.innerHTML = '';
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageData;
        img.classList.add('w-full', 'h-full', 'rounded-full', 'object-cover');
        img.style.display = 'block';
        
        // Add to div
        avatarDiv.appendChild(img);
        
        // Remove gradient background classes if present
        avatarDiv.classList.remove('bg-gradient-to-br', 'from-blue-400', 'to-purple-500', 'bg-blue-500');
    }

    function initializeRangeSliders() {
        // Initialize range sliders with proper value display
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            // Find the span that displays the value
            const parent = slider.closest('div');
            if (parent) {
                const valueSpan = parent.querySelector('span.text-blue-600');
                if (valueSpan) {
                    // Set initial value
                    const suffix = slider.id.includes('percent') || slider.getAttribute('max') === '100' ? '%' : '$';
                    valueSpan.textContent = slider.value + suffix;
                    
                    // Update on change
                    slider.addEventListener('input', function() {
                        valueSpan.textContent = this.value + suffix;
                    });
                }
            }
        });
    }

    // function showNotification(message) {
    //     notificationMessage.textContent = message;
    //     notificationToast.classList.remove('hidden');
        
    //     setTimeout(() => {
    //         notificationToast.classList.add('hidden');
    //     }, 3000);
    // }

    function showConfirmationModal(title, message, confirmCallback) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        confirmationModal.classList.remove('hidden');
        
        // Update confirm button to call the callback
        modalConfirmBtn.onclick = () => {
            confirmationModal.classList.add('hidden');
            if (confirmCallback) confirmCallback();
        };
    }

    // Delete account button functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.danger-zone button.bg-red-600')) {
            showConfirmationModal(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
                () => {
                    showNotification('Account deletion request submitted.');
                }
            );
        }
    });

    async function updateUserInfo(currentUser) {
        if (!currentUser) return;
        
        // Get user initials
        const firstName = currentUser.firstName || 'John';
        const lastName = currentUser.lastName || 'Doe';
        const initials = getInitials(firstName, lastName);
        
        // Load avatar from user object (from db.json) or cache
        let avatarData = null;
        if (currentUser.id) {
            avatarData = await getUserAvatar(currentUser.id, currentUser);
        }
        
        // Update sidebar user info
        const userProfile = document.querySelector('.flex.items-center.mb-8');
        if (userProfile) {
            const initialsDiv = userProfile.querySelector('.w-10.h-10');
            const nameDiv = userProfile.querySelector('.ml-3');
            
            if (initialsDiv) {
                if (avatarData) {
                    displayAvatar(initialsDiv, avatarData);
                } else {
                initialsDiv.innerHTML = `<span class="font-bold">${initials}</span>`;
                    initialsDiv.classList.add('bg-blue-500', 'flex', 'items-center', 'justify-center');
                }
            }
            
            if (nameDiv) {
                const userName = nameDiv.querySelector('.font-medium');
                const userType = nameDiv.querySelector('.text-gray-400');
                
                if (userName) {
                    userName.textContent = `${firstName} ${lastName}`;
                } else {
                    nameDiv.innerHTML = `
                        <p class="font-medium user-name">${firstName} ${lastName}</p>
                        <p class="text-gray-400 text-sm">${currentUser.premiumTrial ? 'Premium User' : 'Free User'}</p>
                    `;
                }
                
                if (userType) {
                    userType.textContent = currentUser.premiumTrial ? 'Premium User' : 'Free User';
                }
            }
        }
        
        // Update profile picture in settings
        const profileAvatar = document.getElementById('profileAvatarDisplay');
        if (profileAvatar) {
            if (avatarData) {
                displayAvatar(profileAvatar, avatarData);
            } else {
            profileAvatar.textContent = initials;
                profileAvatar.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-purple-500', 'flex', 'items-center', 'justify-center');
            }
        }
        
        // Update avatar in modal if exists
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview) {
            if (avatarData) {
                displayAvatar(avatarPreview, avatarData);
            } else {
            avatarPreview.textContent = initials;
            }
        }
    }