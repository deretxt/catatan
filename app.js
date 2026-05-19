const transactionForm = document.getElementById('transaction-form');
const tableBody = document.getElementById('transaction-table-body');
const totalProfitEl = document.getElementById('total-profit');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardLimit = document.getElementById('leaderboardLimit');
const mobileList = document.getElementById('transaction-mobile-list');

const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');

const resetBtn = document.getElementById('reset-transactions');
const resetLeaderboardBtn = document.getElementById('reset-leaderboard');

let dailyTransactions = [];
let allTransactions = [];

let currentPage = 1;
const rowsPerPage = 7;

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
  dailyTransactions =
    JSON.parse(localStorage.getItem('dailyTransactions')) || [];

  allTransactions =
    JSON.parse(localStorage.getItem('allTransactions')) || [];

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
  localStorage.setItem(
    'dailyTransactions',
    JSON.stringify(dailyTransactions)
  );
}

function saveAll() {
  localStorage.setItem(
    'allTransactions',
    JSON.stringify(allTransactions)
  );
}

/* ================= LEADERBOARD ================= */

function renderLeaderboard() {
  leaderboardBody.innerHTML = '';

  const limit = parseInt(leaderboardLimit.value);

  if (allTransactions.length === 0) {
    leaderboardBody.innerHTML =
      `<tr>
        <td colspan="3" class="text-center py-3">
          Belum ada data
        </td>
      </tr>`;

    return;
  }

  const counts = {};

  allTransactions.forEach(t => {
    if (!counts[t.productName]) {
      counts[t.productName] = 0;
    }

    counts[t.productName] += 1;
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  sorted.forEach((prod, index) => {

    let color = '';

    if (index === 0) {
      color = 'text-yellow-400 font-bold';
    }

    if (index === 1) {
      color = 'text-gray-300 font-bold';
    }

    if (index === 2) {
      color = 'text-orange-400 font-bold';
    }

    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="py-2 ${color}">
        ${index + 1}
      </td>

      <td>${prod[0]}</td>

      <td>${prod[1]}x</td>
    `;

    leaderboardBody.appendChild(row);
  });
}

/* ================= RENDER TABLE ================= */

function renderTable() {

  tableBody.innerHTML = '';
  mobileList.innerHTML = '';

  if (dailyTransactions.length === 0) {

    tableBody.innerHTML =
      `<tr>
        <td colspan="8" class="text-center py-4">
          Belum ada data transaksi.
        </td>
      </tr>`;

    mobileList.innerHTML = `
      <div class="bg-gray-700 rounded-2xl p-6 text-center text-gray-300">
        Belum ada transaksi.
      </div>
    `;

    totalProfitEl.textContent = formatCurrency(0);

    renderLeaderboard();

    return;
  }

  const start = (currentPage - 1) * rowsPerPage;

  const currentData =
    dailyTransactions.slice(start, start + rowsPerPage);

  currentData.forEach((t, i) => {

    const profit = t.sellPrice - t.costPrice;

    /* ================= DESKTOP TABLE ================= */

    const row = document.createElement('tr');

    row.className = 'border-b border-gray-700';

    row.innerHTML = `
      <td class="px-4 py-3">
        ${dailyTransactions.length - (start + i)}
      </td>

      <td class="px-4 py-3">
        ${new Date(t.date).toLocaleDateString('id-ID')}
      </td>

      <td class="px-4 py-3 font-medium">
        ${t.productName}
      </td>

      <td class="px-4 py-3">
        ${formatCurrency(t.costPrice)}
      </td>

      <td class="px-4 py-3">
        ${formatCurrency(t.sellPrice)}
      </td>

      <td class="px-4 py-3 ${
        profit >= 0 ? 'text-green-400' : 'text-red-400'
      }">
        ${formatCurrency(profit)}
      </td>

      <td class="px-4 py-3">
        ${t.customerName}
      </td>

      <td class="px-4 py-3">
        <button
          onclick="deleteTransaction(${start + i})"
          class="text-red-400 hover:text-red-300 transition"
        >
          Hapus
        </button>
      </td>
    `;

    tableBody.appendChild(row);

    /* ================= MOBILE CARD ================= */

    const card = document.createElement('div');

    card.className = `
      bg-gray-700/70
      rounded-2xl
      p-4
      border
      border-gray-600
      shadow-lg
      backdrop-blur-sm
    `;

    card.innerHTML = `

      <div class="flex items-start justify-between gap-3 mb-4">

        <div>
          <h3 class="font-semibold text-base text-white leading-tight break-words">
            ${t.productName}
          </h3>

          <p class="text-xs text-gray-400 mt-1">
            ${new Date(t.date).toLocaleDateString('id-ID')}
          </p>
        </div>

        <div class="text-right">
          <p class="text-xs text-gray-400">
            Untung
          </p>

          <p class="font-bold ${
            profit >= 0 ? 'text-green-400' : 'text-red-400'
          }">
            ${formatCurrency(profit)}
          </p>
        </div>

      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">

        <div class="bg-gray-800 rounded-xl p-3">
          <p class="text-gray-400 text-xs mb-1">
            Modal
          </p>

          <p class="font-medium break-words">
            ${formatCurrency(t.costPrice)}
          </p>
        </div>

        <div class="bg-gray-800 rounded-xl p-3">
          <p class="text-gray-400 text-xs mb-1">
            Jual
          </p>

          <p class="font-medium break-words">
            ${formatCurrency(t.sellPrice)}
          </p>
        </div>

      </div>

      <div class="mt-4 flex items-center justify-between gap-3">

        <div class="flex-1">
          <p class="text-xs text-gray-400">
            Customer
          </p>

          <p class="text-sm font-medium text-white break-words">
            ${t.customerName}
          </p>
        </div>

        <button
          onclick="deleteTransaction(${start + i})"
          class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          Hapus
        </button>

      </div>
    `;

    mobileList.appendChild(card);
  });

  /* ================= TOTAL PROFIT ================= */

  const totalProfit = dailyTransactions.reduce(
    (sum, t) => sum + (t.sellPrice - t.costPrice),
    0
  );

  totalProfitEl.textContent = formatCurrency(totalProfit);

  /* ================= PAGINATION ================= */

  const totalPages =
    Math.ceil(dailyTransactions.length / rowsPerPage) || 1;

  pageIndicator.textContent =
    `${currentPage} / ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  renderLeaderboard();
}

/* ================= TAMBAH TRANSAKSI ================= */

transactionForm.addEventListener('submit', (e) => {

  e.preventDefault();

  const newTransaction = {
    productName:
      document.getElementById('product-name').value,

    costPrice:
      parseRupiah(
        document.getElementById('cost-price').value
      ),

    sellPrice:
      parseRupiah(
        document.getElementById('sell-price').value
      ),

    customerName:
      document.getElementById('customer-name').value,

    date: new Date(),
  };

  dailyTransactions.unshift(newTransaction);
  allTransactions.unshift(newTransaction);

  saveDaily();
  saveAll();

  currentPage = 1;

  renderTable();

  transactionForm.reset();
});

/* ================= HAPUS ================= */

window.deleteTransaction = function(index) {

  if (confirm('Hapus transaksi ini?')) {

    dailyTransactions.splice(index, 1);

    saveDaily();

    renderTable();
  }
};

/* ================= RESET ================= */

resetBtn.addEventListener('click', () => {

  if (confirm('Reset transaksi harian?')) {

    dailyTransactions = [];

    localStorage.removeItem('dailyTransactions');

    currentPage = 1;

    renderTable();
  }
});

resetLeaderboardBtn.addEventListener('click', () => {

  if (confirm('Reset leaderboard?')) {

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

  const totalPages =
    Math.ceil(dailyTransactions.length / rowsPerPage);

  if (currentPage < totalPages) {

    currentPage++;

    renderTable();
  }
});

/* ================= FORMAT INPUT ================= */

['cost-price', 'sell-price'].forEach(id => {

  document
    .getElementById(id)
    .addEventListener('input', function() {

      formatRibuan(this);
    });
});

/* ================= LEADERBOARD CHANGE ================= */

leaderboardLimit.addEventListener(
  'change',
  renderLeaderboard
);

/* ================= INIT ================= */

loadTransactions();
renderTable();
