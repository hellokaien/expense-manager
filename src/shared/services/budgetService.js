// src/shared/services/budgetService.js
import apiService from '../apiService.js';
import authManager from '../../auth/auth.js';

class BudgetService {
    /**
     * Get all budgets for the current user
     * @returns {Promise<Array>} Array of budgets
     */
    async getBudgets() {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        return apiService.get(`/budgets?userId=${user.id}`);
    }

    /**
     * Get a single budget by ID
     * @param {string} id - Budget ID
     * @returns {Promise<Object|null>} Budget object or null if not found
     */
    async getBudgetById(id) {
        return apiService.get(`/budgets/${id}`);
    }

    /**
     * Create a new budget
     * @param {Object} budget - Budget data
     * @returns {Promise<Object>} Created budget
     */
    async createBudget(budget) {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        return apiService.post('/budgets', {
            ...budget,
            userId: user.id
        });
    }

    /**
     * Update an existing budget
     * @param {string} id - Budget ID
     * @param {Object} budget - Updated budget data
     * @returns {Promise<Object>} Updated budget
     */
    async updateBudget(id, budget) {
        return apiService.patch(`/budgets/${id}`, budget);
    }

    /**
     * Delete a budget
     * @param {string} id - Budget ID
     * @returns {Promise<boolean>} True if successful
     */
    async deleteBudget(id) {
        await apiService.delete(`/budgets/${id}`);
        return true;
    }

    /**
     * Get budget categories for a budget
     * @param {string} budgetId - Budget ID
     * @returns {Promise<Array>} Array of budget categories
     */
    async getBudgetCategories(budgetId) {
        return apiService.get(`/budgetCategories?budgetId=${budgetId}`);
    }

    /**
     * Create a budget category
     * @param {Object} category - Budget category data
     * @returns {Promise<Object>} Created budget category
     */
    async createBudgetCategory(category) {
        return apiService.post('/budgetCategories', category);
    }

    /**
     * Update a budget category
     * @param {string} id - Budget category ID
     * @param {Object} category - Updated category data
     * @returns {Promise<Object>} Updated category
     */
    async updateBudgetCategory(id, category) {
        return apiService.patch(`/budgetCategories/${id}`, category);
    }

    /**
     * Delete a budget category
     * @param {string} id - Budget category ID
     * @returns {Promise<boolean>} True if successful
     */
    async deleteBudgetCategory(id) {
        await apiService.delete(`/budgetCategories/${id}`);
        return true;
    }

    /**
     * Get savings goals for the current user
     * @returns {Promise<Array>} Array of savings goals
     */
    async getSavingsGoals() {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        return apiService.get(`/savingsGoals?userId=${user.id}`);
    }

    /**
     * Create a savings goal
     * @param {Object} goal - Savings goal data
     * @returns {Promise<Object>} Created savings goal
     */
    async createSavingsGoal(goal) {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        return apiService.post('/savingsGoals', {
            ...goal,
            userId: user.id
        });
    }

    /**
     * Update a savings goal
     * @param {string} id - Savings goal ID
     * @param {Object} goal - Updated goal data
     * @returns {Promise<Object>} Updated goal
     */
    async updateSavingsGoal(id, goal) {
        return apiService.patch(`/savingsGoals/${id}`, goal);
    }

    /**
     * Delete a savings goal
     * @param {string} id - Savings goal ID
     * @returns {Promise<boolean>} True if successful
     */
    async deleteSavingsGoal(id) {
        await apiService.delete(`/savingsGoals/${id}`);
        return true;
    }
}

// Export singleton instance
export default new BudgetService();
