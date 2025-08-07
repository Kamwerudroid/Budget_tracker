// DOM Elements
const transactionDescriptionInput = document.getElementById('transactionDescription');
const transactionAmountInput = document.getElementById('transactionAmount');
const transactionTypeSelect = document.getElementById('transactionType');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionListDiv = document.getElementById('transactionList');
const totalIncomeDisplay = document.getElementById('totalIncomeDisplay');
const totalExpensesDisplay = document.getElementById('totalExpensesDisplay');
const balanceDisplay = document.getElementById('balanceDisplay');
const showAllBtn = document.getElementById('showAllBtn');
const showIncomeBtn = document.getElementById('showIncomeBtn');
const showExpensesBtn = document.getElementById('showExpensesBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageBoxCloseBtn = document.getElementById('messageBoxCloseBtn');

// Array to store transactions (income and expenses)
let transactions = [];
// Variable to keep track of the current filter ('all', 'income', 'expense')
let currentFilter = 'all';

// --- Cookie Utility Functions ---

/**
 * Sets a cookie with a given name, value, and expiration days.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 * @param {number} days - The number of days until the cookie expires.
 */
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

/**
 * Gets the value of a cookie by its name.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} The cookie's value, or null if not found.
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Trim leading spaces
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

/**
 * Deletes a cookie by setting its expiration date to the past.
 * @param {string} name - The name of the cookie to delete.
 */
function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// --- UI Utility Functions ---

/**
 * Shows a custom message box.
 * @param {string} message - The message to display.
 */
function showMessageBox(message) {
    messageText.textContent = message;
    messageBox.classList.remove('hidden');
}

/**
 * Hides the custom message box.
 */
function hideMessageBox() {
    messageBox.classList.add('hidden');
}

// --- Budget Tracking Core Functions ---

/**
 * Calculates and displays the total income, total expenses, and current balance.
 */
function calculateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
            totalExpenses += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    totalIncomeDisplay.textContent = `$${totalIncome.toFixed(2)}`;
    totalExpensesDisplay.textContent = `$${totalExpenses.toFixed(2)}`;
    balanceDisplay.textContent = `$${balance.toFixed(2)}`;

    // Apply color based on balance
    if (balance >= 0) {
        balanceDisplay.classList.remove('text-red-800');
        balanceDisplay.classList.add('text-blue-800');
    } else {
        balanceDisplay.classList.remove('text-blue-800');
        balanceDisplay.classList.add('text-red-800');
    }
}

/**
 * Renders the list of transactions based on the current filter and updates the summary.
 */
function renderTransactions() {
    transactionListDiv.innerHTML = ''; // Clear current list

    // Filter transactions based on currentFilter
    const filteredTransactions = transactions.filter(transaction => {
        if (currentFilter === 'all') {
            return true;
        } else {
            return transaction.type === currentFilter;
        }
    });

    if (filteredTransactions.length === 0) {
        transactionListDiv.innerHTML = '<p class="text-gray-500 text-center italic">No transactions to display for this filter.</p>';
    } else {
        filteredTransactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            const amountColorClass = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';

            transactionItem.className = `flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm border-l-4 ${transaction.type === 'income' ? 'border-green-500' : 'border-red-500'}`;
            transactionItem.innerHTML = `
                <span class="text-gray-800 font-medium">${transaction.description}</span>
                <div class="flex items-center">
                    <span class="${amountColorClass} mr-3">$${transaction.amount.toFixed(2)}</span>
                    <button data-id="${transaction.id}"
                            class="delete-transaction-btn bg-red-400 hover:bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-full transition duration-300 ease-in-out transform hover:scale-110">
                        &times;
                    </button>
                </div>
            `;
            transactionListDiv.appendChild(transactionItem);
        });
    }

    calculateSummary(); // Always recalculate summary after rendering transactions
    saveTransactionsToCookie(); // Save changes after rendering
}

/**
 * Saves the current transactions array to a cookie.
 */
function saveTransactionsToCookie() {
    try {
        setCookie('budgetTransactions', JSON.stringify(transactions), 365); // Store for 1 year
    } catch (e) {
        console.error("Error saving transactions to cookie:", e);
        showMessageBox("Error saving transactions. Data might be too large for cookies.");
    }
}

/**
 * Loads transactions from the cookie when the page loads.
 */
function loadTransactionsFromCookie() {
    const storedTransactions = getCookie('budgetTransactions');
    if (storedTransactions) {
        try {
            transactions = JSON.parse(storedTransactions);
        } catch (e) {
            console.error("Error parsing stored transactions from cookie:", e);
            transactions = []; // Reset if parsing fails
            showMessageBox("Corrupted transaction data found. Resetting transactions.");
        }
    }
    renderTransactions(); // Render after loading
}

/**
 * Handles adding a new transaction (income or expense).
 */
function addTransaction() {
    const description = transactionDescriptionInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const type = transactionTypeSelect.value; // 'income' or 'expense'

    if (!description) {
        showMessageBox("Please enter a transaction description.");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showMessageBox("Please enter a valid positive amount.");
        return;
    }

    // Create a unique ID for each transaction
    const newTransaction = {
        id: Date.now(), // Simple unique ID based on timestamp
        description,
        amount,
        type
    };

    transactions.push(newTransaction);
    transactionDescriptionInput.value = '';
    transactionAmountInput.value = '';
    transactionTypeSelect.value = 'income'; // Reset to default
    renderTransactions();
}

/**
 * Handles deleting a transaction by its ID.
 * @param {number} id - The unique ID of the transaction to delete.
 */
function deleteTransaction(id) {
    // Filter out the transaction with the matching ID
    transactions = transactions.filter(transaction => transaction.id !== id);
    renderTransactions();
}

/**
 * Sets the current filter and re-renders the transactions.
 * Also updates the active state of filter buttons.
 * @param {string} filterType - 'all', 'income', or 'expense'.
 */
function filterTransactions(filterType) {
    currentFilter = filterType;

    // Update active button styling
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    document.getElementById(`show${filterType.charAt(0).toUpperCase() + filterType.slice(1)}Btn`).classList.add('active-filter');

    renderTransactions();
}

/**
 * Clears all transactions and removes the cookie.
 */
function clearAllTransactions() {
    transactions = [];
    deleteCookie('budgetTransactions'); // Remove the cookie
    renderTransactions();
    showMessageBox("All budget data cleared!");
}

// --- Event Listeners ---

// Add Transaction button click
addTransactionBtn.addEventListener('click', addTransaction);

// Allow adding transaction with Enter key in input fields
transactionDescriptionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTransaction();
    }
});
transactionAmountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTransaction();
    }
});

// Event delegation for delete buttons on the transaction list
transactionListDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-transaction-btn')) {
        const idToDelete = parseInt(e.target.dataset.id);
        deleteTransaction(idToDelete);
    }
});

// Filter buttons click
showAllBtn.addEventListener('click', () => filterTransactions('all'));
showIncomeBtn.addEventListener('click', () => filterTransactions('income'));
showExpensesBtn.addEventListener('click', () => filterTransactions('expense'));

// Clear All button click
clearAllBtn.addEventListener('click', clearAllTransactions);

// Close message box
messageBoxCloseBtn.addEventListener('click', hideMessageBox);

// Load transactions when the page is fully loaded
window.onload = loadTransactionsFromCookie;
