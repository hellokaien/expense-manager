// auth.js - Shared authentication utilities

const API_BASE_URL = 'http://localhost:3000';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Check if user is logged in
    async checkAuthStatus() {
        try {
            const isLoggedIn = localStorage.getItem('moneyflow_logged_in');
            const userId = localStorage.getItem('moneyflow_user_id');
            
            if (isLoggedIn !== 'true' || !userId) {
                this.logout();
                return false;
            }

            // Check session expiration
            const rememberMe = localStorage.getItem('moneyflow_remember_me');
            if (rememberMe !== 'true') {
                const expiry = localStorage.getItem('moneyflow_session_expiry');
                if (expiry && new Date() > new Date(expiry)) {
                    this.logout();
                    return false;
                }
            }

            // Fetch user data from API
            const response = await fetch(`${API_BASE_URL}/users/${userId}`);
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.isAuthenticated = true;
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    }

    // Login user
    async login(email, password, rememberMe = false) {
        try {
            // Check credentials against JSON Server
            const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
            const users = await response.json();
            
            if (users.length === 0) {
                throw new Error('No account found with this email');
            }
            
            const user = users[0];
            
            // Check password
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

    // Demo login
    demoLogin(rememberMe = false) {
        const demoUser = {
            id: 'demo-user-001',
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@moneyflow.com',
            accountId: 'MFDEMO001',
            initials: 'DU',
            premiumTrial: true,
            currency: 'USD',
            country: 'US'
        };
        
        this.saveUserToLocalStorage(demoUser, rememberMe);
        this.currentUser = demoUser;
        this.isAuthenticated = true;
        
        return {
            success: true,
            user: demoUser
        };
    }

    // Register new user
    async register(userData) {
        try {
            // Check if user already exists
            const checkResponse = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(userData.email)}`);
            const existingUsers = await checkResponse.json();
            
            if (existingUsers.length > 0) {
                throw new Error('An account with this email already exists');
            }

            // Create complete user object
            const completeUserData = {
                ...userData,
                id: Date.now(),
                status: 'active',
                lastLogin: null,
                password: btoa(userData.password), // Encode password
                createdAt: new Date().toISOString(),
                accountId: 'MF' + Date.now() + Math.floor(Math.random() * 1000),
                premiumTrial: true,
                trialStartDate: new Date().toISOString(),
                trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Save to JSON Server
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(completeUserData)
            });

            if (response.ok) {
                const savedUser = await response.json();
                
                // Store in localStorage
                this.saveUserToLocalStorage(savedUser, false);
                
                this.currentUser = savedUser;
                this.isAuthenticated = true;
                
                return {
                    success: true,
                    user: savedUser
                };
            } else {
                throw new Error('Failed to create account');
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Save user to localStorage
    saveUserToLocalStorage(user, rememberMe = false) {
        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            accountId: user.accountId,
            initials: user.initials || this.getInitials(user.firstName, user.lastName),
            premiumTrial: user.premiumTrial,
            currency: user.currency || 'USD',
            country: user.country || 'US',
            avatar: user.avatar || null
        };

        localStorage.setItem('moneyflow_user', JSON.stringify(userData));
        localStorage.setItem('moneyflow_logged_in', 'true');
        localStorage.setItem('moneyflow_user_id', user.id);

        if (rememberMe) {
            localStorage.setItem('moneyflow_remember_me', 'true');
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            localStorage.setItem('moneyflow_session_expiry', expirationDate.toISOString());
        } else {
            localStorage.removeItem('moneyflow_remember_me');
            localStorage.removeItem('moneyflow_session_expiry');
        }

        this.forceLocalStorageSync();
    }

    // Logout
    logout() {
        localStorage.removeItem('moneyflow_user');
        localStorage.removeItem('moneyflow_logged_in');
        localStorage.removeItem('moneyflow_user_id');
        localStorage.removeItem('moneyflow_remember_me');
        localStorage.removeItem('moneyflow_session_expiry');
        
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            const userStr = localStorage.getItem('moneyflow_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                this.isAuthenticated = localStorage.getItem('moneyflow_logged_in') === 'true';
            }
        }
        return this.currentUser;
    }

    // Helper methods
    getInitials(firstName, lastName) {
        if (!firstName || !lastName) return 'MF';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }

    forceLocalStorageSync() {
        const dummyKey = 'moneyflow_sync_' + Date.now();
        localStorage.setItem(dummyKey, 'sync');
        localStorage.removeItem(dummyKey);
    }
}

// Create singleton instance
const authManager = new AuthManager();