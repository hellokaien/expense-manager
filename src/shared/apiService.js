// src/shared/apiService.js
import { API_BASE_URL } from './utils.js';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 404 for GET requests - return empty array for list endpoints
            const method = options.method || 'GET';
            if (response.status === 404 && method === 'GET' && endpoint.includes('?')) {
                return [];
            }
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Generic CRUD methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Transaction-specific methods
    async getTransactions(userId) {
        return this.get(`/transactions?userId=${userId}`);
    }

    async createTransaction(transaction) {
        return this.post('/transactions', transaction);
    }

    async updateTransaction(id, transaction) {
        return this.patch(`/transactions/${id}`, transaction);
    }

    async deleteTransaction(id) {
        return this.delete(`/transactions/${id}`);
    }

    // Category-specific methods
    async getCategories(userId) {
        return this.get(`/categories?userId=${userId}`);
    }

    async createCategory(category) {
        return this.post('/categories', category);
    }

    async updateCategory(id, category) {
        return this.patch(`/categories/${id}`, category);
    }

    async deleteCategory(id) {
        return this.delete(`/categories/${id}`);
    }

    // User-specific methods
    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async getUserByEmail(email) {
        return this.get(`/users?email=${encodeURIComponent(email)}`);
    }

    async createUser(user) {
        return this.post('/users', user);
    }

    async updateUser(id, user) {
        return this.patch(`/users/${id}`, user);
    }
}

// Export singleton instance
export default new ApiService();