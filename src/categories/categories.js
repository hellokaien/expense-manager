import { showNotification, API_BASE_URL, getInitials } from '../shared/utils.js';
import authManager from '../auth/auth.js';
import categoryService from '../shared/services/categoryService.js';
import transactionService from '../shared/services/transactionService.js';  
import { logout } from '../app.js';
import { formatCurrency } from '../shared/currencyUtils.js';

// DOM Elements
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');
const addNewCategoryBtn = document.getElementById('addNewCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const closeCategoryModal = document.getElementById('closeCategoryModal');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const categoryForm = document.getElementById('categoryForm');
const deleteCategoryModal = document.getElementById('deleteCategoryModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const categorySearch = document.getElementById('categorySearch');
const categoryTabBtns = document.querySelectorAll('.category-tab-btn');
const categoriesTableBody = document.getElementById('categoriesTableBody');
const emptyCategoriesState = document.getElementById('emptyCategoriesState');
const categoryPreview = document.getElementById('categoryPreview');
const noCategorySelected = document.getElementById('noCategorySelected');
const toastNotification = document.getElementById('toastNotification');
const selectAllCategories = document.getElementById('selectAllCategories');
const selectedCount = document.getElementById('selectedCount');
const bulkEditBtn = document.getElementById('bulkEditBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const bulkExportBtn = document.getElementById('bulkExportBtn');
const sortByNameBtn = document.getElementById('sortByNameBtn');
const sortByUsageBtn = document.getElementById('sortByUsageBtn');
const quickCreateButtons = ['quickFoodBtn', 'quickTransportBtn', 'quickSalaryBtn', 'quickEntertainmentBtn', 'customQuickCreateBtn'];
const addFirstCategoryBtn = document.getElementById('addFirstCategoryBtn');
const loadingState = document.getElementById('loadingState');

// Navigation elements
const dashboardNav = document.getElementById('dashboardNav');
const transactionsNav = document.getElementById('transactionsNav');
const analyticsNav = document.getElementById('analyticsNav');
const budgetNav = document.getElementById('budgetNav');
const categoriesNav = document.getElementById('categoriesNav');
const settingsNav = document.getElementById('settingsNav');

// Modal state
let isEditing = false;
let editingCategoryId = null;
let selectedCategoryId = null;
let selectedCategories = new Set();
let currentFilter = 'all';
let categories = [];


async function fetchCategories() {
    try {
        loadingState.classList.remove('hidden');
        
        categories = await categoryService.getCategories();
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        showNotification('Failed to load categories', 'error');
        return [];
    } finally {
            loadingState.classList.add('hidden');
    }
}

async function loadCategories() {
    await fetchCategories();
    renderCategories();
    updateStats();
}

function updateStats(){
    let totalIncome = 0;
    let totalExpenses = 0;

    categories.forEach(category => {
        if (category.type === 'income') {
            totalIncome++;
        } else {
            totalExpenses++;
        }
    });

    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalIncomeCategories').textContent = totalIncome;
    document.getElementById('totalExpenseCategories').textContent = totalExpenses;
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

    // Populate categories table
    loadCategories();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize color and icon selection
    initializeColorAndIconSelection();
});

function setupEventListeners() {
    // Toggle sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('ml-64');
        mainContent.classList.toggle('ml-20');
    });
    
    // Navigation
    //dashboardNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('dashboard');
    //});
    
    //transactionsNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('transactions');
    //});
    
    //analyticsNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('analytics');
    //});
    
    //budgetNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('budget');
    //});
    
    //categoriesNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('categories');
    //});
    
    //settingsNav.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    navigateTo('settings');
    //});
    
    // Category tabs
    categoryTabBtns.forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // Update active button
            categoryTabBtns.forEach(btn => {
                btn.classList.remove('tab-active');
                btn.classList.add('tab-inactive');
        });
            
            this.classList.remove('tab-inactive');
            this.classList.add('tab-active');
            
            // Update current filter and re-render
            currentFilter = tab;
            renderCategories();
        });
    });
    
    // Search functionality
    categorySearch.addEventListener('input', debounce(() => {
        renderCategories();
    }, 300));
    
    // Add new category modal
    addNewCategoryBtn.addEventListener('click', () => {
        openCategoryModal();
    });
    
    // Quick create buttons
    quickCreateButtons.forEach(buttonId => {
        document.getElementById(buttonId)?.addEventListener('click', () => {
            openCategoryModal();
            
            // Pre-fill based on button type
            if (buttonId === 'quickFoodBtn') {
                document.getElementById('categoryName').value = 'Food & Dining';
                document.getElementById('categoryType').value = 'expense';
                document.getElementById('categorySubtype').value = 'essential';
                document.getElementById('selectedColor').value = '#f59e0b';
                document.getElementById('selectedIcon').value = 'utensils';
                updateColorAndIconSelection();
            } else if (buttonId === 'quickTransportBtn') {
                document.getElementById('categoryName').value = 'Transportation';
                document.getElementById('categoryType').value = 'expense';
                document.getElementById('categorySubtype').value = 'essential';
                document.getElementById('selectedColor').value = '#3b82f6';
                document.getElementById('selectedIcon').value = 'car';
                updateColorAndIconSelection();
            } else if (buttonId === 'quickSalaryBtn') {
                document.getElementById('categoryName').value = 'Salary';
                document.getElementById('categoryType').value = 'income';
                document.getElementById('categorySubtype').value = 'essential';
                document.getElementById('selectedColor').value = '#10b981';
                document.getElementById('selectedIcon').value = 'money-bill-wave';
                updateColorAndIconSelection();
            } else if (buttonId === 'quickEntertainmentBtn') {
                document.getElementById('categoryName').value = 'Entertainment';
                document.getElementById('categoryType').value = 'expense';
                document.getElementById('categorySubtype').value = 'discretionary';
                document.getElementById('selectedColor').value = '#ec4899';
                document.getElementById('selectedIcon').value = 'film';
                updateColorAndIconSelection();
            }
        });
    });
    
    // Add first category button
    addFirstCategoryBtn?.addEventListener('click', () => {
        openCategoryModal();
    });
    
    // Category modal
    closeCategoryModal.addEventListener('click', closeCategoryModalFunc);
    cancelCategoryBtn.addEventListener('click', closeCategoryModalFunc);
    
    categoryForm.addEventListener('submit', saveCategory);
    
    // Delete modal
    cancelDeleteBtn.addEventListener('click', () => {
        deleteCategoryModal.classList.add('hidden');
    });
    
    confirmDeleteBtn.addEventListener('click', deleteCategory);
    
    // Bulk actions
    selectAllCategories.addEventListener('change', toggleSelectAll);
    bulkEditBtn.addEventListener('click', editSelectedCategories);
    bulkDeleteBtn.addEventListener('click', deleteSelectedCategories);
    bulkExportBtn.addEventListener('click', exportSelectedCategories);
    
    // Sorting
    sortByNameBtn.addEventListener('click', () => {
        sortCategories('name');
        showNotification('Categories sorted by name', 'info');
    });
    
    sortByUsageBtn.addEventListener('click', () => {
        sortCategories('usage');
        showNotification('Categories sorted by usage', 'info');
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
    
    // Edit and delete preview buttons
    document.getElementById('editPreviewBtn')?.addEventListener('click', () => {
        if (selectedCategoryId) {
            editCategory(selectedCategoryId);
        }
    });
    
    document.getElementById('deletePreviewBtn')?.addEventListener('click', () => {
        if (selectedCategoryId) {
            showDeleteConfirmation(selectedCategoryId);
        }
    });
}

function navigateTo(page) {
    // Update page title based on navigation
    // In a real app, this would navigate to different pages
    alert(`Navigating to ${page} page... (This is a demo)`);

}

function renderCategories() {
    const searchTerm = categorySearch.value.toLowerCase();
    
    // Filter categories
    let filteredCategories = categories.filter(category => {
        // Apply search filter
        const matchesSearch = category.name.toLowerCase().includes(searchTerm) || 
                                (category.description && category.description.toLowerCase().includes(searchTerm));
        
        // Apply type filter
        let matchesType = true;
        if (currentFilter === 'income') {
            matchesType = category.type === 'income';
        } else if (currentFilter === 'expense') {
            matchesType = category.type === 'expense';
        } else if (currentFilter === 'custom') {
            matchesType = category.isCustom === true;
        }
        
        return matchesSearch && matchesType;
    });
    
    // Clear table
    categoriesTableBody.innerHTML = '';
    selectedCategories.clear();
    updateSelectedCount();
    
    if (filteredCategories.length === 0) {
        emptyCategoriesState.classList.remove('hidden');
        categoriesTableBody.classList.add('hidden');
    } else {
        emptyCategoriesState.classList.add('hidden');
        categoriesTableBody.classList.remove('hidden');
        
        // Sort by order
        filteredCategories.sort((a, b) => a.order - b.order);
        
        // Render each category
        filteredCategories.forEach(category => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100 hover:bg-gray-50 draggable-item';
            row.dataset.id = category.id;
            
            // Format last used date
            const lastUsed = new Date(category.lastUsed);
            const formattedDate = lastUsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
            const isRecent = (new Date() - lastUsed) < 7 * 24 * 60 * 60 * 1000; // Within last 7 days
            
            // Determine type badge class
            const typeClass = category.type === 'income' ? 'category-income' : 'category-expense';
            const typeIcon = category.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';
            
            // Determine subtype badge class
            let subtypeClass = 'type-other';
            switch(category.subtype) {
                case 'essential': subtypeClass = 'type-essential'; break;
                case 'discretionary': subtypeClass = 'type-discretionary'; break;
                case 'savings': subtypeClass = 'type-savings'; break;
            }
            
            row.innerHTML = `
                <td class="py-4">
                    <div class="flex items-center">
                        <input type="checkbox" class="category-checkbox w-5 h-5 border border-gray-300 rounded mr-3" data-id="${category.id}">
                        <div class="drag-handle">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                    </div>
                </td>
                <td class="py-4">
                    <div class="flex items-center">
                        <div class="category-icon-preview mr-3" style="background-color: ${category.color}20; color: ${category.color};">
                            <i class="fas fa-${category.icon}"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${category.name}</div>
                            ${category.description ? `<div class="text-gray-500 text-sm mt-1">${category.description}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-4">
                    <div class="flex flex-col space-y-1">
                        <span class="category-badge ${typeClass}">
                            <i class="fas ${typeIcon} mr-1"></i> ${category.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                        <span class="category-badge ${subtypeClass}">
                            ${category.subtype.charAt(0).toUpperCase() + category.subtype.slice(1)}
                        </span>
                    </div>
                </td>
                <td class="py-4 text-gray-700">
                    <div class="font-medium ml-5">${category.transactions_count}</div>
                    <div class="text-gray-500 text-sm ml-5">${formatCurrency(category.totalAmount)}</div>
                </td>
                <td class="py-4">
                    <div class="text-gray-700">${formattedDate}</div>
                    ${isRecent ? '<div class="text-green-600 text-sm"><i class="fas fa-circle mr-1"></i> Recent</div>' : ''}
                </td>
                <td class="py-4">
                    <div class="flex space-x-2">
                        <button class="view-category text-blue-600 hover:text-blue-800" data-id="${category.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="edit-category text-gray-600 hover:text-gray-800" data-id="${category.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-category text-red-600 hover:text-red-800" data-id="${category.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            categoriesTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-category').forEach(button => {
            button.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                viewCategory(categoryId);
            });
        });
        
        document.querySelectorAll('.edit-category').forEach(button => {
            button.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                editCategory(categoryId);
            });
        });
        
        document.querySelectorAll('.delete-category').forEach(button => {
            button.addEventListener('click', function() {
                const categoryId = this.getAttribute('data-id');
                showDeleteConfirmation(categoryId);
            });
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const categoryId = this.getAttribute('data-id');
                
                if (this.checked) {
                    selectedCategories.add(categoryId);
                } else {
                    selectedCategories.delete(categoryId);
                    selectAllCategories.checked = false;
                }
                
                updateSelectedCount();
                updateBulkActions();
                
            });
        });
        
        // Initialize drag and drop for reordering
        initializeDragAndDrop();
        updateStats();
    }
}

function viewCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    selectedCategoryId = categoryId;
    
    // Show preview and hide placeholder
    categoryPreview.classList.remove('hidden');
    noCategorySelected.classList.add('hidden');
    
    // Update preview content
    document.getElementById('previewName').textContent = category.name;
    document.getElementById('previewIcon').innerHTML = `<i class="fas fa-${category.icon}"></i>`;
    document.getElementById('previewIcon').style.backgroundColor = `${category.color}20`;
    document.getElementById('previewIcon').style.color = category.color;
    
    // Update type badges
    const typeBadge = document.getElementById('previewType');
    typeBadge.textContent = category.type === 'income' ? 'Income' : 'Expense';
    typeBadge.className = `category-badge ${category.type === 'income' ? 'category-income' : 'category-expense'}`;
    
    const subtypeBadge = document.getElementById('previewSubtype');
    let subtypeClass = 'type-other';
    switch(category.subtype) {
        case 'essential': subtypeClass = 'type-essential'; break;
        case 'discretionary': subtypeClass = 'type-discretionary'; break;
        case 'savings': subtypeClass = 'type-savings'; break;
    }
    subtypeBadge.textContent = category.subtype.charAt(0).toUpperCase() + category.subtype.slice(1);
    subtypeBadge.className = `category-badge ${subtypeClass}`;
    
    // Update stats
    document.getElementById('previewTransactions').textContent = `${category.transactions_count} transactions`;
    document.getElementById('previewAmount').textContent = `$${category.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const lastUsed = new Date(category.lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now - lastUsed);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let lastUsedText = lastUsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (diffDays === 0) {
        lastUsedText = 'Today';
    } else if (diffDays === 1) {
        lastUsedText = 'Yesterday';
    } else if (diffDays < 7) {
        lastUsedText = `${diffDays} days ago`;
    }
    
    document.getElementById('previewLastUsed').textContent = lastUsedText;
    document.getElementById('previewMonthlyAvg').textContent = `$${category.monthlyAverage.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function openCategoryModal(category = null) {
    isEditing = category !== null;
    editingCategoryId = category ? category.id : null;
    
    // Update modal title
    document.getElementById('modalTitle').textContent = isEditing ? 'Edit Category' : 'Add New Category';
    
    // Clear or populate form
    if (category) {
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryType').value = category.type;
        document.getElementById('categorySubtype').value = category.subtype;
        document.getElementById('categoryBudget').value = category.budget || '';
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('selectedColor').value = category.color;
        document.getElementById('selectedIcon').value = category.icon;
        
        // Update color and icon selection
        updateColorAndIconSelection();
    } else {
        categoryForm.reset();
        document.getElementById('selectedColor').value = '#ef4444';
        document.getElementById('selectedIcon').value = 'utensils';
        updateColorAndIconSelection();
    }
    
    // Show modal
    categoryModal.classList.remove('hidden');
}

function closeCategoryModalFunc() {
    categoryModal.classList.add('hidden');
    categoryForm.reset();
    isEditing = false;
    editingCategoryId = null;
}

async function saveCategory(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('categoryName').value;
    const type = document.getElementById('categoryType').value;
    const subtype = document.getElementById('categorySubtype').value;
    const budget = document.getElementById('categoryBudget').value;
    const description = document.getElementById('categoryDescription').value;
    const color = document.getElementById('selectedColor').value;
    const icon = document.getElementById('selectedIcon').value;
    
    if (!name || !type || !subtype) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        if (isEditing && editingCategoryId) {
            // Find the existing category
            const existingCategory = categories.find(c => c.id === editingCategoryId);
            
            if (!existingCategory) {
                showNotification('Category not found', 'error');
                return;
            }
            
            // Merge updates with existing data
            const categoryData = {
                ...existingCategory, // Keep all existing fields
                name: name,
                type: type,
                subtype: subtype,
                icon: icon,
                color: color,
                description: description,
                budget: budget ? parseFloat(budget) : null,
                // Preserve other fields like:
                // transactions_count, totalAmount, lastUsed, monthlyAverage, isCustom, order
            };
            
            await updateCategory(editingCategoryId, categoryData);
            showNotification('Category updated successfully!', 'success');
        } else {
            // For new category
            const categoryId = `ctg-${crypto.randomUUID()}`;
            const categoryData = {
                id: categoryId,
                name: name,
                type: type,
                subtype: subtype,
                icon: icon,
                color: color,
                transactions_count: 0,
                totalAmount: 0,
                lastUsed: new Date().toISOString().split('T')[0],
                monthlyAverage: 0,
                description: description,
                budget: budget ? parseFloat(budget) : null,
                isCustom: false,
                order: categories.length + 1
            };
            
            await addCategory(categoryData);
            showNotification('Category created successfully!', 'success');
        }
        
        // Update UI
        renderCategories();
        
        // If we were viewing this category, update the preview
        if (isEditing && editingCategoryId === selectedCategoryId) {
            viewCategory(editingCategoryId);
        }
        
        // Close modal and reset form
        closeCategoryModalFunc();
        
        // Reset editing state
        isEditing = false;
        editingCategoryId = null;
        
    } catch (error) {
        console.error('Error saving category:', error);
        showNotification('Failed to save category', 'error');
    }
}

async function addCategory(categoryData){
    try{
        const newCategory = await categoryService.createCategory(categoryData);
        categories.push(newCategory);
        return newCategory;
    } catch (error){
        console.error('Error adding category:', error);
        throw error;
    }
}

async function updateCategory(id, category){
    try {
        const updatedCategory = await categoryService.updateCategory(id, category);

        const index = categories.findIndex(c => c.id === id);
        if(index !== -1){
            categories[index] = updatedCategory;
        }

        return updatedCategory;
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    openCategoryModal(category);
}

function showDeleteConfirmation(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Update delete message
    document.getElementById('deleteMessage').textContent = 
        `Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`;
    
    // Store category ID for deletion
    confirmDeleteBtn.dataset.categoryId = categoryId;
    
    // Show modal
    deleteCategoryModal.classList.remove('hidden');
}

async function deleteCategory() {
    const categoryId = confirmDeleteBtn.dataset.categoryId;
    
    try {
        // Delete from server using service
        await deleteCategoryFromServerid(categoryId);
        
        // Remove category from array
        categories = categories.filter(c => c.id !== categoryId);
        
        // Remove from selected categories
        selectedCategories.delete(categoryId);
        
        // Hide preview if deleted category was being viewed
        if (selectedCategoryId === categoryId) {
            categoryPreview.classList.add('hidden');
            noCategorySelected.classList.remove('hidden');
            selectedCategoryId = null;
        }
        
        // Update UI
        renderCategories();
        
        // Show notification
        showNotification('Category deleted successfully!', 'warning');
        
        // Close modal
        deleteCategoryModal.classList.add('hidden');
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Failed to delete category', 'error');
    }
}

async function deleteCategoryFromServerid(id){
    try {
        await categoryService.deleteCategory(id);
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

function toggleSelectAll() {
    const isChecked = selectAllCategories.checked;
    const checkboxes = document.querySelectorAll('.category-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const categoryId = checkbox.getAttribute('data-id');
        
        if (isChecked) {
            selectedCategories.add(categoryId);
        } else {
            selectedCategories.delete(categoryId);
        }
    });
    
    updateSelectedCount();
    updateBulkActions();
}

function updateSelectedCount() {
    const selected = selectedCategories.size;
    selectedCount.textContent = `${selected} categor${selected === 1 ? 'y' : 'ies'} selected`;
}

function updateBulkActions() {
    const hasSelected = selectedCategories.size > 0;
    
    bulkEditBtn.disabled = !hasSelected || selectedCategories.size !== 1;
    bulkDeleteBtn.disabled = !hasSelected;
}

function editSelectedCategories() {
    if (selectedCategories.size !== 1) return;
    
    const categoryId = Array.from(selectedCategories)[0];
    editCategory(categoryId);
}

async function deleteSelectedCategories() {
    if (selectedCategories.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCategories.size} categor${selectedCategories.size === 1 ? 'y' : 'ies'}?`)) {
        try {
            const categoryIds = Array.from(selectedCategories);
            const deletedCount = categoryIds.length;
            
            // Delete from server using service
            if (categoryIds.length === 1) {
                await categoryService.deleteCategory(categoryIds[0]);
            } else {
                await categoryService.deleteMultipleCategories(categoryIds);
            }
            
            // Remove selected categories from array
            categories = categories.filter(c => !selectedCategories.has(c.id));
            
            // Hide preview if deleted categories included the viewed one
            if (selectedCategoryId && selectedCategories.has(selectedCategoryId)) {
                categoryPreview.classList.add('hidden');
                noCategorySelected.classList.remove('hidden');
                selectedCategoryId = null;
            }
            
            // Clear selected categories
            selectedCategories.clear();
            
            // Update UI
            renderCategories();
            
            // Show notification
            showNotification(`${deletedCount} categor${deletedCount === 1 ? 'y' : 'ies'} deleted successfully!`, 'warning');
        } catch (error) {
            console.error('Error deleting categories:', error);
            showNotification('Failed to delete categories', 'error');
        }
    }
}

function exportSelectedCategories() {
    let categoriesToExport = [];
    
    if (selectedCategories.size > 0) {
        categoriesToExport = categories.filter(c => selectedCategories.has(c.id));
    } else {
        categoriesToExport = categories;
    }
    
    // In a real app, this would export to CSV or JSON
    showNotification(`Exported ${categoriesToExport.length} categories`, 'success');
}

function sortCategories(sortBy) {
    if (sortBy === 'name') {
        categories.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'usage') {
        categories.sort((a, b) => b.transactions - a.transactions);
    }
    
    // Update order property
    categories.forEach((category, index) => {
        category.order = index + 1;
    });
    
    renderCategories();
}

function initializeColorAndIconSelection() {
    // Color selection
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all color options
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input
            document.getElementById('selectedColor').value = this.getAttribute('data-color');
        });
    });
    
    // Icon selection
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all icon options
            document.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input
            document.getElementById('selectedIcon').value = this.getAttribute('data-icon');
        });
    });
}

function updateColorAndIconSelection() {
    const selectedColor = document.getElementById('selectedColor').value;
    const selectedIcon = document.getElementById('selectedIcon').value;
    
    // Update color selection
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-color') === selectedColor) {
            option.classList.add('selected');
        }
    });
    
    // Update icon selection
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-icon') === selectedIcon) {
            option.classList.add('selected');
        }
    });
}

function initializeDragAndDrop() {
    const draggableItems = document.querySelectorAll('.draggable-item');
    const dragHandles = document.querySelectorAll('.drag-handle');
    
    draggableItems.forEach(item => {
        item.draggable = true;
        
        item.addEventListener('dragstart', function(e) {
            this.classList.add('sortable-chosen');
            e.dataTransfer.setData('text/plain', this.dataset.id);
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('sortable-chosen');
            
            // Remove ghost class from all items
            draggableItems.forEach(item => {
                item.classList.remove('sortable-ghost');
            });
        });
    });
    
    // Make the entire table body a drop zone
    categoriesTableBody.addEventListener('dragover', function(e) {
        e.preventDefault();
        
        const afterElement = getDragAfterElement(this, e.clientY);
        const draggable = document.querySelector('.sortable-chosen');
        
        if (afterElement == null) {
            this.appendChild(draggable);
        } else {
            this.insertBefore(draggable, afterElement);
        }
    });
    
    categoriesTableBody.addEventListener('drop', function(e) {
        e.preventDefault();
        
        const id = e.dataTransfer.getData('text/plain');
        const draggedItem = document.querySelector(`[data-id="${id}"]`);
        
        // Update category order based on new position
        const items = Array.from(this.querySelectorAll('.draggable-item'));
        items.forEach((item, index) => {
            const categoryId = item.dataset.id;
            const category = categories.find(c => c.id === categoryId);
            if (category) {
                category.order = index + 1;
            }
        });
        
        showNotification('Category order updated', 'info');
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-item:not(.sortable-chosen)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

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