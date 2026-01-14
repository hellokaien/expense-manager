// src/shared/services/categoryService.js
import apiService from '../apiService.js';
import authManager from '../../auth/auth.js';

class CategoryService {
    /**
     * Get all categories for the current user
     * @returns {Promise<Array>} Array of categories
     */
    async getCategories() {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        return apiService.getCategories(user.id);
    }

    /**
     * Get categories filtered by type (income or expense)
     * @param {string} type - 'income' or 'expense'
     * @returns {Promise<Array>} Array of filtered categories
     */
    async getCategoriesByType(type) {
        const categories = await this.getCategories();
        return categories.filter(category => category.type === type);
    }

    /**
     * Get a single category by ID
     * @param {string} id - Category ID
     * @returns {Promise<Object|null>} Category object or null if not found
     */
    async getCategoryById(id) {
        const categories = await this.getCategories();
        return categories.find(cat => cat.id === id) || null;
    }

    /**
     * Create a new category
     * @param {Object} category - Category data (name, type, color, icon, etc.)
     * @returns {Promise<Object>} Created category
     */
    async createCategory(category) {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        
        return apiService.createCategory({
            ...category,
            userId: user.id
        });
    }

    /**
     * Update an existing category
     * @param {string} id - Category ID
     * @param {Object} category - Updated category data
     * @returns {Promise<Object>} Updated category
     */
    async updateCategory(id, category) {
        return apiService.updateCategory(id, category);
    }

    /**
     * Delete a category
     * @param {string} id - Category ID
     * @returns {Promise<boolean>} True if successful
     */
    async deleteCategory(id) {
        await apiService.deleteCategory(id);
        return true;
    }

    /**
     * Delete multiple categories
     * @param {Array<string>} ids - Array of category IDs
     * @returns {Promise<boolean>} True if all successful
     */
    async deleteMultipleCategories(ids) {
        const deletePromises = ids.map(id => this.deleteCategory(id));
        await Promise.all(deletePromises);
        return true;
    }

    /**
     * Search categories by name
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} Filtered categories
     */
    async searchCategories(searchTerm) {
        const categories = await this.getCategories();
        const term = searchTerm.toLowerCase();
        return categories.filter(cat => 
            cat.name.toLowerCase().includes(term)
        );
    }
}

// Export singleton instance
export default new CategoryService();






