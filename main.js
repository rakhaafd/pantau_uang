let transactions = [];
let savings = [];

function updateBalance() {
  const balance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
  const formattedBalance = `Rp ${balance.toLocaleString('id-ID')}`;
  document.getElementById('current-balance').textContent = formattedBalance;
  document.getElementById('tabungan-saldo').value = formattedBalance;
}

function renderTransactions() {
  const container = document.getElementById('transaction-list');
  container.innerHTML = '';
  transactions.forEach(tx => {
    const div = document.createElement('div');
    div.className = `p-4 rounded-lg text-white ${tx.type === 'income' ? 'bg-teal-500' : 'bg-red-500'} fade-in`;
    div.innerHTML = `<strong>${tx.title}</strong><br>Rp ${tx.amount.toLocaleString('id-ID')}`;
    container.appendChild(div);
  });
}

function renderSavings() {
  const container = document.getElementById('tabungan-card-container');
  container.innerHTML = '';
  savings.forEach((save, index) => {
    const percent = Math.min((save.saved / save.target) * 100, 100).toFixed(2);
    const est = Math.max(Math.ceil((save.target - save.saved) / save.amountPerSave), 0);
    const isCompleted = save.saved >= save.target;
    console.log(`Rendering: ${save.item}, saved: ${save.saved}, target: ${save.target}, percent: ${percent}%`);
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-xl shadow-lg border border-gray-100 card-hover transition-all duration-300 fade-in';
    card.innerHTML = `
      <img src="${save.image || 'https://via.placeholder.com/150'}" alt="${save.item}" class="w-full h-40 object-cover rounded-lg mb-4">
      <h3 class="text-xl font-semibold text-gray-800">${save.item}</h3>
      <p class="text-gray-600">Progress: Rp ${save.saved.toLocaleString('id-ID')} / Rp ${save.target.toLocaleString('id-ID')}</p>
      <div class="w-full bg-gray-200 rounded-full h-3 mt-2 mb-3">
        <div class="bg-teal-500 h-3 rounded-full transition-all duration-500 ease-in-out" style="width: ${percent}%"></div>
      </div>
      <p class="text-sm text-gray-500">Estimasi: ${est} hari</p>
      <div class="flex gap-3 mt-4">
        <button class="tabung-btn flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg btn-scale transition-all duration-300" ${isCompleted ? 'disabled' : ''}>Tabung</button>
      </div>
    `;
    container.appendChild(card);
    if (!isCompleted) {
      card.querySelector('.tabung-btn').addEventListener('click', () => handleTabung(index));
    }
  });
}

function renderHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = '';
  const today = new Date().toDateString();
  transactions
    .filter(t => new Date(t.date).toDateString() === today)
    .forEach(tx => {
      const div = document.createElement('div');
      div.className = 'p-4 bg-white rounded-lg shadow-md fade-in';
      div.textContent = `${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${tx.title} - Rp ${tx.amount.toLocaleString('id-ID')}`;
      container.appendChild(div);
    });
  savings
    .filter(s => s.history && s.history.includes(today))
    .forEach(s => {
      const div = document.createElement('div');
      div.className = 'p-4 bg-white rounded-lg shadow-md fade-in';
      div.textContent = `Menabung untuk ${s.item}`;
      container.appendChild(div);
    });
}

function openModal(type) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  modalTitle.textContent = `Tambah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;
  modal.dataset.type = type;
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  document.getElementById('transaction-form').reset();
}

function addTransaction(e) {
  e.preventDefault();
  const title = document.getElementById('form-judul').value;
  const amount = parseInt(document.getElementById('form-nominal').value);
  const type = document.getElementById('modal').dataset.type;

  if (amount <= 0) {
    Swal.fire({
      title: 'Error',
      text: 'Nominal harus lebih dari 0',
      icon: 'error',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  const balance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
  if (type === 'expense' && amount > balance) {
    Swal.fire({
      title: 'Error',
      text: 'Saldo tidak mencukupi',
      icon: 'error',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  transactions.push({ title, amount, type, date: new Date() });
  updateBalance();
  renderTransactions();
  renderHistory();
  closeModal();
}

function addSaving(e) {
  e.preventDefault();
  const item = document.getElementById('tabungan-nama').value;
  const target = parseInt(document.getElementById('tabungan-harga').value);
  const saved = 0; // Saldo awal selalu 0, karena sinkron dengan current-balance
  const amountPerSave = parseInt(document.getElementById('tabungan-nominal').value);
  const imageInput = document.getElementById('tabungan-gambar');
  const fileLabel = document.getElementById('file-label');
  const fileName = document.getElementById('file-name');

  if (target <= 0 || amountPerSave <= 0) {
    Swal.fire({
      title: 'Error',
      text: 'Harga barang dan nominal per tabung harus lebih dari 0',
      icon: 'error',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  let image = 'https://via.placeholder.com/150';
  if (imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      image = e.target.result;
      savings.push({ item, target, saved, amountPerSave, image, history: [] });
      console.log(`Added: ${item}, saved: ${saved}, target: ${target}`);
      renderSavings();
      renderHistory();
      fileLabel.classList.remove('file-selected');
      fileName.classList.add('hidden');
      fileName.textContent = '';
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    savings.push({ item, target, saved, amountPerSave, image, history: [] });
    console.log(`Added: ${item}, saved: ${saved}, target: ${target}`);
    renderSavings();
    renderHistory();
    fileLabel.classList.remove('file-selected');
    fileName.classList.add('hidden');
    fileName.textContent = '';
  }

  e.target.reset();
}

function handleTabung(index) {
  const today = new Date().toDateString();
  const balance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  if (savings[index].amountPerSave > balance) {
    Swal.fire({
      title: 'Error',
      text: 'Saldo tidak mencukupi untuk menabung',
      icon: 'error',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  savings[index].saved += savings[index].amountPerSave;
  savings[index].history.push(today);
  transactions.push({
    title: `Menabung untuk ${savings[index].item}`,
    amount: savings[index].amountPerSave,
    type: 'expense',
    date: new Date()
  });

  console.log(`Tabung: ${savings[index].item}, saved: ${savings[index].saved}, target: ${savings[index].target}`);

  if (savings[index].saved >= savings[index].target) {
    Swal.fire({
      title: 'Selamat!',
      text: `Progress untuk menabung ${savings[index].item} sudah selesai! 🎉`,
      icon: 'success',
      confirmButtonColor: '#10b981'
    });
  }

  updateBalance();
  renderSavings();
  renderTransactions();
  renderHistory();
}

function updateFileIndicator() {
  const imageInput = document.getElementById('tabungan-gambar');
  const fileLabel = document.getElementById('file-label');
  const fileName = document.getElementById('file-name');
  imageInput.addEventListener('change', () => {
    if (imageInput.files && imageInput.files[0]) {
      fileLabel.classList.add('file-selected');
      fileName.classList.remove('hidden');
      fileName.textContent = imageInput.files[0].name;
    } else {
      fileLabel.classList.remove('file-selected');
      fileName.classList.add('hidden');
      fileName.textContent = '';
    }
  });
}

document.getElementById('transaction-form').addEventListener('submit', addTransaction);
document.getElementById('tabungan-form').addEventListener('submit', addSaving);
document.getElementById('add-income-btn').addEventListener('click', () => openModal('income'));
document.getElementById('add-expense-btn').addEventListener('click', () => openModal('expense'));
document.getElementById('modal-cancel').addEventListener('click', closeModal);
updateFileIndicator();

updateBalance();
renderSavings();
renderTransactions();
renderHistory();