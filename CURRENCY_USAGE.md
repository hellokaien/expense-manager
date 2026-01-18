# Currency Utility Usage Guide

The `currencyUtils.js` provides a centralized way to handle currency formatting throughout the application.

## Features

- Support for USD ($) and Philippine Peso (₱)
- Automatic currency detection from user settings
- Consistent formatting across the app
- Easy to extend with more currencies

## Quick Start

```javascript
import { formatCurrency, getCurrencySymbol, formatCurrencyWithSign } from '../shared/currencyUtils.js';

// Format a number as currency (uses current user's currency)
const formatted = formatCurrency(1234.56);
// USD: "$1,234.56"
// PHP: "₱1,234.56"

// Get just the symbol
const symbol = getCurrencySymbol();
// USD: "$"
// PHP: "₱"

// Format with sign for income/expense
const income = formatCurrencyWithSign(1000, 'income');
// "+$1,000.00" or "+₱1,000.00"

const expense = formatCurrencyWithSign(500, 'expense');
// "$500.00" or "₱500.00"
```

## Available Functions

### `formatCurrency(amount, options)`
Formats a number as currency string.

**Parameters:**
- `amount` (number): The amount to format
- `options` (object, optional):
  - `currencyCode` (string): Override user's currency
  - `decimalPlaces` (number): Number of decimal places
  - `showSymbol` (boolean): Include currency symbol (default: true)
  - `showDecimals` (boolean): Show decimals (default: true)

**Example:**
```javascript
formatCurrency(1234.56)                    // "$1,234.56"
formatCurrency(1234.56, { showDecimals: false })  // "$1,235"
formatCurrency(1234.56, { currencyCode: 'PHP' })  // "₱1,234.56"
```

### `getCurrencySymbol(currencyCode)`
Gets the currency symbol for a given currency code.

**Parameters:**
- `currencyCode` (string, optional): Currency code (default: user's currency)

**Example:**
```javascript
getCurrencySymbol()     // "$" or "₱"
getCurrencySymbol('PHP') // "₱"
```

### `formatCurrencyWithSign(amount, type, options)`
Formats currency with a sign prefix for income/expense display.

**Parameters:**
- `amount` (number): The amount to format
- `type` (string): 'income' or 'expense'
- `options` (object, optional): Same as formatCurrency

**Example:**
```javascript
formatCurrencyWithSign(1000, 'income')   // "+$1,000.00"
formatCurrencyWithSign(500, 'expense')   // "$500.00"
```

### `getCurrentCurrency()`
Gets the current user's currency preference.

**Returns:** Currency code (e.g., 'USD', 'PHP')

### `getAvailableCurrencies()`
Gets all available currencies.

**Returns:** Array of currency objects

## Migration Example

### Before (Hardcoded $):
```javascript
const amount = transaction.amount;
const display = `$${amount.toFixed(2)}`;
```

### After (Using Utility):
```javascript
import { formatCurrency } from '../shared/currencyUtils.js';

const amount = transaction.amount;
const display = formatCurrency(amount);
```

### Before (With toLocaleString):
```javascript
const display = `$${amount.toLocaleString()}`;
```

### After:
```javascript
const display = formatCurrency(amount);
```

## Setting Currency

Users can set their preferred currency in:
1. **Signup page**: Select currency during account creation
2. **Settings page**: Change currency in Financial Preferences

The selected currency is stored in the user profile and automatically used throughout the app.
