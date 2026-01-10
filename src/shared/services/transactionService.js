import apiService from '../apiService.js';
import authManager from '../../auth/auth.js';

class TransactionService {
    async getTransactions() {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        return apiService.getTransactions(user.id);
    }

    async createTransaction(transaction) {
        const user = authManager.getCurrentUser();
        if (!user) throw new Error('User not authenticated');
        return apiService.createTransaction({
            ...transaction,
            userId: user.id
        });
    }

    async updateTransaction(id, transaction) {
        return apiService.updateTransaction(id, transaction);
    }

    async deleteTransaction(id) {
        return apiService.deleteTransaction(id);
    }
}

export default new TransactionService();