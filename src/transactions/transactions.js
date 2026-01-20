import authManager from '../auth/auth.js';
import { API_BASE_URL, showNotification } from '../shared/utils.js';
import { logout } from '../app.js';
import transactionService from '../shared/services/transactionService.js';
import { formatCurrency, getCurrencySymbol } from '../shared/currencyUtils.js';
import categoryService from '../shared/services/categoryService.js';

let incomeCategories = [];
let expenseCategories = [];
let allCategories = [];

async function fetchCategories() {
    try {
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        allCategories = await categoryService.getCategories();
        
        // Filter categories by type
        incomeCategories = allCategories.filter(category => category.type === 'income');
        expenseCategories = allCategories.filter(category => category.type === 'expense');
        
        return allCategories;
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function updateCategoryOptions(type) {
    // Clear current options
    transactionCategory.innerHTML = '';
    
    // Add new options based on type
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a category...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    transactionCategory.appendChild(defaultOption);
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.dataset.color = category.color;
        option.dataset.icon = category.icon;
        transactionCategory.appendChild(option);
    });
    
    // Also update the category filter dropdown
    updateCategoryFilterDropdown();
}

function updateCategoryFilterDropdown() {
    const categoryFilterContainer = document.querySelector('#categoryFilterDropdown .space-y-1');
    if (!categoryFilterContainer) return;
    
    categoryFilterContainer.innerHTML = '';
    
    // Add "All Categories" option
    const allLabel = document.createElement('label');
    allLabel.className = 'flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer';
    allLabel.innerHTML = `
        <input type="checkbox" class="checkbox-custom mr-2 w-4 h-4 border border-gray-300 rounded" data-category="all">
        <span class="text-sm">All Categories</span>
    `;
    categoryFilterContainer.appendChild(allLabel);
    
    // Add category options
    allCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer';
        
        // Create category badge with dynamic color
        const badge = document.createElement('span');
        badge.className = 'px-2 py-1 rounded-full text-xs';
        badge.style.backgroundColor = `${category.color}20`; // 20 = 12% opacity
        badge.style.color = category.color;
        badge.textContent = category.name;
        
        label.innerHTML = `
            <input type="checkbox" class="checkbox-custom mr-2 w-4 h-4 border border-gray-300 rounded" value="${category.id || category.name}">
        `;
        label.appendChild(badge);
        
        categoryFilterContainer.appendChild(label);
    });
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

// Helper function to get category by ID or name
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

// Payment method labels
const paymentMethods = {
    "credit_card": "Credit Card",
    "debit_card": "Debit Card",
    "cash": "Cash",
    "bank_transfer": "Bank Transfer",
    "digital_wallet": "Digital Wallet"
};

// Page definitions
const pages = {
    'dashboard': {
        title: 'Dashboard Overview',
        subtitle: 'Welcome back! Here\'s your financial summary',
        showTabs: true
    },
    'transactions': {
        title: 'Transactions',
        subtitle: 'Manage and track all your income and expenses',
        showTabs: false
    },
    'analytics': {
        title: 'Analytics',
        subtitle: 'Detailed insights into your financial patterns',
        showTabs: false
    },
    'budget': {
        title: 'Budget Planner',
        subtitle: 'Plan and track your monthly budget',
        showTabs: false
    },
    'categories': {
        title: 'Categories',
        subtitle: 'Manage your income and expense categories',
        showTabs: false
    },
    'settings': {
        title: 'Settings',
        subtitle: 'Configure your account and preferences',
        showTabs: false
    }
};

// DOM Elements
const transactionsTableBody = document.getElementById('transactionsTableBody');
const searchInput = document.getElementById('searchInput');
const typeFilterBtn = document.getElementById('typeFilterBtn');
const typeFilterDropdown = document.getElementById('typeFilterDropdown');
const categoryFilterBtn = document.getElementById('categoryFilterBtn');
const categoryFilterDropdown = document.getElementById('categoryFilterDropdown');
const dateFilterBtn = document.getElementById('dateFilterBtn');
const dateFilterDropdown = document.getElementById('dateFilterDropdown');
const moreFiltersBtn = document.getElementById('moreFiltersBtn');
const filterPanel = document.getElementById('filterPanel');
const closeFilterPanel = document.getElementById('closeFilterPanel');
const transactionModal = document.getElementById('transactionModal');
const addTransactionBtn = document.getElementById('openAddModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const incomeTypeBtn = document.getElementById('incomeTypeBtn');
const expenseTypeBtn = document.getElementById('expenseTypeBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionCategory = document.getElementById('transactionCategory');
const toastNotification = document.getElementById('toastNotification');
const selectAllCheckbox = document.getElementById('selectAll');
const headerCheckbox = document.getElementById('headerCheckbox');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const bulkEditBtn = document.getElementById('bulkEditBtn');
const selectedCount = document.getElementById('selectedCount');
const totalCount = document.getElementById('totalCount');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const transactionDetailModal = document.getElementById('transactionDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const dashboardTabs = document.getElementById('dashboardTabs');

// Navigation elements
const dashboardNav = document.getElementById('dashboardNav');
const transactionsNav = document.getElementById('transactionsNav');
const analyticsNav = document.getElementById('analyticsNav');
const budgetNav = document.getElementById('budgetNav');
const categoriesNav = document.getElementById('categoriesNav');
const settingsNav = document.getElementById('settingsNav');

// Page containers
const transactionsPage = document.getElementById('transactionsPage');
const dashboardPage = document.getElementById('dashboardPage');
const otherPages = document.getElementById('otherPages');

// Global variables
let currentTransactionType = 'income';
let selectedTransactions = new Set();
let isEditing = false;
let editingTransactionId = null;
let currentPage = 'transactions';
let transactions = []; // Will be populated from API

// Pagination variables
let currentPageNumber = 1;
let itemsPerPage = 5;
let filteredTransactions = [];

// API Functions
async function fetchTransactions() {
    try {
        loadingState.classList.remove('hidden');
        
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

async function addTransaction(transaction) {
    try {
        const transactionId = `txn-${crypto.randomUUID()}`;
        // Add ID to transaction
        const transactionWithId = {
            id: transactionId,
            ...transaction
        };

        console.log(transaction);
        // Create transaction first
        const newTransaction = await transactionService.createTransaction(transactionWithId);
        transactions.push(newTransaction);

        // Update category transactions_count in database
        const category = allCategories.find(cat => cat.id === transaction.category);
        if (category) {
            const updatedCount = (category.transactions_count || 0) + 1;
            const updatedTotal = (category.totalAmount || 0) + transaction.amount;
            // Update in database
            await categoryService.updateCategory(category.id, {
                ...category,
                transactions_count: updatedCount,
                totalAmount: updatedTotal
            });
            
            // Update local array
            category.transactions_count = updatedCount;
        }

        return newTransaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

async function updateTransaction(id, transaction) {
    try {
        // Get the old transaction to check if category changed
        const oldTransaction = transactions.find(t => t.id === id);
        
        const updatedTransaction = await transactionService.updateTransaction(id, transaction);
        
        // Update local array
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
        }
        
        // Update category counts if category changed
        if (oldTransaction && oldTransaction.category !== transaction.category) {
            // Decrement old category count
            const oldCategory = allCategories.find(cat => cat.id === oldTransaction.category);
            if (oldCategory && oldCategory.transactions_count > 0) {
                const oldCount = (oldCategory.transactions_count || 0) - 1;
                await categoryService.updateCategory(oldCategory.id, {
                    ...oldCategory,
                    transactions_count: oldCount
                });
                oldCategory.transactions_count = oldCount;
            }
            
            // Increment new category count
            const newCategory = allCategories.find(cat => cat.id === transaction.category);
            if (newCategory) {
                const newCount = (newCategory.transactions_count || 0) + 1;
                await categoryService.updateCategory(newCategory.id, {
                    ...newCategory,
                    transactions_count: newCount
                });
                newCategory.transactions_count = newCount;
            }
        }
        
        return updatedTransaction;
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
}

async function deleteTransactionFromServer(id) {
    try {
        // Get the transaction before deleting to update category count
        const transaction = transactions.find(t => t.id === id);
        
        await transactionService.deleteTransaction(id);
        
        // Remove from local array
        transactions = transactions.filter(t => t.id !== id);
        selectedTransactions.delete(id);
        
        // Decrement category transactions_count in database
        if (transaction) {
            const category = allCategories.find(cat => cat.id === transaction.category);
            if (category && category.transactions_count > 0) {
                const updatedCount = (category.transactions_count || 0) - 1;
                
                // Update in database
                await categoryService.updateCategory(category.id, {
                    ...category,
                    transactions_count: updatedCount
                });
                
                // Update local array
                category.transactions_count = updatedCount;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

async function deleteMultipleTransactions(ids) {
    try {
        // Get transactions before deleting to update category counts
        const transactionsToDelete = transactions.filter(t => ids.includes(t.id));
        
        // Group by category to count how many transactions per category
        const categoryCounts = {};
        transactionsToDelete.forEach(transaction => {
            if (transaction.category) {
                categoryCounts[transaction.category] = (categoryCounts[transaction.category] || 0) + 1;
            }
        });
        
        const deletePromises = ids.map(id => transactionService.deleteTransaction(id));
        await Promise.all(deletePromises);
        
        // Remove from local array
        transactions = transactions.filter(t => !ids.includes(t.id));
        selectedTransactions.clear();
        
        // Update category counts in database
        for (const [categoryId, count] of Object.entries(categoryCounts)) {
            const category = allCategories.find(cat => cat.id === categoryId);
            if (category && category.transactions_count >= count) {
                const updatedCount = (category.transactions_count || 0) - count;
                
                // Update in database
                await categoryService.updateCategory(category.id, {
                    ...category,
                    transactions_count: updatedCount
                });
                
                // Update local array
                category.transactions_count = updatedCount;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting transactions:', error);
        throw error;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {

    const isAuthenticated = await authManager.checkAuthStatus();
    
    if (!isAuthenticated) {
        window.location.href = '../auth/login.html';
        return;
    }

    const currentUser = authManager.getCurrentUser();
    console.log('Current user:', currentUser);

    await fetchCategories();

    // Set today's date as default in the form
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Initialize with income categories
    updateCategoryOptions('income');
    
    // Load transactions from server
    loadTransactions();
    
    // Set up event listeners
    setupEventListeners();

    updateAmountLabel();
    
    // Initialize navigation
    navigateTo('transactions');
});

async function loadTransactions() {
    await fetchTransactions();
    renderTransactions();
    updateStats();
}

function setupEventListeners() {
    // Navigation
    //dashboardNav.addEventListener('click', (e) => {
        // e.preventDefault();
        // navigateTo('dashboard');
    //});
    
    //transactionsNav.addEventListener('click', (e) => {
      //  e.preventDefault();
      //  navigateTo('transactions');
    //});
    
    // analyticsNav.addEventListener('click', (e) => {
  //       e.preventDefault();
  //      navigateTo('analytics');
//    });
    
  //   budgetNav.addEventListener('click', (e) => {
  //      e.preventDefault();
  //       navigateTo('budget');
  //   });
    
  //  categoriesNav.addEventListener('click', (e) => {
  //      e.preventDefault();
  //       navigateTo('categories');
  //  });
    
  //  settingsNav.addEventListener('click', (e) => {
  //      e.preventDefault();
    //     navigateTo('settings');
  //  });
    
    // Open add transaction modal
    addTransactionBtn.addEventListener('click', () => {
        isEditing = false;
        editingTransactionId = null;
        document.getElementById('modalTitle').textContent = 'Add Transaction';
        updateAmountLabel();
        transactionModal.classList.remove('hidden');
    });
    
    // Close modal
    closeModal.addEventListener('click', closeTransactionModal);
    cancelBtn.addEventListener('click', closeTransactionModal);
    
    // Close modal when clicking outside
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            closeTransactionModal();
        }
    });
    
    // Close detail modal
    closeDetailModal.addEventListener('click', () => {
        transactionDetailModal.classList.add('hidden');
    });
    
    // Transaction type toggle
    incomeTypeBtn.addEventListener('click', () => {
        setTransactionType('income');
    });
    
    expenseTypeBtn.addEventListener('click', () => {
        setTransactionType('expense');
    });
    
    // Form submission
    transactionForm.addEventListener('submit', saveTransaction);
    
    // Filter dropdowns
    typeFilterBtn.addEventListener('click', toggleTypeFilter);
    categoryFilterBtn.addEventListener('click', toggleCategoryFilter);
    dateFilterBtn.addEventListener('click', toggleDateFilter);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!typeFilterBtn.contains(e.target) && !typeFilterDropdown.contains(e.target)) {
            typeFilterDropdown.classList.add('hidden');
        }
        if (!categoryFilterBtn.contains(e.target) && !categoryFilterDropdown.contains(e.target)) {
            categoryFilterDropdown.classList.add('hidden');
        }
        if (!dateFilterBtn.contains(e.target) && !dateFilterDropdown.contains(e.target)) {
            dateFilterDropdown.classList.add('hidden');
        }
    });
    
    // More filters panel
    moreFiltersBtn.addEventListener('click', () => {
        filterPanel.classList.remove('translate-x-full');
    });
    
    closeFilterPanel.addEventListener('click', () => {
        filterPanel.classList.add('translate-x-full');
    });
    
    // Search functionality
    searchInput.addEventListener('input', debounce(() => {
        currentPageNumber = 1; // Reset to first page on search
        renderTransactions();
    }, 300));
    
    // Type filter selection
    document.querySelectorAll('input[name="typeFilter"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[name="typeFilter"]:checked').value;
            typeFilterBtn.innerHTML = `
                <i class="fas fa-filter text-gray-500 mr-2"></i>
                <span>Type: ${selectedValue === 'all' ? 'All' : selectedValue === 'income' ? 'Income' : 'Expenses'}</span>
                <i class="fas fa-chevron-down text-gray-500 ml-2"></i>
            `;
            currentPageNumber = 1; // Reset to first page on filter change
            renderTransactions();
        });
    });
    
    // Date filter custom range
    document.querySelectorAll('input[name="dateFilter"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[name="dateFilter"]:checked').value;
            const customDateRange = document.getElementById('customDateRange');
            
            if (selectedValue === 'custom') {
                customDateRange.classList.remove('hidden');
            } else {
                customDateRange.classList.add('hidden');
            }
            
            dateFilterBtn.innerHTML = `
                <i class="fas fa-calendar text-gray-500 mr-2"></i>
                <span>Date: ${selectedValue === 'today' ? 'Today' : selectedValue === 'week' ? 'This Week' : selectedValue === 'month' ? 'This Month' : selectedValue === 'year' ? 'This Year' : 'Custom'}</span>
                <i class="fas fa-chevron-down text-gray-500 ml-2"></i>
            `;
        });
    });
    
    // Bulk actions
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    headerCheckbox.addEventListener('change', toggleSelectAll);
    bulkDeleteBtn.addEventListener('click', deleteSelectedTransactions);
    bulkEditBtn.addEventListener('click', editSelectedTransactions);
    
    // Add first transaction button
    document.getElementById('addFirstTransactionBtn').addEventListener('click', () => {
        addTransactionBtn.click();
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', () => {
        document.getElementById('logoutModal').classList.remove('hidden');
    });
    
    cancelLogoutBtn.addEventListener('click', () => {
        document.getElementById('logoutModal').classList.add('hidden');
    });
    
    confirmLogoutBtn.addEventListener('click', () => {
        logout();
    });
    
    // Toggle sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });
    
    // Go to transactions from other pages
    document.getElementById('goToTransactionsFromDashboard')?.addEventListener('click', () => {
        navigateTo('transactions');
    });
    
    document.getElementById('goToTransactionsFromOther')?.addEventListener('click', () => {
        navigateTo('transactions');
    });
    
    // Pagination event listeners
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const rowsPerPageSelect = document.getElementById('rowsPerPageSelect');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPageNumber > 1) {
                goToPage(currentPageNumber - 1);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
            if (currentPageNumber < totalPages) {
                goToPage(currentPageNumber + 1);
            }
        });
    }
    
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPageNumber = 1; // Reset to first page when changing items per page
            renderTransactions();
        });
    }
}

function navigateTo(page) {
    // Update current page
    currentPage = page;
    
    // Update page title and subtitle
    pageTitle.textContent = pages[page].title;
    pageSubtitle.textContent = pages[page].subtitle;
    
    // Show/hide dashboard tabs
    if (pages[page].showTabs) {
        dashboardTabs.classList.remove('hidden');
    } else {
        dashboardTabs.classList.add('hidden');
    }

    
    // Show the correct page content
    if (page === 'transactions') {
        transactionsPage.classList.remove('hidden');
        dashboardPage.classList.add('hidden');
        otherPages.classList.add('hidden');
        // Refresh transactions data
        loadTransactions();
    } else if (page === 'dashboard') {
        transactionsPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        otherPages.classList.add('hidden');
    } else {
        transactionsPage.classList.add('hidden');
        dashboardPage.classList.add('hidden');
        otherPages.classList.remove('hidden');
        
        // Update other page content
        document.getElementById('otherPageTitle').textContent = pages[page].title;
        document.getElementById('otherPageDescription').textContent = pages[page].subtitle;
    }
}

function toggleTypeFilter() {
    typeFilterDropdown.classList.toggle('hidden');
    categoryFilterDropdown.classList.add('hidden');
    dateFilterDropdown.classList.add('hidden');
}

function toggleCategoryFilter() {
    categoryFilterDropdown.classList.toggle('hidden');
    typeFilterDropdown.classList.add('hidden');
    dateFilterDropdown.classList.add('hidden');
}

function toggleDateFilter() {
    dateFilterDropdown.classList.toggle('hidden');
    typeFilterDropdown.classList.add('hidden');
    categoryFilterDropdown.classList.add('hidden');
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

function closeTransactionModal() {
    transactionModal.classList.add('hidden');
    transactionForm.reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
    setTransactionType('income');
    isEditing = false;
    editingTransactionId = null;
    document.getElementById('modalTitle').textContent = 'Add Transaction';
}

async function saveTransaction(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('transactionTitle').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const paymentMethod = document.getElementById('transactionPaymentMethod').value;
    const notes = document.getElementById('transactionNotes').value;
    
    if (!title || !amount || !category || !date || !paymentMethod) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
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
        updateSelectedCount();
        updateStats();
        
        // Close modal and reset form
        closeTransactionModal();
    } catch (error) {
        showNotification('Failed to save transaction', error);
    }
}

function renderTransactions() {
    // Only render if we're on the transactions page
    if (currentPage !== 'transactions') return;
    
    // First hide both states
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    
    if (!loadingState.classList.contains('hidden')) {
        return;
    }
    
    transactionsTableBody.innerHTML = '';
    
    // Get search term
    const searchTerm = searchInput.value.toLowerCase();
    
    // Get selected type filter
    const typeFilter = document.querySelector('input[name="typeFilter"]:checked')?.value || 'all';
    
    // Filter transactions
    filteredTransactions = transactions.filter(transaction => {
        // Search filter
        const matchesSearch = transaction.title.toLowerCase().includes(searchTerm) || 
                            (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm));
        
        // Type filter
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    if (filteredTransactions.length === 0) {
        emptyState.classList.remove('hidden');
        totalCount.textContent = '0';
        updatePaginationUI(0);
        return;
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (currentPageNumber > totalPages && totalPages > 0) {
        currentPageNumber = totalPages;
    }
    
    // Get transactions for current page
    const startIndex = (currentPageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Render each transaction for current page
    paginatedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'table-row border-b border-gray-100';
        row.dataset.id = transaction.id;
        
        // Get category info dynamically
        const categoryInfo = getCategoryInfo(transaction.category);
        const colorClass = getCategoryColorClass(categoryInfo.color);
        
        // Format date
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Format amount with appropriate sign
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const amountClass = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
        
        row.innerHTML = `
            <td class="py-4 px-6">
                <input type="checkbox" class="transaction-checkbox checkbox-custom w-4 h-4 border border-gray-300 rounded" data-id="${transaction.id}">
            </td>
            <td class="py-4 px-6 text-gray-700">${formattedDate}</td>
            <td class="py-4 px-6">
                <div class="font-medium text-gray-800">${transaction.title}</div>
                <div class="text-gray-500 text-sm mt-1">${transaction.notes || ''}</div>
            </td>
            <td class="py-4 px-6">
                <span class="px-3 py-1.5 rounded-full text-xs font-medium ${colorClass}">
                    ${categoryInfo.name}
                </span>
            </td>
            <td class="py-4 px-6 text-gray-700">${paymentMethods[transaction.paymentMethod]}</td>
            <td class="py-4 px-6">
                <span class="px-3 py-1.5 rounded-full text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${transaction.type === 'income' ? 'Income' : 'Expense'}
                </span>
            </td>
            <td class="py-4 px-6 font-bold ${amountClass}">
                ${amountSign}${formatCurrency(transaction.amount.toFixed(2))}
            </td>
            <td class="py-4 px-6">
                <div class="flex space-x-2">
                    <button type="button" class="view-btn text-blue-600 hover:text-blue-800" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="edit-btn text-gray-600 hover:text-gray-800" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="delete-btn text-red-600 hover:text-red-800" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        transactionsTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            viewTransaction(transactionId);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const transactionId = this.getAttribute('data-id');
            
            if (this.checked) {
                selectedTransactions.add(transactionId);
            } else {
                selectedTransactions.delete(transactionId);
                selectAllCheckbox.checked = false;
                headerCheckbox.checked = false;
            }
            
            updateSelectedCount();
            updateBulkActions();
            updateStats();
        });
    });
    
    // Update total count
    totalCount.textContent = filteredTransactions.length;
    updateSelectedCount();
    
    // Update pagination UI
    updatePaginationUI(filteredTransactions.length);
}

function updatePaginationUI(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationPages = document.getElementById('paginationPages');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const showingRange = document.getElementById('showingRange');
    const totalFilteredCount = document.getElementById('totalFilteredCount');
    
    if (!paginationPages || !prevPageBtn || !nextPageBtn || !showingRange || !totalFilteredCount) {
        return;
    }
    
    // Update showing range
    if (totalItems === 0) {
        showingRange.textContent = '0-0';
        totalFilteredCount.textContent = '0';
    } else {
        const start = ((currentPageNumber - 1) * itemsPerPage) + 1;
        const end = Math.min(currentPageNumber * itemsPerPage, totalItems);
        showingRange.textContent = `${start}-${end}`;
        totalFilteredCount.textContent = totalItems.toString();
    }
    
    // Clear pagination buttons
    paginationPages.innerHTML = '';
    
    // Generate page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPageNumber - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    prevPageBtn.disabled = currentPageNumber === 1;
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `w-10 h-10 rounded-lg hover:bg-gray-100 ${i === currentPageNumber ? 'pagination-active' : 'text-gray-700'}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPageNumber = i;
            renderTransactions();
        });
        paginationPages.appendChild(pageBtn);
    }
    
    // Next button
    nextPageBtn.disabled = currentPageNumber === totalPages || totalPages === 0;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPageNumber = page;
        renderTransactions();
        // Scroll to top of table
        const tableContainer = document.querySelector('.overflow-x-auto');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function updateStats() {
    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    let currentMonthCount = 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
        
        // Count current month transactions
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            currentMonthCount++;
        }
    });
    
    // Update UI
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = transactions.length;
    document.getElementById('monthTransactions').textContent = currentMonthCount;
}

function viewTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Find category label
    const categoryList = transaction.type === 'income' ? incomeCategories : expenseCategories;
    const categoryInfo = categoryList.find(c => c.value === transaction.category) || { label: transaction.category, color: 'category-other' };
    
    // Format date
    const dateObj = new Date(transaction.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' • ' + 
                          dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Update modal content
    document.getElementById('detailDescription').textContent = transaction.title;
    document.getElementById('detailAmount').textContent = `${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}`;
    document.getElementById('detailAmount').className = `text-3xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`;
    document.getElementById('detailCategory').textContent = categoryInfo.label;
    document.getElementById('detailCategory').className = `${categoryInfo.color} px-3 py-1.5 rounded-full text-sm font-medium`;
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
    transactionDetailModal.classList.remove('hidden');
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
    
    //update amount label
    updateAmountLabel();
    // Show modal
    transactionModal.classList.remove('hidden');
}

async function deleteTransaction(id) {
    // First, prevent any default behavior by using a custom confirm
    const confirmed = await showCustomConfirm('Are you sure you want to delete this transaction?');
    
    if (!confirmed) return;
    
    try {
        await deleteTransactionFromServer(id);
        
        // Update UI
        renderTransactions();
        updateStats();
        updateSelectedCount();
        updateStats();
        // Show notification
        showNotification('Transaction deleted successfully!', 'warning');
        
        // Close detail modal if open
        transactionDetailModal.classList.add('hidden');
    } catch (error) {
        showNotification('Failed to delete transaction', 'error');
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

function toggleSelectAll() {
    const isChecked = selectAllCheckbox.checked || headerCheckbox.checked;
    const checkboxes = document.querySelectorAll('.transaction-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const transactionId = checkbox.getAttribute('data-id');
        
        if (isChecked) {
            selectedTransactions.add(transactionId);
        } else {
            selectedTransactions.delete(transactionId);
        }
    });
    
    updateSelectedCount();
    updateBulkActions();
}

function updateSelectedCount() {
    const selected = selectedTransactions.size;
    selectedCount.textContent = selected;
    
    // Update select all checkboxes
    const totalCheckboxes = document.querySelectorAll('.transaction-checkbox').length;
    const allChecked = totalCheckboxes > 0 && selected === totalCheckboxes;
    
    selectAllCheckbox.checked = allChecked;
    headerCheckbox.checked = allChecked;
}

function updateBulkActions() {
    const hasSelected = selectedTransactions.size > 0;
    
    bulkDeleteBtn.disabled = !hasSelected;
    bulkEditBtn.disabled = !hasSelected || selectedTransactions.size !== 1;
}

async function deleteSelectedTransactions() {
    if (selectedTransactions.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction(s)?`)) {
        try {
            const ids = Array.from(selectedTransactions);
            await deleteMultipleTransactions(ids);
            
            // Update UI
            renderTransactions();
            updateStats();
            updateSelectedCount();
            
            // Show notification
            showNotification(`${ids.length} transaction(s) deleted successfully!`, 'warning');
        } catch (error) {
            showNotification('Failed to delete transactions', 'error');
        }
    }
}

function editSelectedTransactions() {
    if (selectedTransactions.size !== 1) return;
    
    const transactionId = Array.from(selectedTransactions)[0];
    editTransaction(transactionId);
}



document.getElementById('notificationToast').addEventListener('click', function() {
    this.classList.remove('notification-slide-in');
    this.classList.add('notification-slide-out');
    
    setTimeout(() => {
        this.classList.add('hidden');
        this.classList.remove('notification-slide-out');
        // Clear the timeout if notification was manually dismissed
        if (window.notificationTimeout) {
            clearTimeout(window.notificationTimeout);
        }
    }, 300);
});

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateAmountLabel() {
    const amountLabel = document.getElementById('amountLabel');
    if (amountLabel) {
        const currencySymbol = getCurrencySymbol();
        amountLabel.textContent = `Amount (${currencySymbol})`;
    }
}