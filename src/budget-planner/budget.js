 // Sample budget data
        const budgetCategories = [
            { id: 1, name: 'Food & Dining', budget: 700, spent: 645, icon: 'utensils', color: 'yellow', type: 'essential' },
            { id: 2, name: 'Shopping', budget: 500, spent: 420, icon: 'shopping-bag', color: 'purple', type: 'discretionary' },
            { id: 3, name: 'Bills & Utilities', budget: 350, spent: 320, icon: 'home', color: 'green', type: 'essential' },
            { id: 4, name: 'Transportation', budget: 250, spent: 185, icon: 'car', color: 'blue', type: 'essential' },
            { id: 5, name: 'Entertainment', budget: 200, spent: 120, icon: 'film', color: 'pink', type: 'discretionary' },
            { id: 6, name: 'Health & Fitness', budget: 150, spent: 95, icon: 'heartbeat', color: 'red', type: 'essential' },
            { id: 7, name: 'Education', budget: 100, spent: 75, icon: 'graduation-cap', color: 'blue', type: 'essential' },
            { id: 8, name: 'Personal Care', budget: 75, spent: 60, icon: 'user', color: 'purple', type: 'discretionary' }
        ];

        const savingsGoals = [
            { id: 1, name: 'Emergency Fund', target: 5000, saved: 5000, progress: 100, deadline: '2023-05-31', monthly: 500 },
            { id: 2, name: 'Vacation Fund', target: 3000, saved: 2500, progress: 83, deadline: '2023-08-31', monthly: 300 },
            { id: 3, name: 'New Laptop', target: 1200, saved: 500, progress: 42, deadline: '2023-10-31', monthly: 150 },
            { id: 4, name: 'Car Maintenance', target: 800, saved: 400, progress: 50, deadline: '2023-09-30', monthly: 100 }
        ];

        const budgetHistory = [
            { month: 'Jan 2023', budget: 3200, spent: 2850, saved: 350, status: 'good' },
            { month: 'Feb 2023', budget: 3200, spent: 3100, saved: 100, status: 'warning' },
            { month: 'Mar 2023', budget: 3300, spent: 2950, saved: 350, status: 'good' },
            { month: 'Apr 2023', budget: 3300, spent: 3400, saved: -100, status: 'danger' },
            { month: 'May 2023', budget: 3500, spent: 2845, saved: 655, status: 'good' },
            { month: 'Jun 2023', budget: 3500, spent: 0, saved: 0, status: 'upcoming' }
        ];

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
        const toastNotification = document.getElementById('toastNotification');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const monthSelect = document.getElementById('monthSelect');
        
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
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize charts
            initializeCharts();
            
            // Populate categories
            populateCategories();
            
            // Populate goals
            populateGoals();
            
            // Populate budget history
            populateBudgetHistory();
            
            // Set up event listeners
            setupEventListeners();
            
            // Set budget nav as active
            updateActiveNav('budget');
            
            // Initialize drag and drop
            initializeDragAndDrop();
        });
        
        function setupEventListeners() {
            // Toggle sidebar
            toggleSidebarBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('ml-64');
                mainContent.classList.toggle('ml-20');
            });
            
            // Navigation
            // dashboardNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('dashboard');
            // });
            
            // transactionsNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('transactions');
            // });
            
            // analyticsNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('analytics');
            // });
            
            // budgetNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('budget');
            // });
            
            // categoriesNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('categories');
            // });
            
            // settingsNav.addEventListener('click', (e) => {
            //     e.preventDefault();
            //     navigateTo('settings');
            // });
            
            // Budget tabs
            budgetTabBtns.forEach(button => {
                button.addEventListener('click', function() {
                    const tab = this.getAttribute('data-tab');
                    
                    // Update active button
                    budgetTabBtns.forEach(btn => {
                        btn.classList.remove('budget-tab-active');
                        btn.classList.add('budget-tab-inactive');
                    });
                    
                    this.classList.remove('budget-tab-inactive');
                    this.classList.add('budget-tab-active');
                    
                    // Show corresponding content
                    budgetTabContents.forEach(content => {
                        content.classList.add('hidden');
                    });
                    
                    document.getElementById(`${tab}Content`).classList.remove('hidden');
                });
            });
            
            // Month navigation
            prevMonthBtn.addEventListener('click', () => {
                showToast('Previous month loaded', 'info');
            });
            
            nextMonthBtn.addEventListener('click', () => {
                showToast('Next month loaded', 'info');
            });
            
            monthSelect.addEventListener('change', () => {
                showToast(`Budget for ${monthSelect.options[monthSelect.selectedIndex].text} loaded`, 'info');
            });
            
            // Create budget modal
            createBudgetBtn.addEventListener('click', () => {
                createBudgetModal.classList.remove('hidden');
            });
            
            closeCreateBudgetModal.addEventListener('click', () => {
                createBudgetModal.classList.add('hidden');
            });
            
            cancelCreateBudget.addEventListener('click', () => {
                createBudgetModal.classList.add('hidden');
            });
            
            createBudgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('New budget created successfully!', 'success');
                createBudgetModal.classList.add('hidden');
                createBudgetForm.reset();
            });
            
            // Add category modal
            addCategoryBtn.addEventListener('click', () => {
                addCategoryModal.classList.remove('hidden');
            });
            
            closeAddCategoryModal.addEventListener('click', () => {
                addCategoryModal.classList.add('hidden');
            });
            
            cancelAddCategory.addEventListener('click', () => {
                addCategoryModal.classList.add('hidden');
            });
            
            addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('New category added successfully!', 'success');
                addCategoryModal.classList.add('hidden');
                addCategoryForm.reset();
                
                // Refresh categories
                populateCategories();
            });
            
            // Add goal modal
            addGoalBtn.addEventListener('click', () => {
                addGoalModal.classList.remove('hidden');
            });
            
            closeAddGoalModal.addEventListener('click', () => {
                addGoalModal.classList.add('hidden');
            });
            
            cancelAddGoal.addEventListener('click', () => {
                addGoalModal.classList.add('hidden');
            });
            
            addGoalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                showToast('New savings goal added successfully!', 'success');
                addGoalModal.classList.add('hidden');
                addGoalForm.reset();
                
                // Refresh goals
                populateGoals();
            });
            
            // Icon selection
            document.querySelectorAll('input[name="icon"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    // Remove border from all icons
                    document.querySelectorAll('input[name="icon"] + div').forEach(div => {
                        div.classList.remove('border-2', 'border-yellow-500', 'border-blue-500', 'border-green-500', 'border-purple-500', 'border-pink-500');
                    });
                    
                    // Add border to selected icon
                    const selectedDiv = this.nextElementSibling;
                    const color = this.value === 'utensils' ? 'yellow' : 
                                 this.value === 'car' ? 'blue' : 
                                 this.value === 'home' ? 'green' : 
                                 this.value === 'shopping-bag' ? 'purple' : 'pink';
                    selectedDiv.classList.add('border-2', `border-${color}-500`);
                });
            });
            
            // Save allocation button
            document.getElementById('saveAllocationBtn')?.addEventListener('click', () => {
                showToast('Budget allocation saved successfully!', 'success');
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
        }
        
        function navigateTo(page) {
            // Update page title based on navigation
            // In a real app, this would navigate to different pages
            alert(`Navigating to ${page} page... (This is a demo)`);
            
            // Update active navigation
            updateActiveNav(page);
        }
        
        // function updateActiveNav(activePage) {
        //     // Remove active class from all nav items
        //     const navItems = [dashboardNav, transactionsNav, analyticsNav, budgetNav, categoriesNav, settingsNav];
        //     navItems.forEach(nav => {
        //         nav.classList.remove('bg-blue-900', 'text-white');
        //         nav.classList.add('hover:bg-gray-800', 'text-gray-300');
        //     });
            
        //     // Add active class to current nav item
        //     switch(activePage) {
        //         case 'dashboard':
        //             dashboardNav.classList.add('bg-blue-900', 'text-white');
        //             dashboardNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //         case 'transactions':
        //             transactionsNav.classList.add('bg-blue-900', 'text-white');
        //             transactionsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //         case 'analytics':
        //             analyticsNav.classList.add('bg-blue-900', 'text-white');
        //             analyticsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //         case 'budget':
        //             budgetNav.classList.add('bg-blue-900', 'text-white');
        //             budgetNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //         case 'categories':
        //             categoriesNav.classList.add('bg-blue-900', 'text-white');
        //             categoriesNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //         case 'settings':
        //             settingsNav.classList.add('bg-blue-900', 'text-white');
        //             settingsNav.classList.remove('hover:bg-gray-800', 'text-gray-300');
        //             break;
        //     }
        // }
        
        function initializeCharts() {
            // Budget vs Actual Chart
            const budgetVsActualCtx = document.getElementById('budgetVsActualChart').getContext('2d');
            budgetVsActualChart = new Chart(budgetVsActualCtx, {
                type: 'bar',
                data: {
                    labels: ['Food', 'Shopping', 'Bills', 'Transport', 'Entertainment'],
                    datasets: [
                        {
                            label: 'Budget',
                            data: [700, 500, 350, 250, 200],
                            backgroundColor: '#3b82f6',
                            borderRadius: 6,
                            barPercentage: 0.6
                        },
                        {
                            label: 'Actual',
                            data: [645, 420, 320, 185, 120],
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
            
            // Budget Distribution Chart
            const budgetDistributionCtx = document.getElementById('budgetDistributionChart').getContext('2d');
            budgetDistributionChart = new Chart(budgetDistributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Essential', 'Discretionary', 'Savings', 'Debt'],
                    datasets: [{
                        data: [55, 25, 15, 5],
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
                                    return `${context.label}: ${context.parsed}%`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Budget History Chart
            const budgetHistoryCtx = document.getElementById('budgetHistoryChart').getContext('2d');
            budgetHistoryChart = new Chart(budgetHistoryCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Budget',
                            data: [3200, 3200, 3300, 3300, 3500, 3500],
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
                            data: [2850, 3100, 2950, 3400, 2845, 0],
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
        
        function populateCategories() {
            const categoriesGrid = document.querySelector('#categoriesContent .grid');
            if (!categoriesGrid) return;
            
            categoriesGrid.innerHTML = '';
            
            budgetCategories.forEach(category => {
                const percentage = (category.spent / category.budget) * 100;
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
                
                // Get icon class
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
                }
                
                const categoryCard = document.createElement('div');
                categoryCard.className = `${statusClass} budget-card p-5`;
                categoryCard.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full bg-${category.color}-100 flex items-center justify-center mr-3">
                                <i class="${iconClass} text-${category.color}-600"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-gray-800">${category.name}</h4>
                                <p class="text-gray-500 text-sm">$${category.spent} of $${category.budget}</p>
                            </div>
                        </div>
                        <span class="font-bold ${percentage >= 90 ? 'text-red-600' : percentage >= 75 ? 'text-yellow-600' : 'text-green-600'}">${Math.round(percentage)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div class="${progressClass} h-2 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500 text-sm">$${remaining} remaining</span>
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
            
            // Add event listeners to category buttons
            document.querySelectorAll('.edit-category').forEach(button => {
                button.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-id');
                    showToast(`Editing category ${categoryId}`, 'info');
                });
            });
            
            document.querySelectorAll('.delete-category').forEach(button => {
                button.addEventListener('click', function() {
                    const categoryId = this.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this category?')) {
                        showToast(`Category ${categoryId} deleted`, 'warning');
                    }
                });
            });
        }
        
        function populateGoals() {
            const goalsGrid = document.querySelector('#goalsContent .grid');
            if (!goalsGrid) return;
            
            goalsGrid.innerHTML = '';
            
            savingsGoals.forEach(goal => {
                const goalCard = document.createElement('div');
                goalCard.className = 'budget-card p-5';
                goalCard.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h4 class="font-medium text-gray-800">${goal.name}</h4>
                            <p class="text-gray-500 text-sm">$${goal.saved} of $${goal.target}</p>
                        </div>
                        <span class="font-bold ${goal.progress === 100 ? 'text-green-600' : goal.progress >= 50 ? 'text-blue-600' : 'text-yellow-600'}">${goal.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div class="${goal.progress === 100 ? 'bg-green-500' : goal.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'} h-2 rounded-full" style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-gray-500 text-sm">$${goal.monthly}/month</p>
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
            
            // Add event listeners to goal buttons
            document.querySelectorAll('.add-contribution').forEach(button => {
                button.addEventListener('click', function() {
                    const goalId = this.getAttribute('data-id');
                    showToast(`Adding contribution to goal ${goalId}`, 'info');
                });
            });
            
            document.querySelectorAll('.edit-goal').forEach(button => {
                button.addEventListener('click', function() {
                    const goalId = this.getAttribute('data-id');
                    showToast(`Editing goal ${goalId}`, 'info');
                });
            });
        }
        
        function populateBudgetHistory() {
            const historyTable = document.getElementById('budgetHistoryTable');
            if (!historyTable) return;
            
            historyTable.innerHTML = '';
            
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
            
            // Add drag event listeners
            draggableItems.forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    draggedItem = this;
                    this.classList.add('opacity-50');
                    e.dataTransfer.setData('text/plain', this.getAttribute('data-category'));
                });
                
                item.addEventListener('dragend', function() {
                    this.classList.remove('opacity-50');
                    draggedItem = null;
                    
                    // Remove drag-over class from all drop zones
                    dropZones.forEach(zone => {
                        zone.classList.remove('drag-over');
                    });
                });
            });
            
            // Add drop zone event listeners
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
                        // Clone the dragged item and add to allocated zone
                        const clonedItem = draggedItem.cloneNode(true);
                        clonedItem.classList.remove('opacity-50');
                        clonedItem.classList.add('mt-2');
                        this.appendChild(clonedItem);
                        
                        // Update the available budget display
                        updateBudgetAllocation();
                    }
                });
            });
        }
        
        function updateBudgetAllocation() {
            // In a real app, this would calculate the total allocated budget
            // For this demo, we'll just show a toast
            showToast('Budget allocation updated', 'info');
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