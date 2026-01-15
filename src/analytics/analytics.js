
        // Sample analytics data
        const monthlyData = [
            { month: 'Jan 2023', income: 3850, expenses: 2540, savings: 1310, savingsRate: 34 },
            { month: 'Feb 2023', income: 3950, expenses: 2680, savings: 1270, savingsRate: 32 },
            { month: 'Mar 2023', income: 4250, expenses: 2450, savings: 1800, savingsRate: 42 },
            { month: 'Apr 2023', income: 4100, expenses: 2850, savings: 1250, savingsRate: 30 },
            { month: 'May 2023', income: 4350, expenses: 2945, savings: 1405, savingsRate: 32 },
            { month: 'Jun 2023', income: 4450, expenses: 3010, savings: 1440, savingsRate: 32 }
        ];

        const categoryData = {
            labels: ['Food & Dining', 'Shopping', 'Bills & Utilities', 'Transportation', 'Entertainment', 'Other'],
            data: [35, 25, 19, 14, 7, 10],
            colors: ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#6b7280']
        };

        const incomeSources = {
            labels: ['Salary', 'Freelance', 'Investments', 'Other'],
            data: [77, 15, 6, 2],
            colors: ['#10b981', '#3b82f6', '#8b5cf6', '#6b7280']
        };

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
        const toastNotification = document.getElementById('toastNotification');
        
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
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize charts
            initializeCharts();
            
            // Populate monthly trends table
            populateMonthlyTrends();
            
            // Set up event listeners
            setupEventListeners();
            
            // Set analytics nav as active
            updateActiveNav('analytics');
        });
        
        function setupEventListeners() {
            // Toggle sidebar
            toggleSidebarBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('ml-64');
                mainContent.classList.toggle('ml-20');
            });
            
            // Navigation
            dashboardNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('dashboard');
            });
            
            transactionsNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('transactions');
            });
            
            analyticsNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('analytics');
            });
            
            budgetNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('budget');
            });
            
            categoriesNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('categories');
            });
            
            settingsNav.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('settings');
            });
            
            // Time period filters
            timeFilterBtns.forEach(button => {
                button.addEventListener('click', function() {
                    const period = this.getAttribute('data-period');
                    
                    // Update active button
                    timeFilterBtns.forEach(btn => {
                        btn.classList.remove('time-filter-active');
                        btn.classList.add('time-filter-inactive');
                    });
                    
                    this.classList.remove('time-filter-inactive');
                    this.classList.add('time-filter-active');
                    
                    // Update charts based on period
                    updateChartsByPeriod(period);
                });
            });
            
            // Export analytics
            exportAnalyticsBtn.addEventListener('click', () => {
                showToast('Analytics report exported successfully!', 'success');
            });
            
            // Logout functionality
            logoutBtn.addEventListener('click', () => {
                document.getElementById('logoutModal').classList.remove('hidden');
            });
            
            cancelLogoutBtn.addEventListener('click', () => {
                document.getElementById('logoutModal').classList.add('hidden');
            });
            
            confirmLogoutBtn.addEventListener('click', () => {
                showToast('Logged out successfully!', 'info');
                document.getElementById('logoutModal').classList.add('hidden');
                
                // In a real app, you would redirect to login page
                setTimeout(() => {
                    alert('Redirecting to login page... (This is a demo)');
                }, 1000);
            });
            
            // View detailed analytics
            document.getElementById('incomeExpenseChart').addEventListener('click', () => {
                document.getElementById('analyticsDetailModal').classList.remove('hidden');
                initializeDetailCharts();
            });
            
            // Close analytics modal
            document.getElementById('closeAnalyticsModal').addEventListener('click', () => {
                document.getElementById('analyticsDetailModal').classList.add('hidden');
            });
            
            document.getElementById('closeDetailBtn').addEventListener('click', () => {
                document.getElementById('analyticsDetailModal').classList.add('hidden');
            });
        }
        
        function navigateTo(page) {
            // Update page title based on navigation
            // In a real app, this would navigate to different pages
            alert(`Navigating to ${page} page... (This is a demo)`);
            
            // Update active navigation
            updateActiveNav(page);
        }
        
        function updateActiveNav(activePage) {
            // Remove active class from all nav items
            const navItems = [dashboardNav, transactionsNav, analyticsNav, budgetNav, categoriesNav, settingsNav];
            navItems.forEach(nav => {
                nav.classList.remove('bg-blue-900', 'text-white');
                nav.classList.add('hover:bg-gray-800', 'text-gray-300');
            });
            
            // Add active class to current nav item
            switch(activePage) {
                case 'dashboard':
                    dashboardNav.classList.add('bg-blue-900', 'text-white');
                    dashboardNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
                case 'transactions':
                    transactionsNav.classList.add('bg-blue-900', 'text-white');
                    transactionsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
                case 'analytics':
                    analyticsNav.classList.add('bg-blue-900', 'text-white');
                    analyticsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
                case 'budget':
                    budgetNav.classList.add('bg-blue-900', 'text-white');
                    budgetNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
                case 'categories':
                    categoriesNav.classList.add('bg-blue-900', 'text-white');
                    categoriesNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
                case 'settings':
                    settingsNav.classList.add('bg-blue-900', 'text-white');
                    settingsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
                    break;
            }
        }
        
        function initializeCharts() {
            // Income vs Expenses Chart
            const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
            incomeExpenseChart = new Chart(incomeExpenseCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Income',
                            data: [3850, 3950, 4250, 4100, 4350, 4450],
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
                            data: [2540, 2680, 2450, 2850, 2945, 3010],
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
            
            // Category Chart
            const categoryCtx = document.getElementById('categoryChart').getContext('2d');
            categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.labels,
                    datasets: [{
                        data: categoryData.data,
                        backgroundColor: categoryData.colors,
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
            
            // Savings Chart
            const savingsCtx = document.getElementById('savingsChart').getContext('2d');
            savingsChart = new Chart(savingsCtx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [67, 33],
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
        }
        
        function initializeDetailCharts() {
            // Detail Category Chart
            if (detailCategoryChart) {
                detailCategoryChart.destroy();
            }
            
            const detailCategoryCtx = document.getElementById('detailCategoryChart').getContext('2d');
            detailCategoryChart = new Chart(detailCategoryCtx, {
                type: 'bar',
                data: {
                    labels: categoryData.labels,
                    datasets: [{
                        label: 'Percentage',
                        data: categoryData.data,
                        backgroundColor: categoryData.colors,
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
            
            // Detail Comparison Chart
            if (detailComparisonChart) {
                detailComparisonChart.destroy();
            }
            
            const detailComparisonCtx = document.getElementById('detailComparisonChart').getContext('2d');
            detailComparisonChart = new Chart(detailComparisonCtx, {
                type: 'radar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Income',
                            data: [3850, 3950, 4250, 4100, 4350, 4450],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Expenses',
                            data: [2540, 2680, 2450, 2850, 2945, 3010],
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
        
        function populateMonthlyTrends() {
            monthlyTrendsTable.innerHTML = '';
            
            monthlyData.forEach(month => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-100 hover:bg-gray-50';
                
                // Calculate trend
                const savingsTrend = month.savingsRate >= 30 ? 'up' : 'down';
                const trendColor = savingsTrend === 'up' ? 'text-green-600' : 'text-red-600';
                const trendIcon = savingsTrend === 'up' ? 'fa-arrow-up' : 'fa-arrow-down';
                
                row.innerHTML = `
                    <td class="py-4 text-gray-700 font-medium">${month.month}</td>
                    <td class="py-4 text-gray-800">$${month.income.toLocaleString()}</td>
                    <td class="py-4 text-gray-800">$${month.expenses.toLocaleString()}</td>
                    <td class="py-4 font-medium text-green-600">$${month.savings.toLocaleString()}</td>
                    <td class="py-4 font-medium ${month.savingsRate >= 30 ? 'text-green-600' : 'text-yellow-600'}">${month.savingsRate}%</td>
                    <td class="py-4">
                        <span class="${trendColor}">
                            <i class="fas ${trendIcon} mr-1"></i> ${savingsTrend === 'up' ? 'Good' : 'Needs attention'}
                        </span>
                    </td>
                `;
                
                monthlyTrendsTable.appendChild(row);
            });
        }
        
        function updateChartsByPeriod(period) {
            // In a real app, this would fetch new data based on the selected period
            // For this demo, we'll just update the chart titles and show a toast
            
            let periodText = '';
            switch(period) {
                case 'week': periodText = 'Weekly'; break;
                case 'month': periodText = 'Monthly'; break;
                case 'quarter': periodText = 'Quarterly'; break;
                case 'year': periodText = 'Yearly'; break;
                case 'all': periodText = 'All Time'; break;
            }
            
            // Update chart data based on period (simulated)
            // In a real app, you would fetch new data from an API
            
            showToast(`${periodText} analytics data loaded`, 'info');
        }
        
        function showToast(message, type = 'success') {
            const toastIcon = document.getElementById('toastIcon');
            const toastMessage = document.getElementById('toastMessage');
            const toast = document.getElementById('toastNotification');
            
            // Set icon and color based on type
            if (type === 'success') {
                toastIcon.className = 'fas fa-check-circle mr-3 text-xl';
                toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center notification-slide z-50';
            } else if (type === 'error') {
                toastIcon.className = 'fas fa-exclamation-circle mr-3 text-xl';
                toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center notification-slide z-50';
            } else if (type === 'warning') {
                toastIcon.className = 'fas fa-exclamation-triangle mr-3 text-xl';
                toast.className = 'fixed bottom-4 right-4 bg-amber-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center notification-slide z-50';
            } else {
                toastIcon.className = 'fas fa-info-circle mr-3 text-xl';
                toast.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center notification-slide z-50';
            }
            
            toastMessage.textContent = message;
            
            // Show toast
            toast.classList.remove('hidden');
            
            // Hide after 3 seconds
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }