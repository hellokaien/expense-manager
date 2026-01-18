// src/shared/currencyUtils.js

import authManager from '../auth/auth.js';

/**
 * Currency configuration
 * Maps currency codes to their symbols and formatting options
 */
const CURRENCY_CONFIG = {
    USD: {
        symbol: '$',
        code: 'USD',
        name: 'US Dollar',
        locale: 'en-US',
        decimalPlaces: 2,
        symbolPosition: 'before', // 'before' or 'after'
        thousandSeparator: ',',
        decimalSeparator: '.'
    },
    PHP: {
        symbol: '₱',
        code: 'PHP',
        name: 'Philippine Peso',
        locale: 'en-PH',
        decimalPlaces: 2,
        symbolPosition: 'before',
        thousandSeparator: ',',
        decimalSeparator: '.'
    }
};

/**
 * Get the current user's currency preference
 * @returns {string} Currency code (default: 'USD')
 */
export function getCurrentCurrency() {
    try {
        const user = authManager.getCurrentUser();
        if (user && user.currency && CURRENCY_CONFIG[user.currency]) {
            return user.currency;
        }
        // Fallback to localStorage if authManager not available
        const storedUser = localStorage.getItem('moneyflow_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.currency && CURRENCY_CONFIG[parsed.currency]) {
                return parsed.currency;
            }
        }
    } catch (error) {
        console.warn('Error getting currency from user:', error);
    }
    return 'USD'; // Default currency
}

/**
 * Get currency configuration for a given currency code
 * @param {string} currencyCode - Currency code (default: current user's currency)
 * @returns {object} Currency configuration object
 */
export function getCurrencyConfig(currencyCode = null) {
    const code = currencyCode || getCurrentCurrency();
    return CURRENCY_CONFIG[code] || CURRENCY_CONFIG.USD;
}

/**
 * Get the currency symbol for a given currency code
 * @param {string} currencyCode - Currency code (default: current user's currency)
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode = null) {
    const config = getCurrencyConfig(currencyCode);
    return config.symbol;
}

/**
 * Format a number as currency string
 * @param {number} amount - Amount to format
 * @param {object} options - Formatting options
 * @param {string} options.currencyCode - Currency code (default: current user's currency)
 * @param {number} options.decimalPlaces - Number of decimal places (default: from config)
 * @param {boolean} options.showSymbol - Whether to include currency symbol (default: true)
 * @param {boolean} options.showDecimals - Whether to show decimals (default: true)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
    const {
        currencyCode = null,
        decimalPlaces = null,
        showSymbol = true,
        showDecimals = true
    } = options;

    const config = getCurrencyConfig(currencyCode);
    const symbol = config.symbol;
    
    // Handle null/undefined/NaN
    if (amount === null || amount === undefined || isNaN(amount)) {
        amount = 0;
    }

    // Convert to number
    const numAmount = parseFloat(amount);

    // Determine decimal places
    const decimals = decimalPlaces !== null 
        ? decimalPlaces 
        : (showDecimals ? config.decimalPlaces : 0);

    // Format the number with thousand separators
    let formattedNumber = numAmount.toLocaleString(config.locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    // Add currency symbol
    if (showSymbol) {
        if (config.symbolPosition === 'before') {
            formattedNumber = `${symbol}${formattedNumber}`;
        } else {
            formattedNumber = `${formattedNumber}${symbol}`;
        }
    }

    return formattedNumber;
}

/**
 * Format currency with sign (for income/expense display)
 * @param {number} amount - Amount to format
 * @param {string} type - 'income' or 'expense' (determines sign)
 * @param {object} options - Formatting options (same as formatCurrency)
 * @returns {string} Formatted currency string with sign
 */
export function formatCurrencyWithSign(amount, type = 'expense', options = {}) {
    const sign = type === 'income' ? '+' : '';
    const formatted = formatCurrency(amount, options);
    return `${sign}${formatted}`;
}

/**
 * Parse a currency string back to a number
 * @param {string} currencyString - Currency string (e.g., "$1,234.56" or "₱1,234.56")
 * @returns {number} Parsed number
 */
export function parseCurrency(currencyString) {
    if (!currencyString) return 0;
    
    // Remove currency symbols and whitespace
    const cleaned = currencyString
        .replace(/[\$₱€£¥,\s]/g, '')
        .trim();
    
    return parseFloat(cleaned) || 0;
}

/**
 * Get all available currencies
 * @returns {Array} Array of currency objects with code, symbol, and name
 */
export function getAvailableCurrencies() {
    return Object.keys(CURRENCY_CONFIG).map(code => ({
        code,
        symbol: CURRENCY_CONFIG[code].symbol,
        name: CURRENCY_CONFIG[code].name
    }));
}

/**
 * Check if a currency code is valid
 * @param {string} currencyCode - Currency code to check
 * @returns {boolean} True if valid
 */
export function isValidCurrency(currencyCode) {
    return CURRENCY_CONFIG.hasOwnProperty(currencyCode);
}

// Default export with all utilities
export default {
    getCurrentCurrency,
    getCurrencyConfig,
    getCurrencySymbol,
    formatCurrency,
    formatCurrencyWithSign,
    parseCurrency,
    getAvailableCurrencies,
    isValidCurrency,
    CURRENCY_CONFIG
};
