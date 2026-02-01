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
    const allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.className = 'checkbox-custom mr-2 w-4 h-4 border border-gray-300 rounded';
    allCheckbox.value = 'all';
    allCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Uncheck all other checkboxes
            document.querySelectorAll('#categoryFilterDropdown input[type="checkbox"][value!="all"]').forEach(cb => {
                cb.checked = false;
            });
        }
        updateCategoryFilterButton();
        renderTransactions();
    });
    allLabel.appendChild(allCheckbox);
    const allSpan = document.createElement('span');
    allSpan.className = 'text-sm';
    allSpan.textContent = 'All Categories';
    allLabel.appendChild(allSpan);
    categoryFilterContainer.appendChild(allLabel);
    
    // Add category options
    allCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer';
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox-custom mr-2 w-4 h-4 border border-gray-300 rounded';
        checkbox.value = category.id;
        checkbox.addEventListener('change', function() {
            // Uncheck "All" if any individual category is checked
            if (this.checked) {
                document.querySelector('#categoryFilterDropdown input[value="all"]').checked = false;
            }
            updateCategoryFilterButton();
            currentPageNumber = 1;
            renderTransactions();
        });
        label.appendChild(checkbox);
        
        // Create category badge with dynamic color
        const badge = document.createElement('span');
        badge.className = 'px-2 py-1 rounded-full text-xs';
        badge.style.backgroundColor = `${category.color}20`; // 20 = 12% opacity
        badge.style.color = category.color;
        badge.textContent = category.name;
        
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

// Helper function to get selected categories from filter checkboxes
function getSelectedCategories() {
    const checkboxes = document.querySelectorAll('#categoryFilterDropdown input[type="checkbox"]:checked');
    const selected = [];
    
    checkboxes.forEach(checkbox => {
        const categoryBadge = checkbox.nextElementSibling;
        if (categoryBadge && checkbox.value !== 'all') {
            // Get category from the checkbox value or find it by name
            const categoryId = checkbox.value;
            if (categoryId) {
                selected.push(categoryId);
            }
        }
    });
    
    return selected;
}

// Helper function to update category filter button text
function updateCategoryFilterButton() {
    const selectedCategories = getSelectedCategories();
    let buttonText = 'Category: All';
    
    if (selectedCategories.length > 0) {
        if (selectedCategories.length === 1) {
            const category = allCategories.find(c => c.id === selectedCategories[0]);
            buttonText = `Category: ${category?.name || selectedCategories[0]}`;
        } else {
            buttonText = `Category: ${selectedCategories.length} selected`;
        }
    }
    
    categoryFilterBtn.innerHTML = `
        <i class="fas fa-tag text-gray-500 mr-2"></i>
        <span>${buttonText}</span>
        <i class="fas fa-chevron-down text-gray-500 ml-2"></i>
    `;
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
        // Get the old transaction to check if category changed and amount difference
        const oldTransaction = transactions.find(t => t.id === id);
        
        const updatedTransaction = await transactionService.updateTransaction(id, transaction);
        
        // Update local array
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
        }
        
        // Update category counts if category changed or amount changed
        const amountDifference = transaction.amount - oldTransaction.amount;
        
        if (oldTransaction && oldTransaction.category !== transaction.category) {
            // Category changed - update both old and new categories
            
            // Decrement old category count and amount
            const oldCategory = allCategories.find(cat => cat.id === oldTransaction.category);
            if (oldCategory) {
                const oldCount = (oldCategory.transactions_count || 0) - 1;
                const oldTotal = (oldCategory.totalAmount || 0) - oldTransaction.amount;
                
                await categoryService.updateCategory(oldCategory.id, {
                    ...oldCategory,
                    transactions_count: oldCount,
                    totalAmount: Math.max(0, oldTotal) // Ensure non-negative
                });
                
                oldCategory.transactions_count = oldCount;
                oldCategory.totalAmount = Math.max(0, oldTotal);
            }
            
            // Increment new category count and amount
            const newCategory = allCategories.find(cat => cat.id === transaction.category);
            if (newCategory) {
                const newCount = (newCategory.transactions_count || 0) + 1;
                const newTotal = (newCategory.totalAmount || 0) + transaction.amount;
                
                await categoryService.updateCategory(newCategory.id, {
                    ...newCategory,
                    transactions_count: newCount,
                    totalAmount: newTotal
                });
                
                newCategory.transactions_count = newCount;
                newCategory.totalAmount = newTotal;
            }
        } else if (amountDifference !== 0) {
            // Same category but amount changed - update category total amount
            const category = allCategories.find(cat => cat.id === transaction.category);
            if (category) {
                const updatedTotal = (category.totalAmount || 0) + amountDifference;
                
                // Ensure total doesn't go negative
                const safeTotal = Math.max(0, updatedTotal);
                
                await categoryService.updateCategory(category.id, {
                    ...category,
                    totalAmount: safeTotal
                });
                
                category.totalAmount = safeTotal;
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
            if (category) {
                const updatedCount = Math.max(0, (category.transactions_count || 0) - 1);
                const updatedTotal = Math.max(0, (category.totalAmount || 0) - transaction.amount);
                
                // Update in database
                await categoryService.updateCategory(category.id, {
                    ...category,
                    transactions_count: updatedCount,
                    totalAmount: updatedTotal
                });
                
                // Update local array
                category.transactions_count = updatedCount;
                category.totalAmount = updatedTotal;
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

    // Set today's date and current time as default in the form
    const now = new Date();
    document.getElementById('transactionDate').valueAsDate = now;
    // Format time as HH:mm for time input
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('transactionTime').value = `${hours}:${minutes}`;
    
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
    
    // Category filter selection
    const categoryCheckboxes = document.querySelectorAll('#categoryFilterDropdown input[type="checkbox"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentPageNumber = 1; // Reset to first page on filter change
            updateCategoryFilterButton();
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
    
    // Export functionality
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportDropdown.classList.toggle('hidden');
        });
    }
    
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }
    
    // Close export dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (exportDropdown && !exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.classList.add('hidden');
        }
    });
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
    const now = new Date();
    document.getElementById('transactionDate').valueAsDate = now;
    // Format time as HH:mm for time input
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('transactionTime').value = `${hours}:${minutes}`;
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
    const time = document.getElementById('transactionTime').value;
    const paymentMethod = document.getElementById('transactionPaymentMethod').value;
    const notes = document.getElementById('transactionNotes').value;
    
    if (!title || !amount || !category || !date || !time || !paymentMethod) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Combine date and time into ISO datetime string
    const dateTime = `${date}T${time}:00`;
    
    const transactionData = {
        title: title,
        amount: amount,
        type: currentTransactionType,
        category: category,
        date: dateTime,
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
        
        // Category filter
        const selectedCategories = getSelectedCategories();
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(transaction.category);
        
        return matchesSearch && matchesType && matchesCategory;
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
        
        // Format date and time
        const dateObj = new Date(transaction.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        // Format amount with appropriate sign
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const amountClass = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
        
        row.innerHTML = `
            <td class="py-4 px-6">
                <input type="checkbox" class="transaction-checkbox checkbox-custom w-4 h-4 border border-gray-300 rounded" data-id="${transaction.id}">
            </td>
            <td class="py-4 px-6 text-gray-700">
                <div>${formattedDate}</div>
                <div class="text-gray-500 text-sm">${formattedTime}</div>
            </td>
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
    const categoryInfo = categoryList.find(c => c.id === transaction.category) || { name: transaction.name, color: 'category-other' };
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
    transactionDetailModal.classList.remove('hidden');
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    isEditing = true;
    editingTransactionId = id;
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    
    // Parse date and time from transaction.date
    // Handle both datetime strings (YYYY-MM-DDTHH:mm:ss) and date-only strings (YYYY-MM-DD)
    let dateObj;
    if (transaction.date.includes('T')) {
        // Already has time
        dateObj = new Date(transaction.date);
    } else {
        // Date only - use current time as default
        dateObj = new Date(transaction.date);
        if (isNaN(dateObj.getTime())) {
            dateObj = new Date();
        }
    }
    
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // Populate form with transaction data
    document.getElementById('transactionTitle').value = transaction.title;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = dateStr;
    document.getElementById('transactionTime').value = timeStr;
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
    // Get the checkbox that triggered the event
    const triggeredCheckbox = event.target;
    const isChecked = triggeredCheckbox.checked;
    
    // Sync both checkboxes
    selectAllCheckbox.checked = isChecked;
    headerCheckbox.checked = isChecked;
    
    const checkboxes = document.querySelectorAll('.transaction-checkbox');
    
    // Clear the set first for consistency
    if (!isChecked) {
        selectedTransactions.clear();
    }
    
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

// Export Functions
function exportToExcel() {
    if (filteredTransactions.length === 0) {
        showNotification('No transactions to export', 'error');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        showNotification('Excel export library is loading. Please try again in a moment.', 'error');
        return;
    }

    try {
        // Prepare data for Excel
        const exportData = filteredTransactions.map(transaction => {
            const dateObj = new Date(transaction.date);
            const categoryInfo = getCategoryInfo(transaction.category);
            
            return {
                'Date': dateObj.toLocaleDateString('en-US'),
                'Time': dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                'Description': transaction.title,
                'Category': categoryInfo.name,
                'Type': transaction.type === 'income' ? 'Income' : 'Expense',
                'Amount': transaction.amount,
                'Payment Method': paymentMethods[transaction.paymentMethod] || transaction.paymentMethod,
                'Notes': transaction.notes || ''
            };
        });

        // Create Excel workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

        // Set column widths
        ws['!cols'] = [
            { wch: 12 }, // Date
            { wch: 12 }, // Time
            { wch: 20 }, // Description
            { wch: 15 }, // Category
            { wch: 10 }, // Type
            { wch: 12 }, // Amount
            { wch: 18 }, // Payment Method
            { wch: 25 }  // Notes
        ];

        // Format header row
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + '1';
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '3B82F6' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];
        const filename = `transactions_${timestamp}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
        showNotification(`Exported ${filteredTransactions.length} transactions to Excel`, 'success');
        closeExportDropdown();
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Failed to export to Excel: ' + error.message, 'error');
    }
}

function exportToPDF(retryCount = 0) {
    if (filteredTransactions.length === 0) {
        showNotification('No transactions to export', 'error');
        return;
    }

    // Check if libraries are available - jsPDF is a UMD module, so check for it correctly
    const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF?.jsPDF || window.jsPDF;
    console.log('Checking libraries - jsPDFLib:', !!jsPDFLib, 'html2canvas:', !!window.html2canvas);
    
    if (!jsPDFLib || !window.html2canvas) {
        // Retry up to 3 times with 1s delay between retries
        if (retryCount < 3) {
            console.log(`Retrying PDF export (attempt ${retryCount + 1}/3)...`);
            setTimeout(() => {
                exportToPDF(retryCount + 1);
            }, 1000);
            return;
        }
        // After 3 retries, show error with debugging info
        console.error('PDF libraries not loaded after retries. jsPDFLib:', jsPDFLib, 'html2canvas:', window.html2canvas);
        showNotification('PDF export libraries not loading. Please refresh the page and try again.', 'error');
        return;
    }

    try {
        showNotification('Generating PDF... This may take a moment', 'info');
        
        // Create a hidden container for PDF content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.top = '-9999px';
        pdfContainer.style.width = '1000px';
        pdfContainer.style.backgroundColor = 'white';
        pdfContainer.style.padding = '20px';
        document.body.appendChild(pdfContainer);

        // Create PDF content HTML
        let htmlContent = `
            <div style="font-family: Arial, sans-serif;">
                <h1 style="color: #1f2937; margin-bottom: 10px; text-align: center;">Transaction Report</h1>
                <p style="color: #6b7280; text-align: center; margin-bottom: 20px;">
                    Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p style="color: #6b7280; margin-bottom: 20px;">Total Transactions: ${filteredTransactions.length}</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #3b82f6; color: white;">
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Date</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Time</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Category</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Type</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Payment</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add transaction rows
        let totalIncome = 0;
        let totalExpense = 0;
        const currencySymbol = getCurrencySymbol();

        filteredTransactions.forEach((transaction, index) => {
            const dateObj = new Date(transaction.date);
            const categoryInfo = getCategoryInfo(transaction.category);
            const isIncome = transaction.type === 'income';
            const rowBg = index % 2 === 0 ? '#f9fafb' : 'white';

            if (isIncome) {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }

            htmlContent += `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e5e7eb;">
                    <td style="border: 1px solid #ddd; padding: 10px;">${dateObj.toLocaleDateString('en-US')}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${transaction.title}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${categoryInfo.name}</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${isIncome ? '#10b981' : '#ef4444'};">
                        <strong>${isIncome ? 'Income' : 'Expense'}</strong>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: ${isIncome ? '#10b981' : '#ef4444'};">
                        <strong>${isIncome ? '+' : '-'}${currencySymbol}${transaction.amount.toFixed(2)}</strong>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${paymentMethods[transaction.paymentMethod] || transaction.paymentMethod}</td>
                </tr>
            `;
        });

        // Add summary
        const netBalance = totalIncome - totalExpense;
        htmlContent += `
                    </tbody>
                </table>
                <div style="margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: right; padding: 8px 0;"><strong>Total Income:</strong></td>
                            <td style="text-align: right; padding: 8px 20px; color: #10b981;"><strong>${currencySymbol}${totalIncome.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td style="text-align: right; padding: 8px 0;"><strong>Total Expenses:</strong></td>
                            <td style="text-align: right; padding: 8px 20px; color: #ef4444;"><strong>${currencySymbol}${totalExpense.toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #f3f4f6; font-size: 16px;">
                            <td style="text-align: right; padding: 12px 0;"><strong>Net Balance:</strong></td>
                            <td style="text-align: right; padding: 12px 20px; color: ${netBalance >= 0 ? '#10b981' : '#ef4444'};"><strong>${currencySymbol}${netBalance.toFixed(2)}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        pdfContainer.innerHTML = htmlContent;

        // Convert HTML to canvas then to PDF using correct jsPDF API
        html2canvas(pdfContainer, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            // Get the jsPDF constructor from the UMD module
            const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF?.jsPDF || window.jsPDF;
            const pdf = new jsPDFConstructor({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdf.internal.pageSize.getHeight() - 10);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().split('T')[0];
            const filename = `transactions_${timestamp}.pdf`;

            pdf.save(filename);
            showNotification(`Exported ${filteredTransactions.length} transactions to PDF`, 'success');
            
            // Clean up
            document.body.removeChild(pdfContainer);
            closeExportDropdown();
        }).catch(error => {
            console.error('Error generating PDF:', error);
            showNotification('Failed to generate PDF: ' + error.message, 'error');
            document.body.removeChild(pdfContainer);
        });
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showNotification('Failed to export to PDF: ' + error.message, 'error');
    }
}

function closeExportDropdown() {
    const exportDropdown = document.getElementById('exportDropdown');
    if (exportDropdown) {
        exportDropdown.classList.add('hidden');
    }
}