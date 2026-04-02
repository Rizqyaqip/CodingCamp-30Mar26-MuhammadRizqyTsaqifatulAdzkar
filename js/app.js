class StorageService {
  constructor() {
    this.STORAGE_KEYS = {
      TRANSACTIONS: 'expense_tracker_transactions',
      CATEGORIES: 'expense_tracker_categories',
      THEME: 'expense_tracker_theme'
    };
  }

  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  saveTransactions(transactions) {
    if (!this.isStorageAvailable()) return false;
    try {
      localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (e) {
      console.error(e.name === 'QuotaExceededError' ? 'Storage quota exceeded' : 'Failed to save transactions:', e);
      return false;
    }
  }

  loadTransactions() {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      const transactions = JSON.parse(data);
      if (!Array.isArray(transactions)) return [];
      return transactions;
    } catch (e) {
      localStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS);
      return [];
    }
  }

  saveCategories(categories) {
    if (!this.isStorageAvailable()) return false;
    try {
      localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (e) {
      console.error(e.name === 'QuotaExceededError' ? 'Storage quota exceeded' : 'Failed to save categories:', e);
      return false;
    }
  }

  loadCategories() {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      if (!data) return [];
      const categories = JSON.parse(data);
      if (!Array.isArray(categories)) return [];
      return categories;
    } catch (e) {
      localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
      return [];
    }
  }

  saveTheme(theme) {
    if (!this.isStorageAvailable()) return false;
    try {
      localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
      return true;
    } catch (e) {
      return false;
    }
  }

  loadTheme() {
    if (!this.isStorageAvailable()) return 'light';
    try {
      const theme = localStorage.getItem(this.STORAGE_KEYS.THEME);
      if (!theme || (theme !== 'light' && theme !== 'dark')) return 'light';
      return theme;
    } catch (e) {
      return 'light';
    }
  }
}


class TransactionManager {
  constructor() {
    this.transactions = [];
  }

  addTransaction(item, amount, category, validCategories = []) {
    if (!item || typeof item !== 'string' || item.trim() === '')
      return { error: 'Item name is required' };

    if (item.length > 100)
      return { error: 'Item name must be 100 characters or less' };

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0)
      return { error: 'Amount must be a positive number' };

    if ((amount.toString().split('.')[1] || '').length > 0)
      return { error: 'Amount must be a whole number (no decimals)' };

    if (!category || typeof category !== 'string' || category.trim() === '')
      return { error: 'Please select a category' };

    const trimmedCategory = category.trim();

    if (validCategories.length > 0 && !validCategories.includes(trimmedCategory))
      return { error: 'Invalid category' };

    const timestamp = Date.now();
    const transaction = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      item: item.trim(),
      amount: Math.round(amount),
      category: trimmedCategory,
      timestamp
    };

    this.transactions.push(transaction);
    return transaction;
  }

  deleteTransaction(id) {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    return this.transactions.length < initialLength;
  }

  getTransactions() {
    return [...this.transactions];
  }

  getTotalBalance() {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  getCategoryTotals() {
    return this.transactions.reduce((totals, t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      return totals;
    }, {});
  }

  sortTransactions(sortBy = 'default', order = 'asc') {
    const dir = order === 'asc' ? 1 : -1;
    if (sortBy === 'amount') {
      this.transactions.sort((a, b) => (a.amount - b.amount) * dir);
    } else if (sortBy === 'category') {
      this.transactions.sort((a, b) => a.category.localeCompare(b.category) * dir);
    } else {
      this.transactions.sort((a, b) => (a.timestamp - b.timestamp) * dir);
    }
  }

  loadTransactions(transactions) {
    if (Array.isArray(transactions)) this.transactions = [...transactions];
  }
}


class CategoryManager {
  constructor() {
    this.categories = [
      { name: 'Food',      color: '#FF6384', isCustom: false },
      { name: 'Transport', color: '#36A2EB', isCustom: false },
      { name: 'Fun',       color: '#FFCE56', isCustom: false }
    ];

    this.colorPalette = [
      '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF',
      '#4DC9F6', '#F67019', '#F53794', '#537BC4',
      '#ACC236', '#166A8F', '#00A950', '#58595B', '#8549BA'
    ];

    this.nextColorIndex = 0;
  }

  getCategories() {
    return this.categories.map(c => c.name);
  }

  addCategory(name) {
    if (!name || typeof name !== 'string' || name.trim() === '')
      return { error: 'Category name is required' };

    const trimmed = name.trim();

    if (trimmed.length > 50)
      return { error: 'Category name must be 50 characters or less' };

    if (this.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase()))
      return { error: 'Category already exists' };

    const category = { name: trimmed, color: this._nextColor(), isCustom: true };
    this.categories.push(category);
    return category;
  }

  getCategoryColor(name) {
    const cat = this.categories.find(c => c.name === name);
    return cat ? cat.color : '#CCCCCC';
  }

  getAllCategories() {
    return [...this.categories];
  }

  loadCategories(categories) {
    if (Array.isArray(categories) && categories.length > 0) {
      this.categories = [...categories];
      const customCount = this.categories.filter(c => c.isCustom).length;
      this.nextColorIndex = customCount % this.colorPalette.length;
    }
  }

  _nextColor() {
    const used = new Set(this.categories.map(c => c.color.toUpperCase()));
    for (let i = 0; i < this.colorPalette.length; i++) {
      const idx = (this.nextColorIndex + i) % this.colorPalette.length;
      const color = this.colorPalette[idx];
      if (!used.has(color.toUpperCase())) {
        this.nextColorIndex = (idx + 1) % this.colorPalette.length;
        return color;
      }
    }
    let random;
    do {
      random = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    } while (used.has(random));
    return random;
  }
}


class UIRenderer {
  constructor() {
    this.elements = {
      transactionList: null,
      balanceDisplay: null,
      categoryDropdown: null,
      errorMessage: null,
      itemNameInput: null,
      amountInput: null,
      categoryInput: null,
      body: null,
      chartCanvas: null,
      chartEmptyState: null
    };
  }

  initializeElements() {
    this.elements.transactionList  = document.getElementById('transaction-list');
    this.elements.balanceDisplay   = document.getElementById('balance-display');
    this.elements.categoryDropdown = document.getElementById('category');
    this.elements.errorMessage     = document.getElementById('error-message');
    this.elements.itemNameInput    = document.getElementById('item-name');
    this.elements.amountInput      = document.getElementById('amount');
    this.elements.categoryInput    = document.getElementById('category');
    this.elements.body             = document.body;
    this.elements.chartCanvas      = document.getElementById('pie-chart');
    this.elements.chartEmptyState  = document.getElementById('chart-empty-state');
  }

  renderTransactionList(transactions) {
    const list = this.elements.transactionList;
    if (!list) return;

    list.innerHTML = '';

    if (!transactions || transactions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No transactions yet';
      list.appendChild(empty);
      return;
    }

    transactions.forEach(t => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      item.dataset.id = t.id;

      const name   = document.createElement('span');
      name.className = 'transaction-item-name';
      name.textContent = t.item;

      const amount = document.createElement('span');
      amount.className = 'transaction-amount';
      amount.textContent = `Rp ${t.amount.toLocaleString('id-ID')}`;

      const cat = document.createElement('span');
      cat.className = 'transaction-category';
      cat.textContent = t.category;

      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', `Delete ${t.item}`);
      del.dataset.id = t.id;

      item.append(name, amount, cat, del);
      list.appendChild(item);
    });
  }

  renderBalance(balance) {
    if (this.elements.balanceDisplay)
      this.elements.balanceDisplay.textContent = `Rp ${balance.toLocaleString('id-ID')}`;
  }

  renderCategoryDropdown(categories) {
    const dropdown = this.elements.categoryDropdown;
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select category</option>';
    (categories || []).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      dropdown.appendChild(opt);
    });
  }

  showValidationError(message) {
    const el = this.elements.errorMessage;
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => this.clearValidationError(), 5000);
  }

  clearValidationError() {
    const el = this.elements.errorMessage;
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  clearForm() {
    if (this.elements.itemNameInput) this.elements.itemNameInput.value = '';
    if (this.elements.amountInput)   this.elements.amountInput.value = '';
    if (this.elements.categoryInput) this.elements.categoryInput.value = '';
  }

  applyTheme(theme) {
    const body = this.elements.body;
    if (!body) return;
    body.classList.remove('dark-theme', 'light-theme');
    body.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  renderChartEmptyState(isEmpty) {
    const { chartCanvas, chartEmptyState } = this.elements;
    if (!chartCanvas || !chartEmptyState) return;
    chartEmptyState.style.display = isEmpty ? 'block' : 'none';
    chartCanvas.style.display     = isEmpty ? 'none'  : 'block';
  }
}


class ChartRenderer {
  constructor(canvasElement, legendElement) {
    this.canvas = canvasElement;
    this.legendElement = legendElement;
    this.ctx = null;

    if (!this.canvas || !this.canvas.getContext) return;
    this.ctx = this.canvas.getContext('2d');
  }

  render(categoryTotals, getCategoryColor) {
    if (!this.ctx) return;
    this.clear();

    if (!categoryTotals || Object.keys(categoryTotals).length === 0) {
      this.clearLegend();
      return;
    }

    const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    if (total === 0) { this.clearLegend(); return; }

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const r  = Math.min(cx, cy) - 10;
    let angle = -Math.PI / 2;

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      const slice = (amount / total) * 2 * Math.PI;
      const color = getCategoryColor ? getCategoryColor(cat) : '#CCCCCC';

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.arc(cx, cy, r, angle, angle + slice);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      angle += slice;
    });

    this.renderLegend(categoryTotals, total, getCategoryColor);
  }

  renderLegend(categoryTotals, total, getCategoryColor) {
    if (!this.legendElement) return;
    this.legendElement.innerHTML = '';

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      const pct   = ((amount / total) * 100).toFixed(1);
      const color = getCategoryColor ? getCategoryColor(cat) : '#CCCCCC';

      const item = document.createElement('div');
      item.className = 'legend-item';

      const swatch = document.createElement('span');
      swatch.className = 'legend-color';
      swatch.style.backgroundColor = color;

      const label = document.createElement('span');
      label.className = 'legend-category';
      label.textContent = cat;

      const value = document.createElement('span');
      value.className = 'legend-amount';
      value.textContent = `Rp ${amount.toLocaleString('id-ID')} (${pct}%)`;

      item.append(swatch, label, value);
      this.legendElement.appendChild(item);
    });
  }

  clearLegend() {
    if (this.legendElement) this.legendElement.innerHTML = '';
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}


class Application {
  constructor() {
    this.storageService     = new StorageService();
    this.transactionManager = new TransactionManager();
    this.categoryManager    = new CategoryManager();
    this.uiRenderer         = new UIRenderer();
    this.chartRenderer      = null;
  }

  initialize() {
    this.uiRenderer.initializeElements();
    this.chartRenderer = new ChartRenderer(
      document.getElementById('pie-chart'),
      document.getElementById('chart-legend')
    );
    this.loadData();
    this.renderAll();
    this.setupEventHandlers();
  }

  loadData() {
    this.transactionManager.loadTransactions(this.storageService.loadTransactions());

    const savedCategories = this.storageService.loadCategories();
    if (savedCategories.length > 0) this.categoryManager.loadCategories(savedCategories);

    this.uiRenderer.applyTheme(this.storageService.loadTheme());
  }

  setupEventHandlers() {
    document.getElementById('transaction-form')
      ?.addEventListener('submit', e => this.handleFormSubmit(e));

    document.getElementById('transaction-list')
      ?.addEventListener('click', e => this.handleDeleteClick(e));

    document.getElementById('theme-toggle')
      ?.addEventListener('click', () => this.handleThemeToggle());

    document.getElementById('sort-by')
      ?.addEventListener('change', () => this.handleSortChange());

    document.getElementById('sort-order')
      ?.addEventListener('change', () => this.handleSortChange());

    document.getElementById('category-form')
      ?.addEventListener('submit', e => this.handleCategoryFormSubmit(e));
  }

  handleFormSubmit(e) {
    e.preventDefault();
    this.uiRenderer.clearValidationError();

    const item     = document.getElementById('item-name').value;
    const amount   = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const result   = this.transactionManager.addTransaction(
      item, amount, category, this.categoryManager.getCategories()
    );

    if (result.error) { this.uiRenderer.showValidationError(result.error); return; }

    this.storageService.saveTransactions(this.transactionManager.getTransactions());
    this.uiRenderer.clearForm();
    this.renderAll();
  }

  handleDeleteClick(e) {
    if (!e.target.classList.contains('btn-delete')) return;

    const id = e.target.dataset.id;
    if (!id) return;

    if (this.transactionManager.deleteTransaction(id)) {
      this.storageService.saveTransactions(this.transactionManager.getTransactions());
      this.renderAll();
    }
  }

  handleThemeToggle() {
    const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    this.uiRenderer.applyTheme(newTheme);
    this.storageService.saveTheme(newTheme);
  }

  handleSortChange() {
    const sortBy    = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;
    this.transactionManager.sortTransactions(sortBy, sortOrder);
    this.uiRenderer.renderTransactionList(this.transactionManager.getTransactions());
  }

  handleCategoryFormSubmit(e) {
    e.preventDefault();
    this.clearCategoryError();

    const input  = document.getElementById('category-name');
    const result = this.categoryManager.addCategory(input?.value ?? '');

    if (result.error) { this.showCategoryError(result.error); return; }

    this.storageService.saveCategories(this.categoryManager.getAllCategories());
    this.uiRenderer.renderCategoryDropdown(this.categoryManager.getCategories());
    if (input) input.value = '';
  }

  showCategoryError(message) {
    const el = document.getElementById('category-error-message');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => this.clearCategoryError(), 5000);
  }

  clearCategoryError() {
    const el = document.getElementById('category-error-message');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  renderAll() {
    const transactions   = this.transactionManager.getTransactions();
    const balance        = this.transactionManager.getTotalBalance();
    const categoryTotals = this.transactionManager.getCategoryTotals();
    const categories     = this.categoryManager.getCategories();

    this.uiRenderer.renderTransactionList(transactions);
    this.uiRenderer.renderBalance(balance);
    this.uiRenderer.renderCategoryDropdown(categories);

    if (transactions.length === 0) {
      this.uiRenderer.renderChartEmptyState(true);
      this.chartRenderer.clear();
    } else {
      this.uiRenderer.renderChartEmptyState(false);
      this.chartRenderer.render(categoryTotals, cat => this.categoryManager.getCategoryColor(cat));
    }
  }
}


document.addEventListener('DOMContentLoaded', () => new Application().initialize());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageService, TransactionManager, CategoryManager, UIRenderer, ChartRenderer, Application };
}
