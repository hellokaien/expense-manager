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