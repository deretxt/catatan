const transactionForm = document.getElementById('transaction-form');
const tableBody = document.getElementById('transaction-table-body');
const totalProfitEl = document.getElementById('total-profit');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardLimit = document.getElementById('leaderboardLimit');

const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');
const resetBtn = document.getElementById('reset-transactions');
const resetLeaderboardBtn = document.getElementById('reset-leaderboard');

let dailyTransactions = [];
let allTransactions = [];

let currentPage = 1;
const rowsPerPage = 15;

/* ================= FORMAT ================= */

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
  return Number(str.replace(/\./g, '')) || 0;
}

/* ================= LOAD & SAVE ================= */

function loadTransactions() {
  dailyTransactions = JSON.parse(localStorage.getItem('dailyTransactions')) || [];
  allTransactions = JSON.parse(localStorage.getItem('allTransactions')) || [];

  dailyTransactions = dailyTransactions.map(t => ({
    ...t,
    date: new Date(t.date)
  }));

  allTransactions = allTransactions.map(t => ({
    ...t,
    date: new Date(t.date)
  }));
}

function saveDaily() {
  localStorage.setItem('dailyTransactions', JSON.stringify(dailyTransactions));
}

function saveAll() {
  localStorage.setItem('allTransactions', JSON.stringify(allTransactions));
}

/* ================= LEADERBOARD (AKUMULASI SELAMANYA) ================= */

function renderLeaderboard() {
  leaderboardBody.innerHTML = '';
  const limit = parseInt(leaderboardLimit.value);

  if (allTransactions.length === 0) {
    leaderboardBody.innerHTML =
      `<tr><td colspan="3" class="text-center py-2">Belum ada data</td></tr>`;
    return;
  }

  const counts = {};

  allTransactions.forEach(t => {
    if (!counts[t.customerName]) counts[t.customerName] = 0;
    counts[t.customerName] += 1;
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  sorted.forEach((cust, index) => {
    let color = '';
    if (index === 0) color = 'text-yellow-400 font-bold';
    if (index === 1) color = 'text-gray-300 font-bold';
    if (index === 2) color = 'text-orange-400 font-bold';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="py-1 ${color}">${index + 1}</td>
      <td>${cust[0]}</td>
      <td>${cust[1]} transaksi</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

/* ================= RENDER TABLE (HARIAN) ================= */

function renderTable() {
  tableBody.innerHTML = '';

  if (dailyTransactions.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="8" class="text-center py-4">Belum ada data transaksi.</td></tr>`;
    totalProfitEl.textContent = formatCurrency(0);
    renderLeaderboard();
    return;
  }

  const start = (currentPage - 1) * rowsPerPage;
  const currentData = dailyTransactions.slice(start, start + rowsPerPage);

  currentData.forEach((t, i) => {
    const profit = t.sellPrice - t.costPrice;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-2">${dailyTransactions.length - (start + i)}</td>
      <td class="px-4 py-2">${new Date(t.date).toLocaleDateString('id-ID')}</td>
      <td class="px-4 py-2">${t.productName}</td>
      <td class="px-4 py-2">${formatCurrency(t.costPrice)}</td>
      <td class="px-4 py-2">${formatCurrency(t.sellPrice)}</td>
      <td class="px-4 py-2 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}">
        ${formatCurrency(profit)}
      </td>
      <td class="px-4 py-2">${t.customerName}</td>
      <td class="px-4 py-2">
        <button onclick="deleteTransaction(${start + i})" class="text-red-500 hover:underline">
          Hapus
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  const totalProfit = dailyTransactions.reduce(
    (sum, t) => sum + (t.sellPrice - t.costPrice),
    0
  );

  totalProfitEl.textContent = formatCurrency(totalProfit);

  const totalPages = Math.ceil(dailyTransactions.length / rowsPerPage) || 1;
  pageIndicator.textContent = `${currentPage} / ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  renderLeaderboard();
}

/* ================= TAMBAH TRANSAKSI ================= */

transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTransaction = {
    productName: document.getElementById('product-name').value,
    costPrice: parseRupiah(document.getElementById('cost-price').value),
    sellPrice: parseRupiah(document.getElementById('sell-price').value),
    customerName: document.getElementById('customer-name').value,
    date: new Date(),
  };

  // Masuk harian
  dailyTransactions.unshift(newTransaction);

  // Masuk leaderboard (akumulasi selamanya)
  allTransactions.unshift(newTransaction);

  saveDaily();
  saveAll();

  currentPage = 1;
  renderTable();
  transactionForm.reset();
});

/* ================= HAPUS (HANYA HARIAN) ================= */

window.deleteTransaction = function(index) {
  if (confirm('Hapus transaksi ini?')) {
    dailyTransactions.splice(index, 1);
    saveDaily();
    renderTable();
  }
};

/* ================= RESET HARIAN ================= */

resetBtn.addEventListener('click', () => {
  if (confirm('Reset transaksi & keuntungan hari ini?')) {
    dailyTransactions = [];
    localStorage.removeItem('dailyTransactions');
    currentPage = 1;
    renderTable();
  }
});

/* ================= RESET LEADERBOARD ================= */

resetLeaderboardBtn.addEventListener('click', () => {
  if (confirm('Reset leaderboard? Semua ranking akan dihapus.')) {
    allTransactions = [];
    localStorage.removeItem('allTransactions');
    renderLeaderboard();
  }
});

/* ================= PAGINATION ================= */

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

nextPageBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(dailyTransactions.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

/* ================= FORMAT INPUT ================= */

['cost-price', 'sell-price'].forEach(id => {
  document.getElementById(id).addEventListener('input', function() {
    formatRibuan(this);
  });
});

leaderboardLimit.addEventListener('change', renderLeaderboard);

/* ================= INIT ================= */

loadTransactions();
renderTable();
