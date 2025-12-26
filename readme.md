json-server --watch db.json --port 3000

# Expense Management System Roadmap

## 📋 **Phase 1: Project Setup & Planning**
### Week 1: Foundation
1. **Define Requirements**
   - User authentication (login/signup)
   - Add/Edit/Delete expenses
   - Categorize expenses (Food, Travel, Utilities, etc.)
   - View expense history with filters
   - Dashboard with summaries/charts
   - Export data option

2. **Tech Stack Setup**
   - HTML5 (Structure)
   - CSS3 (Styling + Flexbox/Grid)
   - JavaScript ES6+ (Logic)
   - JSON Server (Mock backend)
   - Chart.js for visualizations

3. **Project Structure**
   ```
   expense-manager/
   ├── index.html
   ├── style.css
   ├── app.js
   ├── auth/
   │   ├── login.html
   │   ├── signup.html
   │   └── auth.js
   ├── dashboard/
   │   ├── dashboard.html
   │   └── dashboard.js
   ├── expenses/
   │   ├── add-expense.html
   │   ├── view-expenses.html
   │   └── expenses.js
   ├── db.json (for JSON Server)
   └── README.md
   ```

## 🛠 **Phase 2: Backend Simulation**
### Week 2: JSON Server Setup
1. **Install JSON Server**
   ```bash
   npm install -g json-server
   ```

2. **Create `db.json` Structure**
   ```json
   {
     "users": [
       {
         "id": 1,
         "name": "John Doe",
         "email": "john@example.com",
         "password": "hashed_password"
       }
     ],
     "expenses": [
       {
         "id": 1,
         "userId": 1,
         "title": "Groceries",
         "amount": 85.50,
         "category": "Food",
         "date": "2024-01-15",
         "description": "Weekly grocery shopping"
       }
     ],
     "categories": [
       "Food", "Transportation", "Entertainment", 
       "Utilities", "Healthcare", "Shopping", "Other"
     ]
   }
   ```

3. **Start JSON Server**
   ```bash
   json-server --watch db.json --port 3000
   ```

## 🎨 **Phase 3: Frontend Development**
### Week 3: Core UI Components
1. **Authentication Pages**
   - Clean login/signup forms
   - Form validation
   - Local storage for session management

2. **Dashboard Layout**
   - Header with navigation
   - Stats cards (Total spent, by category, etc.)
   - Recent expenses table
   - Chart container

3. **Expense Management UI**
   - Add expense form with category dropdown
   - Expense list table with sort/filter
   - Edit/Delete buttons with modals

### Week 4: Styling & Responsiveness
1. **CSS Design System**
   - Color palette and typography
   - Consistent button/form styles
   - Mobile-first responsive design

2. **Component Library**
   - Cards, modals, alerts
   - Tables and forms
   - Loading states

## ⚡ **Phase 4: JavaScript Functionality**
### Week 5: Core Features
1. **Authentication Logic**
   ```javascript
   // Example: Login function
   async function loginUser(email, password) {
     const response = await fetch('http://localhost:3000/users?email=' + email);
     const users = await response.json();
     // Validate credentials
   }
   ```

2. **CRUD Operations for Expenses**
   - Create: POST to `/expenses`
   - Read: GET from `/expenses?userId=X`
   - Update: PUT to `/expenses/:id`
   - Delete: DELETE to `/expenses/:id`

3. **Data Filtering & Sorting**
   - Filter by date range, category, amount
   - Sort by date, amount

### Week 6: Advanced Features
1. **Dashboard Analytics**
   - Calculate monthly totals
   - Category-wise spending breakdown
   - Chart.js integration for visualization

2. **Data Export**
   - Export to CSV functionality
   - Print report option

3. **Search & Advanced Filters**

## 🔧 **Phase 5: Integration & Polish**
### Week 7: Testing & Refinement
1. **Connect All Components**
   - Ensure smooth navigation
   - Data persistence between pages
   - Error handling

2. **Form Validations**
   - Client-side validation
   - User feedback (success/error messages)

3. **Performance Optimization**
   - Minimize API calls
   - Implement loading states
   - Cache frequent data

### Week 8: Deployment & Documentation
1. **Final Testing**
   - Cross-browser testing
   - Mobile responsiveness check
   - User flow testing

2. **Documentation**
   - User guide
   - Code comments
   - Setup instructions

3. **Deployment Options**
   - GitHub Pages (frontend only)
   - Free hosting (Netlify, Vercel)
   - JSON Server on separate service

## 🚀 **Quick Start Template**

**index.html (Dashboard Example):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Manager</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>Expense Dashboard</h1>
            <button id="logoutBtn">Logout</button>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Spent</h3>
                <p class="amount" id="totalAmount">$0.00</p>
            </div>
            <!-- More stat cards -->
        </div>
        
        <div class="main-content">
            <div class="chart-container">
                <canvas id="expenseChart"></canvas>
            </div>
            <div class="recent-expenses">
                <h2>Recent Expenses</h2>
                <table id="expensesTable">
                    <!-- Filled by JavaScript -->
                </table>
            </div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

**app.js (Core Functions):**
```javascript
const API_URL = 'http://localhost:3000';

// Check authentication
function checkAuth() {
    if (!localStorage.getItem('user')) {
        window.location.href = 'auth/login.html';
    }
}

// Fetch expenses
async function fetchExpenses() {
    const userId = JSON.parse(localStorage.getItem('user')).id;
    const response = await fetch(`${API_URL}/expenses?userId=${userId}`);
    return await response.json();
}

// Add expense
async function addExpense(expenseData) {
    const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
    });
    return await response.json();
}
```

## 📚 **Learning Resources**
- [JSON Server Documentation](https://github.com/typicode/json-server)
- [Chart.js Guide](https://www.chartjs.org/docs/latest/)
- [Fetch API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [LocalStorage Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 💡 **Pro Tips**
1. Start with a simple MVP (Minimum Viable Product)
2. Use browser localStorage for session management initially
3. Implement one feature at a time
4. Test API endpoints with Postman or curl first
5. Use console.log() extensively for debugging
6. Regularly commit code to Git

This roadmap is designed for a 2-month part-time project. Adjust timelines based on your experience level. Good luck with your Expense Management System!