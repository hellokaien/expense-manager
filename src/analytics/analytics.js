// src/analytics/analytics.js
import authManager from '../auth/auth.js';
import { showNotification, API_BASE_URL, getInitials } from '../shared/utils.js';
import { logout } from '../app.js';
import transactionService from '../shared/services/transactionService.js';
import categoryService from '../shared/services/categoryService.js';
import budgetService from '../shared/services/budgetService.js';

// Global data
let transactions = [];
let allCategories = [];
let monthlyData = [];
let categorySpending = {};
let incomeSources = {};
let currentPeriod = 'quarter';
let dateRange = 'last6months';

// DOM Elements
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const timeFilterBtns = document.querySelectorAll('.time-filter-btn');
const exportAnalyticsBtn = document.getElementById('exportAnalyticsBtn');
const monthlyTrendsTable = document.getElementById('monthlyTrendsTable');
const dateRangeSelect = document.getElementById('dateRangeSelect');

// Navigation elements
const dashboardNav = document.getElementById('dashboardNav');
const transactionsNav = document.getElementById('transactionsNav');
const analyticsNav = document.getElementById('analyticsNav');
const budgetNav = document.getElementById('budgetNav');
const categoriesNav = document.getElementById('categoriesNav');
const settingsNav = document.getElementById('settingsNav');

// Chart instances
let incomeExpenseChart, categoryChart, savingsChart, detailCategoryChart, detailComparisonChart;

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
        populateMonthlyTrends();
        updateMetrics();
        updateCategorySpending();
        updateIncomeSources();
        updateSavingsProgress();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing analytics:', error);
        showNotification('Failed to load analytics data', 'error');
    }
});

async function loadData() {
    try {
        // Load transactions
        transactions = await transactionService.getTransactions();
        
        // Load categories
        allCategories = await categoryService.getCategories();
        
        // Calculate analytics from transactions
        calculateMonthlyData();
        calculateCategorySpending();
        calculateIncomeSources();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load analytics data', 'error');
    }
}

function calculateMonthlyData() {
    monthlyData = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });
        
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const savings = income - expenses;
        const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        
        monthlyData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            income,
            expenses,
            savings,
            savingsRate: parseFloat(savingsRate)
        });
    }
}

function calculateCategorySpending() {
    categorySpending = {};
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const recentTransactions = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date);
        return tDate >= threeMonthsAgo;
    });
    
    recentTransactions.forEach(t => {
        const categoryInfo = getCategoryInfo(t.category);
        const categoryName = categoryInfo.name;
        
        if (!categorySpending[categoryName]) {
            categorySpending[categoryName] = {
                amount: 0,
                color: categoryInfo.color || '#6b7280',
                categoryId: t.category
            };
        }
        categorySpending[categoryName].amount += t.amount || 0;
    });
}

function calculateIncomeSources() {
    incomeSources = {};
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const recentIncome = transactions.filter(t => {
        if (t.type !== 'income') return false;
        const tDate = new Date(t.date);
        return tDate >= threeMonthsAgo;
    });
    
    const totalIncome = recentIncome.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    recentIncome.forEach(t => {
        const categoryInfo = getCategoryInfo(t.category);
        const categoryName = categoryInfo.name;
        
        if (!incomeSources[categoryName]) {
            incomeSources[categoryName] = {
                amount: 0,
                percentage: 0,
                color: categoryInfo.color || '#6b7280'
            };
        }
        incomeSources[categoryName].amount += t.amount || 0;
    });
    
    // Calculate percentages
    Object.keys(incomeSources).forEach(key => {
        incomeSources[key].percentage = totalIncome > 0 
            ? ((incomeSources[key].amount / totalIncome) * 100).toFixed(1) 
            : 0;
    });
}

function getCategoryInfo(categoryValue) {
    let category = allCategories.find(cat => cat.id === categoryValue);
    
    if (!category) {
        const categoryName = categoryValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        category = allCategories.find(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
        );
    }
    
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
    
    // Time period filters
    timeFilterBtns.forEach(button => {
        button.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            currentPeriod = period;
            
            timeFilterBtns.forEach(btn => {
                btn.classList.remove('time-filter-active');
                btn.classList.add('time-filter-inactive');
            });
            
            this.classList.remove('time-filter-inactive');
            this.classList.add('time-filter-active');
            
            updateChartsByPeriod(period);
        });
    });
    
    // Date range selector
    dateRangeSelect?.addEventListener('change', () => {
        dateRange = dateRangeSelect.value;
        loadData().then(() => {
            initializeCharts();
            populateMonthlyTrends();
            updateMetrics();
            updateCategorySpending();
            updateIncomeSources();
        });
    });
    
    // Export analytics
    exportAnalyticsBtn?.addEventListener('click', () => {
        showNotification('Analytics report exported successfully!', 'success');
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
    
    // View detailed analytics
    const incomeExpenseChartEl = document.getElementById('incomeExpenseChart');
    if (incomeExpenseChartEl) {
        incomeExpenseChartEl.addEventListener('click', () => {
            document.getElementById('analyticsDetailModal').classList.remove('hidden');
            initializeDetailCharts();
        });
    }
    
    // Close analytics modal
    document.getElementById('closeAnalyticsModal')?.addEventListener('click', () => {
        document.getElementById('analyticsDetailModal').classList.add('hidden');
    });
    
    document.getElementById('closeDetailBtn')?.addEventListener('click', () => {
        document.getElementById('analyticsDetailModal').classList.add('hidden');
    });
    
    // Close modal when clicking outside
    const analyticsModal = document.getElementById('analyticsDetailModal');
    if (analyticsModal) {
        analyticsModal.addEventListener('click', (e) => {
            if (e.target === analyticsModal) {
                analyticsModal.classList.add('hidden');
            }
        });
    }
    
    // Navigation
    dashboardNav?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../dashboard/dashboard.html';
    });
    
    transactionsNav?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../transactions/transactions.html';
    });
    
    analyticsNav?.addEventListener('click', (e) => {
        e.preventDefault();
        // Already on analytics page
    });
    
    budgetNav?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../budget-planner/index.html';
    });
    
    categoriesNav?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../categories/categories.html';
    });
    
    settingsNav?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '../settings/settings.html';
    });
}

function updateMetrics() {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Current period totals
    const currentPeriodTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= currentMonth;
    });
    
    const currentIncome = currentPeriodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const currentExpenses = currentPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const currentSavings = currentIncome - currentExpenses;
    const currentSavingsRate = currentIncome > 0 ? ((currentSavings / currentIncome) * 100).toFixed(1) : 0;
    
    // Last period totals
    const lastPeriodTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= lastMonth && tDate <= lastMonthEnd;
    });
    
    const lastIncome = lastPeriodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const lastExpenses = lastPeriodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const lastSavings = lastIncome - lastExpenses;
    const lastSavingsRate = lastIncome > 0 ? ((lastSavings / lastIncome) * 100).toFixed(1) : 0;
    
    // Calculate percentage changes
    const incomeChange = lastIncome > 0 ? (((currentIncome - lastIncome) / lastIncome) * 100).toFixed(1) : 0;
    const expenseChange = lastExpenses > 0 ? (((currentExpenses - lastExpenses) / lastExpenses) * 100).toFixed(1) : 0;
    const savingsChange = lastSavings !== 0 ? (((currentSavings - lastSavings) / Math.abs(lastSavings)) * 100).toFixed(1) : 0;
    const savingsRateChange = lastSavingsRate > 0 ? (parseFloat(currentSavingsRate) - parseFloat(lastSavingsRate)).toFixed(1) : 0;
    
    // Update metric cards
    const metricCards = document.querySelectorAll('.analytics-card');
    if (metricCards[0]) {
        const h3 = metricCards[0].querySelector('h3');
        if (h3) h3.textContent = `$${currentIncome.toLocaleString()}`;
        const changeEl = metricCards[0].querySelector('.text-green-600, .text-red-600');
        if (changeEl) {
            changeEl.innerHTML = `<i class="fas fa-arrow-${parseFloat(incomeChange) >= 0 ? 'up' : 'down'} mr-1"></i> ${Math.abs(parseFloat(incomeChange))}%`;
            changeEl.className = parseFloat(incomeChange) >= 0 ? 'text-green-600 text-sm font-medium mr-2' : 'text-red-600 text-sm font-medium mr-2';
        }
    }
    
    if (metricCards[1]) {
        const h3 = metricCards[1].querySelector('h3');
        if (h3) h3.textContent = `$${currentExpenses.toLocaleString()}`;
        const changeEl = metricCards[1].querySelector('.text-green-600, .text-red-600');
        if (changeEl) {
            changeEl.innerHTML = `<i class="fas fa-arrow-${parseFloat(expenseChange) >= 0 ? 'up' : 'down'} mr-1"></i> ${Math.abs(parseFloat(expenseChange))}%`;
            changeEl.className = parseFloat(expenseChange) >= 0 ? 'text-red-600 text-sm font-medium mr-2' : 'text-green-600 text-sm font-medium mr-2';
        }
    }
    
    if (metricCards[2]) {
        const h3 = metricCards[2].querySelector('h3');
        if (h3) h3.textContent = `$${currentSavings.toLocaleString()}`;
        const changeEl = metricCards[2].querySelector('.text-green-600, .text-red-600');
        if (changeEl) {
            changeEl.innerHTML = `<i class="fas fa-arrow-${parseFloat(savingsChange) >= 0 ? 'up' : 'down'} mr-1"></i> ${Math.abs(parseFloat(savingsChange))}%`;
            changeEl.className = parseFloat(savingsChange) >= 0 ? 'text-green-600 text-sm font-medium mr-2' : 'text-red-600 text-sm font-medium mr-2';
        }
    }
    
    if (metricCards[3]) {
        const h3 = metricCards[3].querySelector('h3');
        if (h3) h3.textContent = `${currentSavingsRate}%`;
        const changeEl = metricCards[3].querySelector('.text-green-600, .text-red-600');
        if (changeEl) {
            changeEl.innerHTML = `<i class="fas fa-arrow-${parseFloat(savingsRateChange) >= 0 ? 'up' : 'down'} mr-1"></i> ${Math.abs(parseFloat(savingsRateChange))}%`;
            changeEl.className = parseFloat(savingsRateChange) >= 0 ? 'text-green-600 text-sm font-medium mr-2' : 'text-red-600 text-sm font-medium mr-2';
        }
    }
}

function updateCategorySpending() {
    const container = document.getElementById('topCategoriesList');
    if (!container) return;
    
    const categories = Object.entries(categorySpending)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No spending data available</p>';
        return;
    }
    
    const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    const categoriesHTML = categories.map(cat => {
        const percentage = totalExpenses > 0 ? ((cat.amount / totalExpenses) * 100).toFixed(0) : 0;
        return `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-gray-700">${cat.name}</span>
                    <span class="font-medium text-gray-800">$${cat.amount.toFixed(2)}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${cat.color}"></div>
                </div>
                <div class="flex justify-between mt-1">
                    <span class="text-gray-500 text-sm">${percentage}% of total expenses</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = categoriesHTML;
}

function updateIncomeSources() {
    const container = document.getElementById('incomeSourcesList');
    if (!container) return;
    
    const sources = Object.entries(incomeSources)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount);
    
    if (sources.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No income data available</p>';
        return;
    }
    
    const totalIncome = sources.reduce((sum, src) => sum + src.amount, 0);
    
    const sourcesHTML = sources.map(src => {
        const percentage = parseFloat(src.percentage);
        return `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-gray-700">${src.name}</span>
                    <span class="font-medium text-gray-800">$${src.amount.toFixed(2)}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${src.color}"></div>
                </div>
                <div class="flex justify-between mt-1">
                    <span class="text-gray-500 text-sm">${percentage}% of total income</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = sourcesHTML;
}

async function updateSavingsProgress() {
    try {
        const savingsGoals = await budgetService.getSavingsGoals();
        const savingsChartEl = document.getElementById('savingsChart');
        const savingsGoalsList = document.getElementById('savingsGoalsList');
        
        if (!savingsChartEl) return;
        
        if (savingsGoals && savingsGoals.length > 0) {
            const totalTarget = savingsGoals.reduce((sum, g) => sum + (g.target || 0), 0);
            const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.saved || 0), 0);
            const progress = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0;
            
            // Update savings chart
            if (savingsChart) {
                savingsChart.destroy();
            }
            
            savingsChart = new Chart(savingsChartEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [parseFloat(progress), 100 - parseFloat(progress)],
                        backgroundColor: ['#3b82f6', '#e5e7eb'],
                        borderWidth: 0,
                        circumference: 270,
                        rotation: 225
                    }]
                },
                options: {
                    responsive: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            
            // Update progress text
            const progressText = document.getElementById('savingsProgressPercent');
            if (progressText) {
                progressText.textContent = `${progress}%`;
            }
            
            // Update goal text
            const annualGoal = document.getElementById('annualSavingsGoal');
            if (annualGoal) {
                annualGoal.textContent = `$${totalTarget.toLocaleString()}`;
            }
            
            const currentSavings = document.getElementById('currentSavings');
            if (currentSavings) {
                currentSavings.textContent = `$${totalSaved.toLocaleString()}`;
            }
            
            // Update goals list
            if (savingsGoalsList) {
                const goalsHTML = savingsGoals.slice(0, 3).map(goal => {
                    const goalProgress = goal.target > 0 ? ((goal.saved / goal.target) * 100).toFixed(0) : 0;
                    const remaining = goal.target - goal.saved;
                    const isComplete = goalProgress >= 100;
                    
                    return `
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-gray-700">${goal.name}</span>
                                <span class="font-medium text-gray-800">$${goal.saved.toFixed(2)} / $${goal.target.toFixed(2)}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}" style="width: ${Math.min(goalProgress, 100)}%"></div>
                            </div>
                            <p class="${isComplete ? 'text-green-600' : 'text-blue-600'} text-sm mt-1 text-right">
                                ${isComplete ? 'Complete!' : `$${remaining.toFixed(2)} remaining`}
                            </p>
                        </div>
                    `;
                }).join('');
                
                savingsGoalsList.innerHTML = goalsHTML;
            }
        } else {
            // No goals - show default
            if (savingsChart) {
                savingsChart.destroy();
            }
            
            savingsChart = new Chart(savingsChartEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [0, 100],
                        backgroundColor: ['#3b82f6', '#e5e7eb'],
                        borderWidth: 0,
                        circumference: 270,
                        rotation: 225
                    }]
                },
                options: {
                    responsive: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            
            if (savingsGoalsList) {
                savingsGoalsList.innerHTML = '<p class="text-gray-500 text-center py-4">No savings goals set yet</p>';
            }
        }
    } catch (error) {
        console.warn('Could not load savings goals:', error);
    }
}

function initializeCharts() {
    // Income vs Expenses Chart
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCtx) {
        if (incomeExpenseChart) incomeExpenseChart.destroy();
        
        const labels = monthlyData.map(m => m.month);
        const incomeData = monthlyData.map(m => m.income);
        const expenseData = monthlyData.map(m => m.expenses);
        
        incomeExpenseChart = new Chart(incomeExpenseCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
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
    
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (categoryChart) categoryChart.destroy();
        
        const categories = Object.entries(categorySpending)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
        
        const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
        
        const labels = categories.map(c => c.name);
        const data = categories.map(c => totalExpenses > 0 ? ((c.amount / totalExpenses) * 100).toFixed(1) : 0);
        const colors = categories.map(c => c.color);
        
        categoryChart = new Chart(categoryCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
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
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Savings Chart
    updateSavingsProgress();
}

function initializeDetailCharts() {
    // Detail Category Chart
    const detailCategoryCtx = document.getElementById('detailCategoryChart');
    if (detailCategoryCtx) {
        if (detailCategoryChart) detailCategoryChart.destroy();
        
        const categories = Object.entries(categorySpending)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
        
        const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
        
        const labels = categories.map(c => c.name);
        const data = categories.map(c => totalExpenses > 0 ? ((c.amount / totalExpenses) * 100).toFixed(1) : 0);
        const colors = categories.map(c => c.color);
        
        detailCategoryChart = new Chart(detailCategoryCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Percentage',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }
    
    // Detail Comparison Chart
    const detailComparisonCtx = document.getElementById('detailComparisonChart');
    if (detailComparisonCtx) {
        if (detailComparisonChart) detailComparisonChart.destroy();
        
        const labels = monthlyData.map(m => m.month);
        const incomeData = monthlyData.map(m => m.income);
        const expenseData = monthlyData.map(m => m.expenses);
        
        detailComparisonChart = new Chart(detailComparisonCtx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
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
}

function populateMonthlyTrends() {
    if (!monthlyTrendsTable) return;
    
    monthlyTrendsTable.innerHTML = '';
    
    if (monthlyData.length === 0) {
        monthlyTrendsTable.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No data available</td></tr>';
        return;
    }
    
    monthlyData.forEach((month, index) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        // Calculate trend compared to previous month
        let trend = 'up';
        let trendColor = 'text-green-600';
        let trendIcon = 'fa-arrow-up';
        let trendText = 'Good';
        
        if (index > 0) {
            const prevMonth = monthlyData[index - 1];
            if (month.savingsRate < prevMonth.savingsRate) {
                trend = 'down';
                trendColor = 'text-red-600';
                trendIcon = 'fa-arrow-down';
                trendText = 'Needs attention';
            }
        }
        
        row.innerHTML = `
            <td class="py-4 text-gray-700 font-medium">${month.month}</td>
            <td class="py-4 text-gray-800">$${month.income.toLocaleString()}</td>
            <td class="py-4 text-gray-800">$${month.expenses.toLocaleString()}</td>
            <td class="py-4 font-medium ${month.savings >= 0 ? 'text-green-600' : 'text-red-600'}">$${month.savings.toLocaleString()}</td>
            <td class="py-4 font-medium ${month.savingsRate >= 30 ? 'text-green-600' : month.savingsRate >= 20 ? 'text-yellow-600' : 'text-red-600'}">${month.savingsRate}%</td>
            <td class="py-4">
                <span class="${trendColor}">
                    <i class="fas ${trendIcon} mr-1"></i> ${trendText}
                </span>
            </td>
        `;
        
        monthlyTrendsTable.appendChild(row);
    });
}

function updateChartsByPeriod(period) {
    currentPeriod = period;
    
    // Recalculate data based on period
    calculateMonthlyData();
    
    // Update charts
    initializeCharts();
    populateMonthlyTrends();
    updateMetrics();
    
    let periodText = '';
    switch(period) {
        case 'week': periodText = 'Weekly'; break;
        case 'month': periodText = 'Monthly'; break;
        case 'quarter': periodText = 'Quarterly'; break;
        case 'year': periodText = 'Yearly'; break;
        case 'all': periodText = 'All Time'; break;
    }
    
    showNotification(`${periodText} analytics data loaded`, 'info');
}
