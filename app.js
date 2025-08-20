const transactionForm = document.getElementById('transaction-form');
const tableBody = document.getElementById('transaction-table-body');
const totalProfitEl = document.getElementById('total-profit');

const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');

const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');
let editIndex = null;

let transactions = [];
let currentPage = 1;
const rowsPerPage = 7;

function formatCurrency(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
}

function formatRibuan(input) {
  let numberString = input.value.replace(/\D/g, '');
  input.value = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(str) {
  return Number(str.replace(/\./g, ''));
}

function getCurrentDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function loadTransactions() {
  const savedDate = localStorage.getItem('lastTransactionDate');
  const currentDate = getCurrentDateString();

  if (savedDate !== currentDate) {
    transactions = [];
    localStorage.setItem('lastTransactionDate', currentDate);
    localStorage.removeItem('transactions');
  } else {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      transactions = JSON.parse(saved).map(t => ({ ...t, date: new Date(t.date) }));
    }
  }
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('lastTransactionDate', getCurrentDateString());
}

function renderTable() {
  tableBody.innerHTML = '';
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = transactions.slice(startIndex, endIndex);
  let totalProfit = 0;

  if (transactions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-gray-500">Belum ada data transaksi.</td></tr>';
    totalProfitEl.textContent = formatCurrency(0);
    updatePagination();
    return;
  }

  currentData.forEach((t, i) => {
    const profit = t.sellPrice - t.costPrice;
    totalProfit += profit;
    const date = t.date.toLocaleDateString('id-ID');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 text-sm">${transactions.length - (startIndex + i)}</td>
      <td class="px-6 py-4 text-sm">${date}</td>
      <td class="px-6 py-4 text-sm">${t.productName}</td>
      <td class="px-6 py-4 text-sm">${formatCurrency(t.costPrice)}</td>
      <td class="px-6 py-4 text-sm">${formatCurrency(t.sellPrice)}</td>
      <td class="px-6 py-4 text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(profit)}</td>
      <td class="px-6 py-4 text-sm">${t.customerName}</td>
      <td class="px-6 py-4 text-sm space-x-2">
        <button class="text-red-600 hover:underline" onclick="deleteTransaction(${startIndex + i})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  const totalAllProfit = transactions.reduce((sum, t) => sum + (t.sellPrice - t.costPrice), 0);
  totalProfitEl.textContent = formatCurrency(totalAllProfit);
  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  pageIndicator.textContent = `${currentPage} / ${totalPages || 1}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

nextPageBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTransaction = {
    productName: document.getElementById('product-name').value,
    costPrice: parseRupiah(document.getElementById('cost-price').value),
    sellPrice: parseRupiah(document.getElementById('sell-price').value),
    customerName: document.getElementById('customer-name').value,
    date: new Date(),
  };

  transactions.unshift(newTransaction);
  saveTransactions();
  currentPage = 1;
  renderTable();
  transactionForm.reset();
});

['cost-price', 'sell-price', 'edit-cost-price', 'edit-sell-price'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', () => formatRibuan(input));
  }
});

window.editTransaction = function(index) {
  const t = transactions[index];
  editIndex = index;

  document.getElementById('edit-product-name').value = t.productName;
  document.getElementById('edit-cost-price').value = t.costPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('edit-sell-price').value = t.sellPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  document.getElementById('edit-customer-name').value = t.customerName;

  document.getElementById('edit-modal').classList.remove('hidden');
};

editForm.addEventListener('submit', (e) => {
  e.preventDefault();

  transactions[editIndex] = {
    ...transactions[editIndex],
    productName: document.getElementById('edit-product-name').value,
    costPrice: parseRupiah(document.getElementById('edit-cost-price').value),
    sellPrice: parseRupiah(document.getElementById('edit-sell-price').value),
    customerName: document.getElementById('edit-customer-name').value,
  };

  saveTransactions();
  renderTable();
  document.getElementById('edit-modal').classList.add('hidden');
});

cancelEditBtn.addEventListener('click', () => {
  document.getElementById('edit-modal').classList.add('hidden');
});

window.deleteTransaction = function(index) {
  if (confirm('Yakin ingin menghapus transaksi ini?')) {
    transactions.splice(index, 1);
    saveTransactions();

    const totalPages = Math.ceil(transactions.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    renderTable();
  }
};

loadTransactions();
renderTable();
