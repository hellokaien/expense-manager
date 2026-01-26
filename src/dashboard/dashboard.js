import { showNotification, API_BASE_URL, getInitials, STORAGE_KEYS } from '../shared/utils.js';
import authManager from '../auth/auth.js';
import categoryService from '../shared/services/categoryService.js';
import transactionService from '../shared/services/transactionService.js';  
import { logout } from '../app.js';
import { formatCurrency, getCurrencySymbol } from '../shared/currencyUtils.js';
import apiService from '../shared/apiService.js';
    import { getUserAvatar, saveUserAvatar, fileToBase64, validateImageFile, deleteUserAvatar } from '../shared/imageStorage.js';

// Payment method labels
const paymentMethods = {
    "credit_card": "Credit Card",
    "debit_card": "Debit Card",
    "cash": "Cash",
    "bank_transfer": "Bank Transfer",
    "digital_wallet": "Digital Wallet"
};

// DOM Elements
const transactionModal = document.getElementById('transactionModal');
const transactionDetailModal = document.getElementById('transactionDetailModal');
const logoutModal = document.getElementById('logoutModal');
const openAddModalBtn = document.getElementById('openAddModal');
const closeModalBtn = document.getElementById('closeModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const cancelBtn = document.getElementById('cancelBtn');
const incomeTypeBtn = document.getElementById('incomeTypeBtn');
const expenseTypeBtn = document.getElementById('expenseTypeBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionCategory = document.getElementById('transactionCategory');
const transactionsList = document.getElementById('transactionsList');
const allTransactionsTable = document.getElementById('allTransactionsTable');
const filterButtons = document.querySelectorAll('.filter-btn');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
// Tab elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Chart variables
let incomeExpenseChart, categoryChart, trendChart, ratioChart;

// Current transaction type (income or expense)
let currentTransactionType = 'income';

// Current user data
let currentUser = null;
let transactions = [];
let allCategories = [];
let isEditing = false;
let editingTransactionId = null;

// Categories for income and expenses
let incomeCategories = [];
let expenseCategories = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Ensure all modals are hidden on page load
        if (transactionModal) transactionModal.classList.add('hidden');
        if (transactionDetailModal) transactionDetailModal.classList.add('hidden');
        if (logoutModal) logoutModal.classList.add('hidden');
        if (loadingState) loadingState.classList.add('hidden');
        
        // Check if user is logged in
        const isAuthenticated = await authManager.checkAuthStatus();
        
        if (!isAuthenticated) {
            window.location.href = '../auth/login.html';
            return;
        }

        currentUser = authManager.getCurrentUser();
        //console.log('Current user:', currentUser);

        await fetchCategories();      
          
        // Update UI with user info
        updateUserInfo(currentUser);

        // Set today's date as default in the form
        const transactionDateInput = document.getElementById('transactionDate');
        if (transactionDateInput) {
            transactionDateInput.valueAsDate = new Date();
        }
        
        // Initialize with income categories
        updateCategoryOptions('income');
        
        // Load user data and transactions
        await loadUserData();
        await loadTransactions();
        
        // Update UI
        renderAllTransactionsTable();
        updateSummary();
        initializeCharts();
        
        // Update currency label in modal
        updateAmountLabel();
        
        // Set up event listeners
        setupEventListeners();
        
        // Get default dashboard view from user preferences
        const preferredTab = currentUser?.defaultDashboardView || 'overview';
        
        // Validate that the preferred tab exists (valid tabs: overview, transactions, analytics, budget, reports)
        const validTabs = ['overview', 'transactions', 'analytics', 'budget', 'reports'];
        const defaultTab = validTabs.includes(preferredTab) ? preferredTab : 'overview';
        
        // Activate the preferred tab (or default to overview)
        switchTab(defaultTab);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Ensure modals are closed even if there's an error
        if (transactionModal) transactionModal.classList.add('hidden');
        if (transactionDetailModal) transactionDetailModal.classList.add('hidden');
        if (logoutModal) logoutModal.classList.add('hidden');
        if (loadingState) loadingState.classList.add('hidden');
    }
});

async function checkAuthentication() {
    try {
        const isLoggedIn = localStorage.getItem('moneyflow_logged_in');
        const userId = localStorage.getItem('moneyflow_user_id');
        
        if (isLoggedIn !== 'true' || !userId) {
            return false;
        }
        
        // Check if session is expired (if remember me is not set)
        const rememberMe = localStorage.getItem('moneyflow_remember_me');
        if (rememberMe !== 'true') {
            const expiry = localStorage.getItem('moneyflow_session_expiry');
            if (expiry && new Date() > new Date(expiry)) {
                logout();
                return false;
            }
        }
        
        // Fetch user data from JSON Server
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        
        if (response.ok) {
            currentUser = await response.json();
            
            // Update user info in the sidebar
            updateUserInfo();
            return true;
        } else {
            // User not found in database
            logout();
            return false;
        }
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        return false;
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    // Update UI with user info
    updateUserInfo();
}

async function loadTransactions() {
    await fetchTransactions();
    renderTransactions();
}

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

function setupEventListeners() {
    // Open modal
    openAddModalBtn.addEventListener('click', () => {
        updateAmountLabel(); // Update currency label when opening modal
        transactionModal.classList.remove('hidden');
    });

    const openAddModalEmptyBtn = document.getElementById('openAddModalEmpty');
    if (openAddModalEmptyBtn) {
        openAddModalEmptyBtn.addEventListener('click', () => {
            updateAmountLabel(); // Update currency label when opening modal
            transactionModal.classList.remove('hidden');
        });
    }
    
    // Close modal
    closeModalBtn.addEventListener('click', closeTransactionModal);
    cancelBtn.addEventListener('click', closeTransactionModal);

    // Close detail modal
    if (closeDetailModal && transactionDetailModal) {
        closeDetailModal.addEventListener('click', () => {
            if (transactionDetailModal) {
            transactionDetailModal.classList.add('hidden');
        }
        });
        
        // Close detail modal when clicking outside
        transactionDetailModal.addEventListener('click', (e) => {
            if (e.target === transactionDetailModal) {
                if (transactionDetailModal) {
            transactionDetailModal.classList.add('hidden');
        }
            }
        });
    }
    
    // Close modal when clicking outside
    if (transactionModal) {
        transactionModal.addEventListener('click', (e) => {
            if (e.target === transactionModal) {
                closeTransactionModal();
            }
        });
    }
    
    // Transaction type toggle
    incomeTypeBtn.addEventListener('click', () => {
        setTransactionType('income');
    });
    
    expenseTypeBtn.addEventListener('click', () => {
        setTransactionType('expense');
    });
    
    // Form submission
    transactionForm.addEventListener('submit', saveTransaction);
    
    // Filter transactions
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-800');
            });
            
            button.classList.add('active', 'bg-blue-600', 'text-white');
            button.classList.remove('bg-gray-100', 'text-gray-800');
            
            // Filter transactions
            const filter = button.getAttribute('data-filter');
            renderTransactions(filter);
        });
    });
    
    // View all transactions
    document.getElementById('viewAllBtn').addEventListener('click', () => {
        switchTab('transactions');
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });
    
    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
    
    confirmLogoutBtn.addEventListener('click', () => {
        logout();
    });
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.id.replace('Tab', '');
            switchTab(tabId);
        });
    });
    
    // Toggle sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        mainContent.classList.toggle('ml-64');
    });

    monthlySummaryStats();
}

function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(button => {
        const buttonTab = button.id.replace('Tab', '');
        if (buttonTab === tabName) {
            button.classList.remove('tab-inactive');
            button.classList.add('tab-active');
        } else {
            button.classList.remove('tab-active');
            button.classList.add('tab-inactive');
        }
    });
    
    // Update tab content
    tabContents.forEach(content => {
        const contentTab = content.id.replace('Content', '');
        if (contentTab === tabName) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // If switching to transactions tab, update the table
    if (tabName === 'transactions') {
        renderAllTransactionsTable();
    }
    
    // If switching to analytics tab, initialize charts if needed
    if (tabName === 'analytics') {
        initializeAnalyticsCharts();
    }
}

function setTransactionType(type) {
    currentTransactionType = type;
    
    if (type === 'income') {
        incomeTypeBtn.classList.add('bg-green-500', 'text-white');
        incomeTypeBtn.classList.remove('text-gray-700');
        expenseTypeBtn.classList.add('text-gray-700');
        expenseTypeBtn.classList.remove('bg-red-500', 'text-white');
        updateCategoryOptions('income');
    } else {
        expenseTypeBtn.classList.add('bg-red-500', 'text-white');
        expenseTypeBtn.classList.remove('text-gray-700');
        incomeTypeBtn.classList.add('text-gray-700');
        incomeTypeBtn.classList.remove('bg-green-500', 'text-white');
        updateCategoryOptions('expense');
    }
}

function updateCategoryOptions(type) {
    // Clear current options
    transactionCategory.innerHTML = '';
    
    // Add new options based on type
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        transactionCategory.appendChild(option);
    });
}
  
async function saveTransaction(e) {
    e.preventDefault();
    
    //if (!currentUser) {
    //    showNotification('Please login to save transactions', 'error');
    //    return;
    //}
    
    // Get form values
    const title = document.getElementById('transactionTitle').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const paymentMethod = document.getElementById('transactionPaymentMethod').value;
    const notes = document.getElementById('transactionNotes').value;
    
    if (!title || !amount || !category || !date || !paymentMethod) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Check if we're editing an existing transaction
    const saveBtn = document.getElementById('saveTransactionBtn');
    const editingId = saveBtn.dataset.editingId;
    
    const transactionData = {
        title: title,
        amount: amount,
        type: currentTransactionType,
        category: category,
        date: date,
        paymentMethod: paymentMethod,
        status: "completed",
        notes: notes,
        tags: []
    };
    
    try {
        if (isEditing && editingTransactionId) {
            // Update existing transaction
            await updateTransaction(editingTransactionId, transactionData);
            showNotification('Transaction updated successfully!', 'success');
        } else {
            // Create new transaction
            await addTransaction(transactionData);
            showNotification('Transaction added successfully!', 'success');
        }
        
        // Update UI
        await loadTransactions();
        renderAllTransactionsTable();
        //updateSelectedCount();
        updateSummary();
        
        // Close modal and reset form
        closeTransactionModal();
    } catch (error) {
        showNotification('Failed to save transaction.', error);
        dd(error);
    }
}

function renderTransactions(filter = 'all') {
    // Clear current transactions
    transactionsList.innerHTML = '';
    
    // Filter transactions if needed
    let filteredTransactions = transactions;
    if (filter !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === filter);
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get the number of recent transactions to show from user preference (default to 10)
    // Always get the latest user data from authManager to ensure we have the most recent preferences
    const user = authManager.getCurrentUser() || currentUser;
    // const recentCount = 7;
    const recentCount = user?.recentTransactionsCount || 10;
  
    // Take only the specified number of recent transactions for the recent list
    const recentTransactions = filteredTransactions.slice(0, recentCount);
    
    // Render each transaction
    recentTransactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = `p-4 rounded-lg ${transaction.type === 'income' ? 'transaction-income bg-green-50' : 'transaction-expense bg-red-50'}`;
        
        // Find category label
        const categoryList = transaction.type === 'income' ? incomeCategories : expenseCategories;
        const categoryInfo = getCategoryInfo(transaction.category);
        const colorClass = getCategoryColorClass(categoryInfo.color);
    
        // Format date
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        transactionElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-medium text-gray-800">${transaction.title}</h4>
                    <div class="flex items-center mt-1">
                        <span class="text-xs px-2 py-1 rounded-full mr-3 ${colorClass}">${categoryInfo.name}</span>
                        <span class="text-gray-500 text-sm">${formattedDate}</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount.toFixed(2))}
                    </p>
                    <button class="delete-btn text-gray-400 hover:text-red-500 text-sm mt-1" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        transactionsList.appendChild(transactionElement);
    });
    
    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = parseInt(this.getAttribute('data-id'));
            console.log(transactionId);
            deleteTransaction(transactionId);

        });
    });
}

function renderAllTransactionsTable() {

    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    
    if (!loadingState.classList.contains('hidden')) {
        return;
    }
    // Clear current table
    allTransactionsTable.innerHTML = '';
    
    // Sort by date (newest first)
    const user = authManager.getCurrentUser() || currentUser;
    const recentCount = user?.recentTransactionsCount || 10;
    
    // Take only the specified number of recent transactions for the recent list
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = sortedTransactions.slice(0, recentCount);
    
    if (sortedTransactions.length === 0) {
        emptyState.classList.remove('hidden');
        
        return;
    }

    // Render each transaction
    recentTransactions.forEach(transaction => {
        // Find category label
        const categoryList = transaction.type === 'income' ? incomeCategories : expenseCategories;
        const categoryInfo = getCategoryInfo(transaction.category);
        const colorClass = getCategoryColorClass(categoryInfo.color);
        // Format date
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-4 px-4">${formattedDate}</td>
            <td class="py-4 px-4 font-medium">${transaction.title}</td>
            <td class="py-4 px-4">
                <span class="text-xs px-2 py-1 rounded-full ${colorClass}">${categoryInfo.name}</span>
            </td>
            <td class="py-4 px-4">
                <span class="px-2 py-1 rounded text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${transaction.type === 'income' ? 'Income' : 'Expense'}
                </span>
            </td>
            <td class="py-4 px-4 font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount.toFixed(2))}
            </td>
            <td class="py-4 px-4">
                <div class="flex space-x-2">
                    <button type="button" class="view-btn text-blue-600 hover:text-blue-800" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="edit-btn text-gray-600 hover:text-gray-800" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="delete-btn-table text-red-600 hover:text-red-800" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        allTransactionsTable.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            viewTransaction(transactionId);
        });
    });
    
    // Add delete event listeners
    document.querySelectorAll('.delete-btn-table').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            console.log(transactionId);
            deleteTransaction(transactionId);
        });
    });
    
    // Add edit event listeners
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });
}

function viewTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Find category label
    const categoryList = transaction.type === 'income' ? incomeCategories : expenseCategories;
    const categoryInfo = categoryList.find(c => c.id === transaction.category) || { name: transaction.category, color: 'category-other' };
    const colorClass = getCategoryColorClass(categoryInfo.color);

    // Format date
    const dateObj = new Date(transaction.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' • ' + 
                          dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Update modal content
    document.getElementById('detailDescription').textContent = transaction.title;
    document.getElementById('detailAmount').textContent = `${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`;
    document.getElementById('detailAmount').className = `text-3xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`;
    document.getElementById('detailCategory').textContent = categoryInfo.name;
    document.getElementById('detailCategory').className = `${colorClass} px-3 py-1.5 rounded-full text-sm font-medium`;
    document.getElementById('detailType').textContent = transaction.type === 'income' ? 'Income' : 'Expense';
    document.getElementById('detailType').className = `px-3 py-1.5 ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-full text-sm font-medium`;
    document.getElementById('detailDate').textContent = formattedDate;
    document.getElementById('detailPaymentMethod').textContent = paymentMethods[transaction.paymentMethod];
    document.getElementById('detailStatus').textContent = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1);
    document.getElementById('detailNotes').textContent = transaction.notes || 'No notes added';
    
    // Update tags
    const tagsContainer = document.querySelector('#transactionDetailModal .flex.flex-wrap.gap-2');
    tagsContainer.innerHTML = '';
    transaction.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm';
        tagElement.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
        tagsContainer.appendChild(tagElement);
    });
    
    // Update action buttons
    document.getElementById('deleteDetailBtn').onclick = () => deleteTransaction(id);
    document.getElementById('editDetailBtn').onclick = () => editTransaction(id);
    
    // Show modal
    if (transactionDetailModal) {
        transactionDetailModal.classList.remove('hidden');
    }
}

async function deleteTransaction2(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        // Delete from server
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local array
            transactions = transactions.filter(t => t.id !== id);
            
            // Update UI
            renderTransactions();
            renderAllTransactionsTable();
            updateSummary();
            updateCharts();
            
            showNotification('Transaction deleted successfully!', 'warning');
        } else {
            throw new Error('Failed to delete transaction');
        }
        
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Failed to delete transaction. Please try again.', 'error');
    }
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    isEditing = true;
    editingTransactionId = id;
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    
    // Populate form with transaction data
    document.getElementById('transactionTitle').value = transaction.title;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = transaction.date;
    document.getElementById('transactionPaymentMethod').value = transaction.paymentMethod;
    document.getElementById('transactionNotes').value = transaction.notes || '';
    
    // Set transaction type
    setTransactionType(transaction.type);
    document.getElementById('transactionCategory').value = transaction.category;
    
    // Update currency label before showing modal
    updateAmountLabel();
    
    // Show modal
    transactionModal.classList.remove('hidden');
}

function updateSummary() {
    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(0) : 0;
    
    // Update UI
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome.toFixed(2));
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses.toFixed(2));
    
    // Update balance display
    const balanceElements = document.querySelectorAll('.balance-bg h3');
    balanceElements.forEach(el => {
        el.textContent = formatCurrency(totalBalance.toFixed(2));
    });
    
    // Update savings rate card
    const savingsCard = document.querySelector('.savings-bg');
    if (savingsCard) {
        const savingsTitle = savingsCard.querySelector('h3');
        const savingsSubtitle = savingsCard.querySelector('p:nth-child(3)');
        
        if (savingsTitle) {
            savingsTitle.textContent = `${savingsRate}%`;
        }
        if (savingsSubtitle) {
            savingsSubtitle.textContent = `${formatCurrency(totalBalance.toFixed(0))} saved this month`;
        }
    }
}

function initializeCharts() {
    // Income vs Expense Chart
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
                {
                    label: 'Income',
                    data: [3200, 3500, 3800, 4000, 4250],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Expenses',
                    data: [1850, 2200, 1950, 2400, 1845],
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'],
            datasets: [{
                data: [35, 20, 25, 15, 5, 10],
                backgroundColor: [
                    '#fbbf24', // Food - amber
                    '#3b82f6', // Transport - blue
                    '#8b5cf6', // Shopping - purple
                    '#10b981', // Bills - green
                    '#ef4444', // Entertainment - red
                    '#6b7280'  // Other - gray
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

function initializeAnalyticsCharts() {
    // Only initialize if charts don't exist yet
    if (!trendChart) {
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [
                    {
                        label: 'Spending',
                        data: [450, 520, 480, 395],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }
    
    if (!ratioChart) {
        const ratioCtx = document.getElementById('ratioChart').getContext('2d');
        ratioChart = new Chart(ratioCtx, {
            type: 'pie',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [4250, 1845],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }
}

function updateCharts() {
    // Calculate current month's income and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let monthIncome = 0;
    let monthExpenses = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            if (transaction.type === 'income') {
                monthIncome += transaction.amount;
            } else {
                monthExpenses += transaction.amount;
            }
        }
    });
    
    // Update income vs expense chart
    if (incomeExpenseChart) {
        incomeExpenseChart.data.datasets[0].data[4] = monthIncome;
        incomeExpenseChart.data.datasets[1].data[4] = monthExpenses;
        incomeExpenseChart.update();
    }
    
    // Update ratio chart if it exists
    if (ratioChart) {
        ratioChart.data.datasets[0].data = [monthIncome, monthExpenses];
        ratioChart.update();
    }
}

async function fetchTransactions() {
    try {
        loadingState.classList.remove('hidden');
        
        // Use transactionService - it handles auth and API calls automatically!
        transactions = await transactionService.getTransactions();
        
        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showNotification('Failed to load transactions', 'error');
        return [];
    } finally {
        loadingState.classList.add('hidden');
    }
}

function getCategoryInfo(categoryValue) {
    // Try to find by ID first
    let category = allCategories.find(cat => cat.id === categoryValue);

    // If not found by ID, try by name (for backward compatibility)
    if (!category) {
        const categoryName = categoryValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        category = allCategories.find(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
        );
    }
    
    // If still not found, return a default
    if (!category) {
        return {
            name: categoryValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            color: '#6b7280',
            icon: 'tag'
        };
    }
    
    return category;
}
function getCategoryColorClass(color) {
    // Map colors to your existing CSS classes
    const colorMap = {
        '#10b981': 'category-salary',
        '#f59e0b': 'category-freelance',
        '#8b5cf6': 'category-shopping',
        '#3b82f6': 'category-transport',
        '#ef4444': 'category-food',
        '#ec4899': 'category-entertainment',
        '#7c3aed': 'category-other',
        '#dc2626': 'category-other'
    };
    
    return colorMap[color] || 'category-other';
}
async function fetchCategories() {
    try {
        allCategories = await categoryService.getCategories();
        
        // Filter categories by type
        incomeCategories = allCategories.filter(category => category.type === 'income');
        expenseCategories = allCategories.filter(category => category.type === 'expense');
        
        return allCategories;
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function addTransaction(transaction) {
    try {
        const transactionId = `txn-${crypto.randomUUID()}`;
        // Add userId to transaction
        const transactionWithUser = {
            id: transactionId,  // ← Always include an ID
            ...transaction,
            userId: authManager.getCurrentUser().id // You can change this based on your user system
        };
        
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionWithUser)
        });
        
        if (!response.ok) throw new Error('Failed to add transaction');
        
        const newTransaction = await response.json();
        transactions.push(newTransaction);
        return newTransaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

async function updateTransaction(id, transaction) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
        });
        
        if (!response.ok) throw new Error('Failed to update transaction');
        
        const updatedTransaction = await response.json();
        
        // Update local array
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
        }
        
        return updatedTransaction;
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
}

function updateAmountLabel() {
    const amountLabel = document.getElementById('amountLabel');
    if (amountLabel) {
        const currencySymbol = getCurrencySymbol();
        amountLabel.textContent = `Amount (${currencySymbol})`;
    }
}

function closeTransactionModal() {
    transactionModal.classList.add('hidden');
    transactionForm.reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
    setTransactionType('income');
    isEditing = false;
    editingTransactionId = null;
    document.getElementById('modalTitle').textContent = 'Add Transaction';
}

async function deleteTransaction(id) {
    // First, prevent any default behavior by using a custom confirm
    const confirmed = await showCustomConfirm('Are you sure you want to delete this transaction?');
    
    if (!confirmed) return;
    
    try {
        await deleteTransactionFromServer(id);
        
        // Update UI
        renderAllTransactionsTable();
        //updateStats();
        //updateSelectedCount();
        
        // Show notification
        showNotification('Transaction deleted successfully!', 'warning');
        updateSummary();
        // Close detail modal if open
        //transactionDetailModal.classList.add('hidden');
    } catch (error) {
        showNotification('Failed to delete transaction', 'error');
        console.log(error);
    }
}

// Add this custom confirmation function to avoid browser's default confirm
async function showCustomConfirm(message) { 
    return new Promise((resolve) => {
    // Create a custom confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    confirmModal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-md">
            <div class="p-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Confirm Delete</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    
                    <div class="flex justify-center space-x-4">
                        <button id="cancelConfirmBtn" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button id="confirmDeleteBtn" class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    // Handle button clicks
    document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
        document.body.removeChild(confirmModal);
        resolve(false);
    });
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        document.body.removeChild(confirmModal);
        if (transactionDetailModal) {
            transactionDetailModal.classList.add('hidden');
        }
        resolve(true);
    });
    
    // Also close when clicking outside
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            document.body.removeChild(confirmModal);
            resolve(false);
        }
    });
    });
}   

async function deleteTransactionFromServer(id) {
    try {  
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete transaction');
        
        // Remove from local array
        transactions = transactions.filter(t => t.id !== id);
        //selectedTransactions.delete(id);
        
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

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

const TOP_COUNT = 3;
const DEFAULT_COLOR = 'bg-gray-500';

const expenseColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500'];
const incomeColors = ['bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];

function generateCategoryHTML(categories, colors, type) {
    if (!categories.length) {
        return `<p class="text-gray-500 text-center py-4">No ${type} data available.</p>`;
    }
    
    return categories.map((category, index) => `
        <div class="flex justify-between items-center">
            <div class="flex items-center">
                <div class="w-3 h-3 rounded-full ${colors[index] || DEFAULT_COLOR} mr-3"></div>
                <span>${category.name || 'Uncategorized'}</span>
            </div>
            <span class="font-medium">${formatCurrency(category.totalAmount || 0)}</span>
        </div>
    `).join('');
}

function getTopCategories(categories, type, limit = TOP_COUNT) {
    return categories
        .filter(cat => cat.type === type)
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
        .slice(0, limit);
}

async function monthlySummaryStats() {
    const topExpensesEl = document.getElementById('topExpenses');
    const topIncomesEl = document.getElementById('topIncomes');
    
    // Clear containers
    topExpensesEl.innerHTML = '';
    topIncomesEl.innerHTML = '';
    
    try {
        const categories = await categoryService.getCategories();
        
        const top3Expenses = getTopCategories(categories, 'expense');
        const top3Incomes = getTopCategories(categories, 'income');
        
        topExpensesEl.innerHTML = generateCategoryHTML(top3Expenses, expenseColors, 'expense');
        topIncomesEl.innerHTML = generateCategoryHTML(top3Incomes, incomeColors, 'income');
        
    } catch (error) {
        console.error('Failed to load summary stats:', error);
        
        const errorMessage = '<p class="text-red-500 text-center py-4">Failed to load data.</p>';
        topExpensesEl.innerHTML = errorMessage;
        topIncomesEl.innerHTML = errorMessage;
    }
}

