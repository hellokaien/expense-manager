// src/auth/auth.js
import { STORAGE_KEYS, getInitials } from '../shared/utils.js';
import apiService from '../shared/apiService.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    async checkAuthStatus() {
        try {
            const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGGED_IN);
            const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
            
            if (isLoggedIn !== 'true' || !userId) {
                this.logout();
                return false;
            }

            // Check session expiration
            const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
            if (rememberMe !== 'true') {
                const expiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
                if (expiry && new Date() > new Date(expiry)) {
                    this.logout();
                    return false;
                }
            }

            // Fetch user data from API
            try {
                this.currentUser = await apiService.getUser(userId);
                this.isAuthenticated = true;
                return true;
            } catch (error) {
                console.error('Failed to fetch user:', error);
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    }

    async login(email, password, rememberMe = false) {
        try {
            // Get user by email
            const users = await apiService.getUserByEmail(email);
            
            if (users.length === 0) {
                throw new Error('No account found with this email');
            }
            
            const user = users[0];
            
            // TODO: Replace btoa with proper password hashing
            // For now, keeping btoa for compatibility, but this should be changed
            const encodedPassword = btoa(password);
            
            if (user.password !== encodedPassword) {
                throw new Error('Invalid password');
            }

            // Update last login
            await apiService.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });

            // Store user data
            this.saveUserToLocalStorage(user, rememberMe);
            
            this.currentUser = user;
            this.isAuthenticated = true;
            
            return {
                success: true,
                user: user
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async register(userData) {
        try {
            // Check if user already exists
            const existingUsers = await apiService.getUserByEmail(userData.email);
            
            if (existingUsers.length > 0) {
                throw new Error('An account with this email already exists');
            }

            const userId = `user-${crypto.randomUUID()}`;
            
            // Create complete user object
            const completeUserData = {
                ...userData,
                id: userId,
                status: 'active',
                lastLogin: null,
                password: btoa(userData.password), // TODO: Use proper hashing
                createdAt: new Date().toISOString(),
                accountId: 'MF' + Date.now() + Math.floor(Math.random() * 1000),
                premiumTrial: true,
                trialStartDate: new Date().toISOString(),
                trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Save to API
            const savedUser = await apiService.createUser(completeUserData);
            
            // Store in localStorage
            this.saveUserToLocalStorage(savedUser, false);
            
            this.currentUser = savedUser;
            this.isAuthenticated = true;
            
            return {
                success: true,
                user: savedUser
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    saveUserToLocalStorage(user, rememberMe = false) {
        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accountId: user.accountId,
            initials: user.initials || getInitials(user.firstName, user.lastName),
            premiumTrial: user.premiumTrial,
            currency: user.currency || 'USD',
            country: user.country || 'US',
            avatar: user.avatar || null, // Store avatar from db.json
            phone: user.phone || null,
            bio: user.bio || null,
            location: user.location || null,
            // Include user preferences
            defaultDashboardView: user.defaultDashboardView || null,
            recentTransactionsCount: user.recentTransactionsCount || null
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
        localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);

        if (rememberMe) {
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, expirationDate.toISOString());
        } else {
            localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
            localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRY);
        }

        this.forceLocalStorageSync();
    }

    logout() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const userStr = localStorage.getItem(STORAGE_KEYS.USER);
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                this.isAuthenticated = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
            }
        }
        return this.currentUser;
    }

    getInitials(firstName, lastName) {
        return getInitials(firstName, lastName);
    }

    forceLocalStorageSync() {
        const dummyKey = 'moneyflow_sync_' + Date.now();
        localStorage.setItem(dummyKey, 'sync');
        localStorage.removeItem(dummyKey);
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;