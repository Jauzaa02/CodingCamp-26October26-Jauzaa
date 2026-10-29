const STORAGE_KEY = 'expense_visualizer_transactions';
const LIMIT_KEY = 'expense_visualizer_limit';
const THEME_KEY = 'expense_visualizer_theme';
const CATEGORIES_KEY = 'expense_visualizer_categories';

// Helper aman untuk LocalStorage (Mencegah error di iframe preview)
const safeStorage = {
  get(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage dibatasi di preview ini, buka di Chrome/Edge untuk penyimpanan permanen.');
    }
  }
};

const defaultCategories = ['Food', 'Transport', 'Fun'];
let categories = safeStorage.get(CATEGORIES_KEY, defaultCategories);
let transactions = safeStorage.get(STORAGE_KEY, []);
let spendingLimit = parseFloat(safeStorage.get(LIMIT_KEY, 0)) || 0;
let expenseChart = null;

const chartColors = [
  '#2ecc71', '#3498db', '#e67e22', '#9b59b6',
  '#f1c40f', '#1abc9c', '#e74c3c', '#34495e'
];

// Ambil elemen DOM dengan aman
const form = document.getElementById('transaction-form');
const nameInput = document.getElementById('item-name');
const amountInput = document.getElementById('item-amount');
const categoryInput = document.getElementById('item-category');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const formError = document.getElementById('form-error');
const transactionListEl = document.getElementById('transaction-list');
const totalBalanceEl = document.getElementById('total-balance');
const monthlySummaryEl = document.getElementById('monthly-summary');
const totalItemsEl = document.getElementById('total-items');
const sortSelect = document.getElementById('sort-select');
const monthFilter = document.getElementById('month-filter');
const limitInput = document.getElementById('spending-limit');
const limitWarning = document.getElementById('limit-warning');
const themeToggleBtn = document.getElementById('theme-toggle');

// Jalankan aplikasi
function startApp() {
  initTheme();
  renderCategories();
  if (limitInput && spendingLimit > 0) {
    limitInput.value = spendingLimit;
  }
  initChart();
  populateMonthFilter();
  updateUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// 1. Dark / Light Mode Toggle
function initTheme() {
  const savedTheme = safeStorage.get(THEME_KEY, 'light');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) themeToggleBtn.textContent = '☀️ Light Mode';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    safeStorage.set(THEME_KEY, isDark ? 'dark' : 'light');
  });
}

// 2. Kategori Custom
function renderCategories() {
  if (!categoryInput) return;
  categoryInput.innerHTML = '';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryInput.appendChild(opt);
  });
}

if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', () => {
    const newCat = newCategoryInput.value.trim();
    if (!newCat) return;

    const exists = categories.some((c) => c.toLowerCase() === newCat.toLowerCase());
    if (!exists) {
      categories.push(newCat);
      safeStorage.set(CATEGORIES_KEY, categories);
      renderCategories();
      categoryInput.value = newCat;
      updateChart();
    }
    newCategoryInput.value = '';
  });
}

// 3. Tambah & Simpan Transaksi
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (!name || isNaN(amount) || amount <= 0 || !category) {
      if (formError) formError.classList.remove('hidden');
      return;
    }
    if (formError) formError.classList.add('hidden');

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newTransaction = {
      id: Date.now(),
      name,
      amount,
      category,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      monthKey
    };

    transactions.push(newTransaction);
    safeStorage.set(STORAGE_KEY, transactions);
    populateMonthFilter();
    updateUI();
    form.reset();
    renderCategories();
  });
}

// 4. Hapus Transaksi
window.deleteTransaction = function(id) {
  transactions = transactions.filter((item) => item.id !== id);
  safeStorage.set(STORAGE_KEY, transactions);
  populateMonthFilter();
  updateUI();
};

// 5. Filter Bulanan
function populateMonthFilter() {
  if (!monthFilter) return;
  const currentSelected = monthFilter.value;
  const uniqueMonths = [...new Set(transactions.map((t) => t.monthKey).filter(Boolean))].sort().reverse();

  monthFilter.innerHTML = '<option value="all">All Months</option>';
  uniqueMonths.forEach((mKey) => {
    const [year, month] = mKey.split('-');
    const dateObj = new Date(year, parseInt(month, 10) - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = mKey;
    opt.textContent = label;
    monthFilter.appendChild(opt);
  });

  if (uniqueMonths.includes(currentSelected)) {
    monthFilter.value = currentSelected;
  }
}

function getFilteredTransactions() {
  if (!monthFilter || monthFilter.value === 'all') return transactions;
  return transactions.filter((t) => t.monthKey === monthFilter.value);
}

// 6. Update UI
function updateUI() {
  renderTotalBalance();
  renderTransactionList();
  updateChart();
}

function renderTotalBalance() {
  if (!totalBalanceEl) return;
  const filtered = getFilteredTransactions();
  const total = filtered.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  totalBalanceEl.textContent = `$${total.toFixed(2)}`;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTotal = transactions
    .filter((t) => !t.monthKey || t.monthKey === currentMonthKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (monthlySummaryEl) monthlySummaryEl.textContent = `This Month: $${thisMonthTotal.toFixed(2)}`;
  if (totalItemsEl) totalItemsEl.textContent = `${filtered.length} Transaction${filtered.length !== 1 ? 's' : ''}`;

  if (limitWarning) {
    if (spendingLimit > 0 && total > spendingLimit) {
      limitWarning.classList.remove('hidden');
      totalBalanceEl.style.color = '#e74c3c';
    } else {
      limitWarning.classList.add('hidden');
      totalBalanceEl.style.color = '';
    }
  }
}

function renderTransactionList() {
  if (!transactionListEl) return;
  transactionListEl.innerHTML = '';
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    transactionListEl.innerHTML = '<p class="empty-state">No transactions added yet.</p>';
    return;
  }

  const sortType = sortSelect ? sortSelect.value : 'newest';
  const sorted = [...filtered];

  if (sortType === 'newest') {
    sorted.sort((a, b) => b.id - a.id);
  } else if (sortType === 'amount-desc') {
    sorted.sort((a, b) => b.amount - a.amount);
  } else if (sortType === 'amount-asc') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortType === 'category') {
    sorted.sort((a, b) => a.category.localeCompare(b.category));
  }

  sorted.forEach((item) => {
    const div = document.createElement('div');
    const isOverLimit = spendingLimit > 0 && item.amount > spendingLimit;
    div.className = `transaction-item ${isOverLimit ? 'over-limit-item' : ''}`;

    div.innerHTML = `
      <div class="item-details">
        <h4>${escapeHTML(item.name)}</h4>
        <p class="item-amount">$${Number(item.amount).toFixed(2)}</p>
        <div class="item-meta">
          <span class="item-category">${escapeHTML(item.category)}</span>
          ${item.date ? `<span class="item-date">${escapeHTML(item.date)}</span>` : ''}
        </div>
      </div>
      <button class="btn-delete" type="button" onclick="deleteTransaction(${item.id})">Delete</button>
    `;

    transactionListEl.appendChild(div);
  });
}

// 7. Pie Chart (Aman walau tanpa internet / Chart.js belum siap)
function initChart() {
  const canvas = document.getElementById('expense-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  expenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: categories.map(() => 0),
        backgroundColor: chartColors.slice(0, categories.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updateChart() {
  if (!expenseChart) return;

  const filtered = getFilteredTransactions();
  const totals = {};
  categories.forEach((cat) => { totals[cat] = 0; });

  filtered.forEach((item) => {
    if (totals[item.category] === undefined) {
      totals[item.category] = 0;
    }
    totals[item.category] += Number(item.amount || 0);
  });

  const activeLabels = Object.keys(totals);
  const activeData = activeLabels.map((label) => totals[label]);

  expenseChart.data.labels = activeLabels;
  expenseChart.data.datasets[0].data = activeData;
  expenseChart.data.datasets[0].backgroundColor = activeLabels.map(
    (_, idx) => chartColors[idx % chartColors.length]
  );
  expenseChart.update();
}

if (sortSelect) sortSelect.addEventListener('change', renderTransactionList);
if (monthFilter) monthFilter.addEventListener('change', updateUI);

if (limitInput) {
  limitInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    spendingLimit = isNaN(val) || val < 0 ? 0 : val;
    safeStorage.set(LIMIT_KEY, spendingLimit);
    updateUI();
  });
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.textContent = String(str || '');
  return p.innerHTML;
}