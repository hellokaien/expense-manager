// src/budget-planner/budget.js
import authManager from '../auth/auth.js';
import { showNotification, API_BASE_URL, getInitials } from '../shared/utils.js';
import { logout } from '../app.js';
import budgetService from '../shared/services/budgetService.js';
import transactionService from '../shared/services/transactionService.js';
import categoryService from '../shared/services/categoryService.js';

// Global data
let budgetCategories = [];
let savingsGoals = [];
let budgetHistory = [];
let transactions = [];
let allCategories = [];
let currentBudget = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let isEditingBudget = false;

// DOM Elements
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const budgetTabBtns = document.querySelectorAll('.budget-tab-btn');
const budgetTabContents = document.querySelectorAll('.budget-tab-content');
const createBudgetBtn = document.getElementById('createBudgetBtn');
const createBudgetModal = document.getElementById('createBudgetModal');
const closeCreateBudgetModal = document.getElementById('closeCreateBudgetModal');
const cancelCreateBudget = document.getElementById('cancelCreateBudget');
const createBudgetForm = document.getElementById('createBudgetForm');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addCategoryModal = document.getElementById('addCategoryModal');
const closeAddCategoryModal = document.getElementById('closeAddCategoryModal');
const cancelAddCategory = document.getElementById('cancelAddCategory');
const addCategoryForm = document.getElementById('addCategoryForm');
const addGoalBtn = document.getElementById('addGoalBtn');
const addGoalModal = document.getElementById('addGoalModal');
const closeAddGoalModal = document.getElementById('closeAddGoalModal');
const cancelAddGoal = document.getElementById('cancelAddGoal');
const addGoalForm = document.getElementById('addGoalForm');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const monthSelect = document.getElementById('monthSelect');
const deleteBudgetBtn = document.getElementById('deleteBudgetBtn');
const editBudgetBtn = document.getElementById('editBudgetBtn');
const budgetActions = document.getElementById('budgetActions');
const currentBudgetName = document.getElementById('currentBudgetName');
const currentBudgetPeriod = document.getElementById('currentBudgetPeriod');
const budgetModalTitle = document.getElementById('budgetModalTitle');
const submitBudgetBtn = document.getElementById('submitBudgetBtn');

// Navigation elements
const dashboardNav = document.getElementById('dashboardNav');
const transactionsNav = document.getElementById('transactionsNav');
const analyticsNav = document.getElementById('analyticsNav');
const budgetNav = document.getElementById('budgetNav');
const categoriesNav = document.getElementById('categoriesNav');
const settingsNav = document.getElementById('settingsNav');

// Chart instances
let budgetVsActualChart, budgetDistributionChart, budgetHistoryChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check authentication
        const isAuthenticated = await authManager.checkAuthStatus();
        
        if (!isAuthenticated) {
            window.location.href = '../auth/login.html';
            return;
        }

        const currentUser = authManager.getCurrentUser();
        updateUserInfo(currentUser);

        // Load data
        await loadData();

        // Initialize UI
        initializeCharts();
        populateCategories();
        populateGoals();
        populateBudgetHistory();
        updateBudgetSummary();
        setupEventListeners();
        initializeDragAndDrop();
        updateMonthSelector();
        updateCreateBudgetButton();
    } catch (error) {
        console.error('Error initializing budget planner:', error);
        showNotification('Failed to load budget data', 'error');
    }
});

async function loadData() {
    try {
        // Load transactions to calculate spending
        transactions = await transactionService.getTransactions();
        
        // Load categories
        allCategories = await categoryService.getCategories();
        
        // Load budgets - handle 404 gracefully
        try {
            const budgets = await budgetService.getBudgets();
            console.log('Loaded budgets:', budgets);
            console.log('Current month/year:', currentMonth, currentYear);
            
            if (budgets && Array.isArray(budgets) && budgets.length > 0) {
                // Find budget for the selected month/year - don't fall back to first budget
                // A budget belongs to a month if its startDate or endDate falls within that month
                const budgetForMonth = budgets.find(b => {
                    if (!b || !b.startDate || !b.endDate) return false;
                    
                    const budgetStart = new Date(b.startDate);
                    const budgetEnd = new Date(b.endDate);
                    
                    if (isNaN(budgetStart.getTime()) || isNaN(budgetEnd.getTime())) return false;
                    
                    const budgetStartMonth = budgetStart.getMonth();
                    const budgetStartYear = budgetStart.getFullYear();
                    const budgetEndMonth = budgetEnd.getMonth();
                    const budgetEndYear = budgetEnd.getFullYear();
                    
                    // Check if budget's primary month matches (use start date as primary indicator)
                    // But also check if end date is in the same month
                    const isStartInTargetMonth = budgetStartMonth === currentMonth && budgetStartYear === currentYear;
                    const isEndInTargetMonth = budgetEndMonth === currentMonth && budgetEndYear === currentYear;
                    
                    console.log(`Checking budget: ${b.name} - Start: ${budgetStartMonth}/${budgetStartYear}, End: ${budgetEndMonth}/${budgetEndYear} vs Current: ${currentMonth}/${currentYear}`);
                    
                    return isStartInTargetMonth || isEndInTargetMonth;
                });
                
                // Only set currentBudget if we found one for this month
                currentBudget = budgetForMonth || null;
                console.log('Selected budget for month:', currentBudget);
            } else {
                currentBudget = null;
            }
            
            // Load budget categories only if we have a budget for this month
            if (currentBudget) {
                try {
                    budgetCategories = await budgetService.getBudgetCategories(currentBudget.id);
                    console.log('Loaded budget categories:', budgetCategories);
                    // Calculate actual spending from transactions
                    budgetCategories = budgetCategories.map(cat => {
                        const spent = calculateCategorySpending(cat.categoryId || cat.category);
                        return { ...cat, spent };
                    });
                } catch (error) {
                    console.warn('No budget categories found:', error);
                    budgetCategories = [];
                }
            } else {
                // No budget for this month - clear categories
                budgetCategories = [];
            }
        } catch (error) {
            console.warn('Budgets endpoint not available, using defaults:', error);
            currentBudget = null;
            budgetCategories = [];
        }
        
        // Load savings goals - handle 404 gracefully
        try {
            savingsGoals = await budgetService.getSavingsGoals();
        } catch (error) {
            console.warn('Savings goals endpoint not available, using defaults:', error);
            savingsGoals = [];
        }
        
        // Calculate budget history
        calculateBudgetHistory();
    } catch (error) {
        console.error('Error loading data:', error);
        // Use default data if API fails
        if (budgetCategories.length === 0) {
            budgetCategories = getDefaultBudgetCategories();
        }
        if (savingsGoals.length === 0) {
            savingsGoals = getDefaultSavingsGoals();
        }
        if (budgetHistory.length === 0) {
            budgetHistory = getDefaultBudgetHistory();
        }
    }
}

function calculateCategorySpending(categoryId) {
    if (!transactions || !categoryId) return 0;
    
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    return transactions
        .filter(t => {
            if (t.type !== 'expense') return false;
            if (t.category !== categoryId) return false;
            const tDate = new Date(t.date);
            return tDate >= currentMonthStart && tDate <= currentMonthEnd;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
}

function calculateBudgetHistory() {
    // Calculate history from transactions and budgets
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });
        
        const spent = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const budget = currentBudget ? currentBudget.totalAmount : 3500;
        const saved = budget - spent;
        
        let status = 'good';
        if (saved < 0) status = 'danger';
        else if (spent / budget > 0.9) status = 'warning';
        
        months.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            budget,
            spent,
            saved,
            status
        });
    }
    budgetHistory = months;
}

function getDefaultBudgetCategories() {
    return [
        { id: 1, name: 'Food & Dining', budget: 700, spent: 0, icon: 'utensils', color: 'yellow', type: 'essential' },
        { id: 2, name: 'Shopping', budget: 500, spent: 0, icon: 'shopping-bag', color: 'purple', type: 'discretionary' },
        { id: 3, name: 'Bills & Utilities', budget: 350, spent: 0, icon: 'home', color: 'green', type: 'essential' },
        { id: 4, name: 'Transportation', budget: 250, spent: 0, icon: 'car', color: 'blue', type: 'essential' },
        { id: 5, name: 'Entertainment', budget: 200, spent: 0, icon: 'film', color: 'pink', type: 'discretionary' }
    ];
}

function getDefaultSavingsGoals() {
    return [
        { id: 1, name: 'Emergency Fund', target: 5000, saved: 0, progress: 0, deadline: new Date(currentYear, currentMonth + 3, 1).toISOString().split('T')[0], monthly: 500 },
        { id: 2, name: 'Vacation Fund', target: 3000, saved: 0, progress: 0, deadline: new Date(currentYear, currentMonth + 6, 1).toISOString().split('T')[0], monthly: 300 }
    ];
}

function getDefaultBudgetHistory() {
    return [];
}

function updateUserInfo(currentUser) {
    if (!currentUser) return;
    
    const firstName = currentUser.firstName || 'John';
    const lastName = currentUser.lastName || 'Doe';
    const initials = getInitials(firstName, lastName);
    
    const userProfile = document.querySelector('.flex.items-center.mb-8');
    if (userProfile) {
        const initialsDiv = userProfile.querySelector('.w-10.h-10');
        const nameDiv = userProfile.querySelector('.ml-3');
        
        if (initialsDiv) {
            initialsDiv.innerHTML = `<span class="font-bold">${initials}</span>`;
        }
        
        if (nameDiv) {
            nameDiv.innerHTML = `
                <p class="font-medium user-name">${firstName} ${lastName}</p>
                <p class="text-gray-400 text-sm">${currentUser.premiumTrial ? 'Premium User' : 'Free User'}</p>
            `;
        }
    }
}

function setupEventListeners() {
    // Toggle sidebar
    toggleSidebarBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });
    
    // Budget tabs
    budgetTabBtns.forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            budgetTabBtns.forEach(btn => {
                btn.classList.remove('budget-tab-active');
                btn.classList.add('budget-tab-inactive');
            });
            
            this.classList.remove('budget-tab-inactive');
            this.classList.add('budget-tab-active');
            
            budgetTabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            const contentEl = document.getElementById(`${tab}Content`);
            if (contentEl) {
                contentEl.classList.remove('hidden');
            }
        });
    });
    
    // Month navigation
    prevMonthBtn?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateMonthSelector();
        loadData().then(() => {
            updateBudgetSummary();
            populateCategories();
            populateBudgetHistory();
            initializeCharts();
            updateCreateBudgetButton();
        });
    });
    
    nextMonthBtn?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateMonthSelector();
        loadData().then(() => {
            updateBudgetSummary();
            populateCategories();
            populateBudgetHistory();
            initializeCharts();
            updateCreateBudgetButton();
        });
    });
    
    monthSelect?.addEventListener('change', () => {
        const value = monthSelect.value;
        const [year, month] = value.split('-').map(Number);
        currentYear = year;
        currentMonth = month - 1;
        loadData().then(() => {
            updateBudgetSummary();
            populateCategories();
            populateBudgetHistory();
            initializeCharts();
            updateCreateBudgetButton();
        });
    });
    
    // Create budget modal
    createBudgetBtn?.addEventListener('click', () => {
        isEditingBudget = false;
        prefillBudgetForm();
        updateBudgetModalForCreate();
        createBudgetModal.classList.remove('hidden');
    });
    
    // Edit budget button
    editBudgetBtn?.addEventListener('click', () => {
        if (!currentBudget) return;
        isEditingBudget = true;
        populateBudgetFormForEdit();
        updateBudgetModalForEdit();
        createBudgetModal.classList.remove('hidden');
    });
    
    closeCreateBudgetModal?.addEventListener('click', () => {
        createBudgetModal.classList.add('hidden');
        createBudgetForm.reset();
        isEditingBudget = false;
    });
    
    cancelCreateBudget?.addEventListener('click', () => {
        createBudgetModal.classList.add('hidden');
        createBudgetForm.reset();
        isEditingBudget = false;
    });
    
    // Close modal when clicking outside
    createBudgetModal?.addEventListener('click', (e) => {
        if (e.target === createBudgetModal) {
            createBudgetModal.classList.add('hidden');
        }
    });
    
    createBudgetForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            
            // Format dates as YYYY-MM-DD without timezone conversion
            const formatDateString = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            let startDate, endDate;
            
            // If editing, use existing budget dates; otherwise calculate new dates
            if (isEditingBudget && currentBudget) {
                startDate = currentBudget.startDate;
                endDate = currentBudget.endDate;
            } else {
                // Automatically set dates to first and last day of current month
                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
                startDate = formatDateString(firstDay);
                endDate = formatDateString(lastDay);
            }
            
            const budgetData = {
                name: formData.get('name'),
                totalAmount: parseFloat(formData.get('amount')),
                startDate: startDate,
                endDate: endDate,
                description: formData.get('description') || '',
                recurring: formData.get('recurring') === 'on'
            };
            
            if (!budgetData.name || !budgetData.totalAmount) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Check if budget already exists for this month
            const budgets = await budgetService.getBudgets();
            if (!budgets || !Array.isArray(budgets)) {
                console.error('Invalid budgets response:', budgets);
                showNotification('Error checking for existing budgets', 'error');
                return;
            }
            
            // If editing, update the existing budget
            if (isEditingBudget && currentBudget) {
                await budgetService.updateBudget(currentBudget.id, budgetData);
                showNotification('Budget updated successfully!', 'success');
                createBudgetModal.classList.add('hidden');
                createBudgetForm.reset();
                isEditingBudget = false;
                
                // Reload all data to get the updated budget
                await loadData();
                updateBudgetSummary();
                populateCategories();
                populateBudgetHistory();
                initializeCharts();
                updateCreateBudgetButton();
                return;
            }
            
            // If creating, check for existing budget
            // Check for existing budget for this month/year
            // A budget belongs to a month if its startDate or endDate falls within that month
            const targetMonthStart = new Date(currentYear, currentMonth, 1);
            const targetMonthEnd = new Date(currentYear, currentMonth + 1, 0);
            
            const existingBudget = budgets.find(b => {
                if (!b || !b.startDate || !b.endDate) return false;
                
                const budgetStart = new Date(b.startDate);
                const budgetEnd = new Date(b.endDate);
                
                // Check if the dates are valid
                if (isNaN(budgetStart.getTime()) || isNaN(budgetEnd.getTime())) return false;
                
                // Check if the budget overlaps with the target month
                // Budget belongs to a month if:
                // 1. Budget start date is in the target month, OR
                // 2. Budget end date is in the target month, OR
                // 3. Budget spans the entire target month
                const budgetStartMonth = budgetStart.getMonth();
                const budgetStartYear = budgetStart.getFullYear();
                const budgetEndMonth = budgetEnd.getMonth();
                const budgetEndYear = budgetEnd.getFullYear();
                
                // Check if budget's primary month matches (use start date as primary indicator)
                // But also check if end date is in the same month
                const isStartInTargetMonth = budgetStartMonth === currentMonth && budgetStartYear === currentYear;
                const isEndInTargetMonth = budgetEndMonth === currentMonth && budgetEndYear === currentYear;
                
                return isStartInTargetMonth || isEndInTargetMonth;
            });
            
            if (existingBudget) {
                const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                showNotification(`A budget already exists for ${monthName}. You can only create one budget per month. Please delete the existing budget first or select a different month.`, 'error');
                return;
            }
            
            const newBudget = await budgetService.createBudget(budgetData);
            console.log('Budget created:', newBudget);
            showNotification('Budget created successfully!', 'success');
            createBudgetModal.classList.add('hidden');
            createBudgetForm.reset();
            
            // Reload all data to get the newly created budget
            await loadData();
            console.log('After loadData - currentBudget:', currentBudget);
            console.log('After loadData - budgetCategories:', budgetCategories);
            
            // Update UI components
            updateBudgetSummary();
            populateCategories();
            populateBudgetHistory();
            initializeCharts();
            updateCreateBudgetButton();
        } catch (error) {
            console.error('Error creating budget:', error);
            showNotification('Failed to create budget', 'error');
        }
    });
    
    // Add category modal
    addCategoryBtn?.addEventListener('click', () => {
        addCategoryModal.classList.remove('hidden');
    });
    
    closeAddCategoryModal?.addEventListener('click', () => {
        addCategoryModal.classList.add('hidden');
    });
    
    cancelAddCategory?.addEventListener('click', () => {
        addCategoryModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    addCategoryModal?.addEventListener('click', (e) => {
        if (e.target === addCategoryModal) {
            addCategoryModal.classList.add('hidden');
        }
    });
    
    addCategoryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            if (!currentBudget) {
                showNotification('Please create a budget first', 'warning');
                return;
            }
            
            const formData = new FormData(e.target);
            const categoryData = {
                budgetId: currentBudget.id,
                name: formData.get('name'),
                budget: parseFloat(formData.get('amount')),
                categoryId: formData.get('category') || '',
                type: formData.get('type'),
                icon: formData.get('icon') || 'tag'
            };
            
            if (!categoryData.name || !categoryData.budget || !categoryData.type) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            await budgetService.createBudgetCategory(categoryData);
            showNotification('Category added successfully!', 'success');
            addCategoryModal.classList.add('hidden');
            addCategoryForm.reset();
            await loadData();
            populateCategories();
        } catch (error) {
            console.error('Error adding category:', error);
            showNotification('Failed to add category', 'error');
        }
    });
    
    // Add goal modal
    addGoalBtn?.addEventListener('click', () => {
        addGoalModal.classList.remove('hidden');
    });
    
    closeAddGoalModal?.addEventListener('click', () => {
        addGoalModal.classList.add('hidden');
    });
    
    cancelAddGoal?.addEventListener('click', () => {
        addGoalModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    addGoalModal?.addEventListener('click', (e) => {
        if (e.target === addGoalModal) {
            addGoalModal.classList.add('hidden');
        }
    });
    
    addGoalForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const goalData = {
                name: formData.get('name'),
                target: parseFloat(formData.get('target')),
                startDate: formData.get('startDate'),
                deadline: formData.get('deadline'),
                monthly: parseFloat(formData.get('monthly')),
                saved: 0
            };
            
            if (!goalData.name || !goalData.target || !goalData.startDate || !goalData.deadline || !goalData.monthly) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            await budgetService.createSavingsGoal(goalData);
            showNotification('Savings goal added successfully!', 'success');
            addGoalModal.classList.add('hidden');
            addGoalForm.reset();
            await loadData();
            populateGoals();
        } catch (error) {
            console.error('Error adding goal:', error);
            showNotification('Failed to add savings goal', 'error');
        }
    });
    
    // Icon selection
    document.querySelectorAll('input[name="icon"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('input[name="icon"]').forEach(r => {
                const div = r.closest('label')?.querySelector('div');
                if (div) {
                    div.classList.remove('border-2', 'border-yellow-500', 'border-blue-500', 'border-green-500', 'border-purple-500', 'border-pink-500');
                }
            });
            
            const selectedDiv = this.closest('label')?.querySelector('div');
            if (selectedDiv) {
                const color = this.value === 'utensils' ? 'yellow' : 
                             this.value === 'car' ? 'blue' : 
                             this.value === 'home' ? 'green' : 
                             this.value === 'shopping-bag' ? 'purple' : 'pink';
                selectedDiv.classList.add('border-2', `border-${color}-500`);
            }
        });
    });
    
    // Save allocation button
    document.getElementById('saveAllocationBtn')?.addEventListener('click', () => {
        showNotification('Budget allocation saved successfully!', 'success');
    });
    
    // Delete budget button
    deleteBudgetBtn?.addEventListener('click', async () => {
        if (!currentBudget) return;
        
        const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const confirmed = confirm(`Are you sure you want to delete the budget for ${monthName}? This will also delete all associated budget categories. This action cannot be undone.`);
        
        if (!confirmed) return;
        
        try {
            // First, delete all budget categories associated with this budget
            if (budgetCategories.length > 0) {
                const deleteCategoryPromises = budgetCategories.map(cat => 
                    budgetService.deleteBudgetCategory(cat.id)
                );
                await Promise.all(deleteCategoryPromises);
            }
            
            // Then delete the budget
            await budgetService.deleteBudget(currentBudget.id);
            
            showNotification('Budget deleted successfully', 'success');
            
            // Reload data to refresh UI
            await loadData();
            updateBudgetSummary();
            populateCategories();
            populateBudgetHistory();
            initializeCharts();
            updateCreateBudgetButton();
        } catch (error) {
            console.error('Error deleting budget:', error);
            showNotification('Failed to delete budget', 'error');
        }
    });
    
    // Logout functionality
    logoutBtn?.addEventListener('click', () => {
        document.getElementById('logoutModal').classList.remove('hidden');
    });
    
    cancelLogoutBtn?.addEventListener('click', () => {
        document.getElementById('logoutModal').classList.add('hidden');
    });
    
    confirmLogoutBtn?.addEventListener('click', () => {
        logout();
    });
}

function updateMonthSelector() {
    if (!monthSelect) return;
    
    monthSelect.innerHTML = '';
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const option = document.createElement('option');
        option.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        option.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (i === 0) option.selected = true;
        monthSelect.appendChild(option);
    }
}

function prefillBudgetForm() {
    if (!createBudgetForm) return;
    
    // Calculate first and last day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Format dates as YYYY-MM-DD without timezone conversion
    const formatDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Set hidden date inputs
    const hiddenStartDate = document.getElementById('hiddenStartDate');
    const hiddenEndDate = document.getElementById('hiddenEndDate');
    if (hiddenStartDate) hiddenStartDate.value = formatDateString(firstDay);
    if (hiddenEndDate) hiddenEndDate.value = formatDateString(lastDay);
    
    // Update budget period display
    const budgetPeriodDisplay = document.getElementById('budgetPeriodDisplay');
    if (budgetPeriodDisplay) {
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const startDateStr = firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDateStr = lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        budgetPeriodDisplay.textContent = `${monthName} (${startDateStr} - ${endDateStr})`;
    }
    
    // Pre-fill budget name
    const budgetNameInput = document.getElementById('budgetNameInput');
    if (budgetNameInput) {
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        budgetNameInput.value = `${monthName} Budget`;
    }
}

function populateBudgetFormForEdit() {
    if (!createBudgetForm || !currentBudget) return;
    
    // Populate form fields with current budget data
    const budgetNameInput = document.getElementById('budgetNameInput');
    const amountInput = createBudgetForm.querySelector('input[name="amount"]');
    const descriptionInput = createBudgetForm.querySelector('textarea[name="description"]');
    const recurringInput = createBudgetForm.querySelector('input[name="recurring"]');
    const hiddenStartDate = document.getElementById('hiddenStartDate');
    const hiddenEndDate = document.getElementById('hiddenEndDate');
    const budgetPeriodDisplay = document.getElementById('budgetPeriodDisplay');
    
    if (budgetNameInput) budgetNameInput.value = currentBudget.name || '';
    if (amountInput) amountInput.value = currentBudget.totalAmount || '';
    if (descriptionInput) descriptionInput.value = currentBudget.description || '';
    if (recurringInput) recurringInput.checked = currentBudget.recurring || false;
    
    // Set dates from current budget
    if (hiddenStartDate) hiddenStartDate.value = currentBudget.startDate || '';
    if (hiddenEndDate) hiddenEndDate.value = currentBudget.endDate || '';
    
    // Update budget period display
    if (budgetPeriodDisplay && currentBudget.startDate && currentBudget.endDate) {
        const startDate = new Date(currentBudget.startDate);
        const endDate = new Date(currentBudget.endDate);
        const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const startDateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDateStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        budgetPeriodDisplay.textContent = `${monthName} (${startDateStr} - ${endDateStr})`;
    }
}

function updateBudgetModalForCreate() {
    if (budgetModalTitle) budgetModalTitle.textContent = 'Create New Budget';
    if (submitBudgetBtn) submitBudgetBtn.textContent = 'Create Budget';
}

function updateBudgetModalForEdit() {
    if (budgetModalTitle) budgetModalTitle.textContent = 'Edit Budget';
    if (submitBudgetBtn) submitBudgetBtn.textContent = 'Update Budget';
}

async function updateCreateBudgetButton() {
    if (!createBudgetBtn) return;
    
    try {
        const budgets = await budgetService.getBudgets();
        const existingBudget = budgets.find(b => {
            const budgetDate = new Date(b.startDate);
            return budgetDate.getMonth() === currentMonth && budgetDate.getFullYear() === currentYear;
        });
        
        if (existingBudget) {
            createBudgetBtn.disabled = true;
            createBudgetBtn.classList.add('opacity-50', 'cursor-not-allowed');
            createBudgetBtn.title = 'A budget already exists for this month';
        } else {
            createBudgetBtn.disabled = false;
            createBudgetBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            createBudgetBtn.title = '';
        }
    } catch (error) {
        // If error, enable button anyway
        createBudgetBtn.disabled = false;
        createBudgetBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function updateBudgetSummary() {
    console.log('updateBudgetSummary called - currentBudget:', currentBudget);
    console.log('updateBudgetSummary - budgetCategories:', budgetCategories);
    
    // Show/hide budget actions based on whether budget exists
    if (budgetActions) {
        if (currentBudget) {
            budgetActions.classList.remove('hidden');
            // Update budget name and period
            if (currentBudgetName) {
                currentBudgetName.textContent = currentBudget.name || 'Current Budget';
            }
            if (currentBudgetPeriod) {
                const startDate = new Date(currentBudget.startDate);
                const endDate = new Date(currentBudget.endDate);
                const period = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                currentBudgetPeriod.textContent = period;
            }
        } else {
            budgetActions.classList.add('hidden');
        }
    }
    
    if (!currentBudget) {
        console.log('No current budget - setting to $0');
        // Set default values - target only the summary cards grid
        const summaryGrid = document.getElementById('budgetSummaryGrid');
        if (summaryGrid) {
            const summaryCards = summaryGrid.querySelectorAll('.budget-card');
            summaryCards.forEach((card) => {
                const h3 = card.querySelector('h3');
                if (h3) {
                    h3.textContent = '$0';
                }
            });
        }
        return;
    }
    
    const totalBudget = parseFloat(currentBudget.totalAmount) || 0;
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + (parseFloat(cat.spent) || 0), 0);
    const remaining = totalBudget - totalSpent;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = Math.min(new Date().getDate(), daysInMonth);
    const dailyAverage = daysPassed > 0 ? totalSpent / daysPassed : 0;
    
    console.log('Budget Summary:', { totalBudget, totalSpent, remaining, dailyAverage });
    
    // Update summary cards - target only the summary cards grid
    const summaryGrid = document.getElementById('budgetSummaryGrid');
    if (!summaryGrid) {
        console.error('budgetSummaryGrid not found!');
        return;
    }
    
    const summaryCards = summaryGrid.querySelectorAll('.budget-card');
    console.log('Found summary cards:', summaryCards.length);
    
    // Total Budget
    if (summaryCards[0]) {
        const h3 = summaryCards[0].querySelector('h3');
        if (h3) {
            h3.textContent = `$${totalBudget.toLocaleString()}`;
            console.log('Updated Total Budget to:', h3.textContent);
        } else {
            console.error('Total Budget h3 not found in card 0');
        }
    } else {
        console.error('Summary card 0 not found');
    }
    
    // Spent This Month
    if (summaryCards[1]) {
        const h3 = summaryCards[1].querySelector('h3');
        if (h3) {
            h3.textContent = `$${totalSpent.toLocaleString()}`;
            console.log('Updated Spent to:', h3.textContent);
        }
    }
    
    // Remaining
    if (summaryCards[2]) {
        const h3 = summaryCards[2].querySelector('h3');
        if (h3) {
            h3.textContent = `$${remaining.toLocaleString()}`;
            console.log('Updated Remaining to:', h3.textContent);
        }
    }
    
    // Daily Average
    if (summaryCards[3]) {
        const h3 = summaryCards[3].querySelector('h3');
        if (h3) {
            h3.textContent = `$${dailyAverage.toFixed(0)}`;
            console.log('Updated Daily Average to:', h3.textContent);
        }
    }
}

function initializeCharts() {
    // Budget vs Actual Chart
    const budgetVsActualCtx = document.getElementById('budgetVsActualChart');
    if (budgetVsActualCtx) {
        if (budgetVsActualChart) budgetVsActualChart.destroy();
        
        const topCategories = budgetCategories.slice(0, 5);
        budgetVsActualChart = new Chart(budgetVsActualCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topCategories.map(c => c.name),
                datasets: [
                    {
                        label: 'Budget',
                        data: topCategories.map(c => c.budget || 0),
                        backgroundColor: '#3b82f6',
                        borderRadius: 6,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Actual',
                        data: topCategories.map(c => c.spent || 0),
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        barPercentage: 0.6
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
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Budget Distribution Chart
    const budgetDistributionCtx = document.getElementById('budgetDistributionChart');
    if (budgetDistributionCtx) {
        if (budgetDistributionChart) budgetDistributionChart.destroy();
        
        const essential = budgetCategories.filter(c => c.type === 'essential').reduce((sum, c) => sum + (c.budget || 0), 0);
        const discretionary = budgetCategories.filter(c => c.type === 'discretionary').reduce((sum, c) => sum + (c.budget || 0), 0);
        const total = budgetCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
        
        budgetDistributionChart = new Chart(budgetDistributionCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Essential', 'Discretionary', 'Savings', 'Debt'],
                datasets: [{
                    data: [
                        (essential / total * 100) || 55,
                        (discretionary / total * 100) || 25,
                        15,
                        5
                    ],
                    backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Budget History Chart
    const budgetHistoryCtx = document.getElementById('budgetHistoryChart');
    if (budgetHistoryCtx) {
        if (budgetHistoryChart) budgetHistoryChart.destroy();
        
        budgetHistoryChart = new Chart(budgetHistoryCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: budgetHistory.map(m => m.month),
                datasets: [
                    {
                        label: 'Budget',
                        data: budgetHistory.map(m => m.budget),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Spent',
                        data: budgetHistory.map(m => m.spent),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
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
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

function populateCategories() {
    const categoriesGrid = document.querySelector('#categoriesContent .grid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = '';
    
    if (budgetCategories.length === 0) {
        categoriesGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No budget categories yet. Add one to get started!</p>';
        return;
    }
    
    budgetCategories.forEach(category => {
        const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
        const remaining = category.budget - category.spent;
        let statusClass = 'budget-status-good';
        let progressClass = 'budget-progress-good';
        
        if (percentage >= 90) {
            statusClass = 'budget-status-danger';
            progressClass = 'budget-progress-danger';
        } else if (percentage >= 75) {
            statusClass = 'budget-status-warning';
            progressClass = 'budget-progress-warning';
        }
        
        let iconClass = 'fas fa-';
        switch(category.icon) {
            case 'utensils': iconClass += 'utensils'; break;
            case 'shopping-bag': iconClass += 'shopping-bag'; break;
            case 'home': iconClass += 'home'; break;
            case 'car': iconClass += 'car'; break;
            case 'film': iconClass += 'film'; break;
            case 'heartbeat': iconClass += 'heartbeat'; break;
            case 'graduation-cap': iconClass += 'graduation-cap'; break;
            case 'user': iconClass += 'user'; break;
            default: iconClass += 'tag'; break;
        }
        
        const categoryCard = document.createElement('div');
        categoryCard.className = `${statusClass} budget-card p-5`;
        categoryCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-${category.color || 'gray'}-100 flex items-center justify-center mr-3">
                        <i class="${iconClass} text-${category.color || 'gray'}-600"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-800">${category.name}</h4>
                        <p class="text-gray-500 text-sm">$${category.spent.toFixed(2)} of $${category.budget.toFixed(2)}</p>
                    </div>
                </div>
                <span class="font-bold ${percentage >= 90 ? 'text-red-600' : percentage >= 75 ? 'text-yellow-600' : 'text-green-600'}">${Math.round(percentage)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div class="${progressClass} h-2 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-500 text-sm">$${remaining.toFixed(2)} remaining</span>
                <div class="flex space-x-2">
                    <button class="edit-category text-blue-600 hover:text-blue-800 text-sm" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-category text-red-600 hover:text-red-800 text-sm" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        categoriesGrid.appendChild(categoryCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.edit-category').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            showNotification(`Editing category ${categoryId}`, 'info');
        });
    });
    
    document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', async function() {
            const categoryId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this category?')) {
                try {
                    await budgetService.deleteBudgetCategory(categoryId);
                    showNotification('Category deleted successfully', 'success');
                    await loadData();
                    populateCategories();
                } catch (error) {
                    showNotification('Failed to delete category', 'error');
                }
            }
        });
    });
}

function populateGoals() {
    const goalsGrid = document.querySelector('#goalsContent .grid');
    if (!goalsGrid) return;
    
    goalsGrid.innerHTML = '';
    
    if (savingsGoals.length === 0) {
        goalsGrid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No savings goals yet. Add one to get started!</p>';
        return;
    }
    
    savingsGoals.forEach(goal => {
        const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
        
        const goalCard = document.createElement('div');
        goalCard.className = 'budget-card p-5';
        goalCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="font-medium text-gray-800">${goal.name}</h4>
                    <p class="text-gray-500 text-sm">$${goal.saved.toFixed(2)} of $${goal.target.toFixed(2)}</p>
                </div>
                <span class="font-bold ${progress === 100 ? 'text-green-600' : progress >= 50 ? 'text-blue-600' : 'text-yellow-600'}">${Math.round(progress)}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div class="${progress === 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'} h-2 rounded-full" style="width: ${progress}%"></div>
            </div>
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-gray-500 text-sm">$${goal.monthly.toFixed(2)}/month</p>
                    <p class="text-gray-500 text-sm">Due: ${new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="add-contribution text-green-600 hover:text-green-800 text-sm" data-id="${goal.id}">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <button class="edit-goal text-blue-600 hover:text-blue-800 text-sm" data-id="${goal.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
        
        goalsGrid.appendChild(goalCard);
    });
    
    // Add event listeners
    document.querySelectorAll('.add-contribution').forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            showNotification(`Adding contribution to goal ${goalId}`, 'info');
        });
    });
    
    document.querySelectorAll('.edit-goal').forEach(button => {
        button.addEventListener('click', function() {
            const goalId = this.getAttribute('data-id');
            showNotification(`Editing goal ${goalId}`, 'info');
        });
    });
}

function populateBudgetHistory() {
    const historyTable = document.getElementById('budgetHistoryTable');
    if (!historyTable) return;
    
    historyTable.innerHTML = '';
    
    if (budgetHistory.length === 0) {
        historyTable.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No budget history available</td></tr>';
        return;
    }
    
    budgetHistory.forEach(month => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        let statusBadge = '';
        let statusColor = '';
        
        switch(month.status) {
            case 'good':
                statusBadge = '<i class="fas fa-check-circle mr-1"></i> On Track';
                statusColor = 'text-green-600 bg-green-100';
                break;
            case 'warning':
                statusBadge = '<i class="fas fa-exclamation-triangle mr-1"></i> Close';
                statusColor = 'text-yellow-600 bg-yellow-100';
                break;
            case 'danger':
                statusBadge = '<i class="fas fa-times-circle mr-1"></i> Over Budget';
                statusColor = 'text-red-600 bg-red-100';
                break;
            case 'upcoming':
                statusBadge = '<i class="fas fa-calendar-alt mr-1"></i> Upcoming';
                statusColor = 'text-blue-600 bg-blue-100';
                break;
        }
        
        const savedClass = month.saved >= 0 ? 'text-green-600' : 'text-red-600';
        const savedSign = month.saved >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td class="py-4 text-gray-700 font-medium">${month.month}</td>
            <td class="py-4 text-gray-800">$${month.budget.toLocaleString()}</td>
            <td class="py-4 text-gray-800">$${month.spent.toLocaleString()}</td>
            <td class="py-4 font-medium ${savedClass}">${savedSign}$${Math.abs(month.saved).toLocaleString()}</td>
            <td class="py-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                    ${statusBadge}
                </span>
            </td>
            <td class="py-4">
                <button class="text-blue-600 hover:text-blue-800 text-sm">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        
        historyTable.appendChild(row);
    });
}

function initializeDragAndDrop() {
    const draggableItems = document.querySelectorAll('.draggable-item');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    let draggedItem = null;
    
    draggableItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('opacity-50');
            e.dataTransfer.setData('text/plain', this.getAttribute('data-category'));
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('opacity-50');
            draggedItem = null;
            dropZones.forEach(zone => {
                zone.classList.remove('drag-over');
            });
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (draggedItem && this.id === 'allocatedBudgetZone') {
                const clonedItem = draggedItem.cloneNode(true);
                clonedItem.classList.remove('opacity-50');
                clonedItem.classList.add('mt-2');
                this.appendChild(clonedItem);
                updateBudgetAllocation();
            }
        });
    });
}

function updateBudgetAllocation() {
    showNotification('Budget allocation updated', 'info');
}
