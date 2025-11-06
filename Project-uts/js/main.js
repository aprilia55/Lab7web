// ================== HELPERS ==================
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
function showModal(id){ document.getElementById(id).style.display='flex'; }
function hideModal(id){ document.getElementById(id).style.display='none'; }

// ================== LOGIN ==================
function handleLoginForm(evt){
  evt.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;

  const user = (typeof window.dataPengguna !== 'undefined') 
    ? window.dataPengguna.find(u => u.email === email && u.password === pw) 
    : null;

  if(!user){
    alert('Email atau password salah 🥲');
    return;
  }

  localStorage.setItem('userLogin', JSON.stringify(user));
  window.location.href = 'dashboard.html';
}

// ================== GREETING ==================
function getGreeting(){
  const h = new Date().getHours();
  if(h < 11) return 'Selamat Pagi 🌤️';
  if(h < 15) return 'Selamat Siang ☀️';
  if(h < 19) return 'Selamat Sore 🌇';
  return 'Selamat Malam 🌙';
}

// ================== KATALOG / STOK ==================
function renderKatalog(targetId, allowAddToCart = false) {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = ''; 
  if (!Array.isArray(window.dataKatalogBuku) || window.dataKatalogBuku.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#777; font-style:italic;">Belum ada data buku yang tersedia.</p>`;
    return;
  }

  window.dataKatalogBuku.forEach((b, idx) => {
    const hargaDisplay = b.harga || 'Rp 0';
    const stokDisplay = b.stok || 0;
    const imgSrc = b.cover && b.cover.trim() !== '' ? b.cover : 'img/default.jpg';

    const card = document.createElement('div');
    card.className = 'card shadow-sm';
    card.style.cssText = `
      background:#fff;
      border:1px solid #e3f2fd;
      border-radius:10px;
      padding:20px;
      text-align:center;
      transition: all 0.3s ease;
    `;

    card.innerHTML = `
      <img src="${imgSrc}" alt="${b.namaBarang}" 
           style="width:120px;height:160px;object-fit:cover;border-radius:8px;margin-bottom:12px;">
      <h4 style="color:#01579b; font-weight:600; font-size:1rem; margin-bottom:6px;">${b.namaBarang}</h4>
      <p style="margin:0; color:#555;">${hargaDisplay}</p>
      <small style="display:block; color:#777;">Stok: ${stokDisplay}</small>
      ${allowAddToCart 
        ? `<button class="button" 
                    style="margin-top:10px;background-color:#0288d1;color:white;border:none;
                           padding:8px 16px;border-radius:6px;font-weight:600;"
                    onclick="addToCheckout(${idx})">Pesan</button>` 
        : ''}
    `;

    card.addEventListener('mouseover', () => card.style.transform = 'translateY(-5px)');
    card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');

    container.appendChild(card);
  });
}

// Tambah stok baru
function addNewStok(evt){
  evt.preventDefault();
  const kode = document.getElementById('newKode').value.trim();
  const nama = document.getElementById('newNama').value.trim();
  const harga = document.getElementById('newHarga').value.trim();
  const stok = parseInt(document.getElementById('newStok').value) || 0;
  if(!kode || !nama){ alert('Kode dan Nama harus diisi'); return; }

  window.dataKatalogBuku.push({
    kodeBarang: kode,
    namaBarang: nama,
    jenisBarang: 'Buku',
    edisi: '1',
    stok: stok,
    harga: harga || 'Rp 0',
    cover: 'img/default.jpg'
  });

  renderKatalog('katalogContainer');
  document.getElementById('newKode').value='';
  document.getElementById('newNama').value='';
  document.getElementById('newHarga').value='';
  document.getElementById('newStok').value='1';
}

// ================== CHECKOUT ==================
let checkoutItems = loadFromLocal('checkoutItems') || [];

function saveToLocal(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}
function loadFromLocal(key){
  try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; }
}

function addToCheckout(idx){
  const book = window.dataKatalogBuku[idx];
  if(!book) return;
  const exist = checkoutItems.find(it => it.idx === idx);
  if(exist){
    exist.qty++;
  } else {
    checkoutItems.push({ idx, qty: 1 });
  }
  saveToLocal('checkoutItems', checkoutItems);
  renderCheckoutItems();
  if(document.getElementById('katalogContainerSmall')) renderKatalog('katalogContainerSmall', true);
  if(document.getElementById('checkoutGridContainer')) renderCheckoutGrid('checkoutGridContainer');
}

function renderCheckoutItems(){
  const tbody = document.getElementById('checkoutList');
  if(!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  checkoutItems.forEach((it, i) => {
    const book = window.dataKatalogBuku[it.idx];
    const hargaNum = parseInt((book.harga || '0').toString().replace(/[^0-9]/g,'')) || 0;
    const subtotal = hargaNum * it.qty;
    total += subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${book.namaBarang}</td>
      <td><input type="number" min="1" value="${it.qty}" data-i="${i}" onchange="updateQty(this)"></td>
      <td>Rp ${hargaNum.toLocaleString('id')}</td>
      <td>Rp ${subtotal.toLocaleString('id')}</td>
      <td><button class="button" onclick="removeItem(${i})">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  const totalEl = document.getElementById('checkoutTotal');
  if(totalEl) totalEl.textContent = `Rp ${total.toLocaleString('id')}`;

  if(document.getElementById('checkoutGridContainer')){
    renderCheckoutGrid('checkoutGridContainer');
  }
}

window.updateQty = function(inp){
  const i = parseInt(inp.dataset.i);
  const v = parseInt(inp.value) || 1;
  checkoutItems[i].qty = v;
  saveToLocal('checkoutItems', checkoutItems);
  renderCheckoutItems();
}
window.removeItem = function(i){
  checkoutItems.splice(i,1);
  saveToLocal('checkoutItems', checkoutItems);
  renderCheckoutItems();
}

function submitCheckout(evt){
  evt.preventDefault();
  const nama = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const alamat = document.getElementById('custAddress').value.trim();
  const metode = document.getElementById('custPayment').value;
  if(!nama || !alamat || checkoutItems.length === 0){
    alert('Isi data pemesan dan pastikan minimal 1 item di keranjang');
    return;
  }

  const order = {
    id: 'DO' + Date.now(),
    nama, email, alamat, metode,
    items: checkoutItems,
    tanggal: new Date().toLocaleString(),
    total: document.getElementById('checkoutTotal') ? document.getElementById('checkoutTotal').textContent : 'Rp 0'
  };

  const orders = loadFromLocal('orders') || [];
  orders.push(order);
  saveToLocal('orders', orders);

  checkoutItems = [];
  saveToLocal('checkoutItems', checkoutItems);
  renderCheckoutItems();

  alert('Pemesanan berhasil! Nomor DO: ' + order.id);
}

// ================== CHECKOUT GRID ==================
function renderCheckoutGrid(targetId){
  const container = document.getElementById(targetId);
  if(!container) return;

  container.innerHTML = ''; 
  if(checkoutItems.length === 0){
    container.innerHTML = `<p style="text-align:center; color:#777; font-style:italic;">Keranjang kosong</p>`;
    return;
  }

  checkoutItems.forEach((it, idx)=>{
    const book = window.dataKatalogBuku[it.idx];
    const hargaNum = parseInt((book.harga || '0').toString().replace(/[^0-9]/g,'')) || 0;
    const subtotal = hargaNum * it.qty;

    const card = document.createElement('div');
    card.className = 'card shadow-sm';
    card.style.cssText = `
      display:flex; flex-direction:column; align-items:center;
      padding:15px; margin:10px; border-radius:10px;
      box-shadow:0 3px 8px rgba(0,0,0,0.08);
      max-width:200px; text-align:center;
    `;

    card.innerHTML = `
      <div style="width:120px; height:160px; overflow:hidden; display:flex; justify-content:center; align-items:center; border-radius:8px; margin-bottom:10px;">
        <img src="${book.cover || 'img/default.jpg'}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <h4 style="font-size:1rem; color:#01579b; margin-bottom:6px;">${book.namaBarang}</h4>
      <p style="margin:0; color:#555;">Rp ${hargaNum.toLocaleString('id')}</p>
      <p style="margin:2px 0; color:#777;">Qty: ${it.qty}</p>
      <small style="color:#777;">Subtotal: Rp ${subtotal.toLocaleString('id')}</small>
    `;

    container.appendChild(card);
  });
}

// ================== TRACKING ==================
function cariTracking(){
  const no = document.getElementById('trackNo').value.trim();
  if(!no){ alert('Masukkan nomor Delivery Order'); return; }
  const info = (typeof window.dataTracking !== 'undefined') ? window.dataTracking[no] : null;
  if(!info){
    alert('Nomor DO tidak ditemukan');
    return;
  }
  document.getElementById('trackNama').textContent = info.nama || '-';
  document.getElementById('trackStatus').textContent = info.status || '-';
  document.getElementById('trackEkspedisi').textContent = (info.ekspedisi || '-') + ' • ' + (info.paket || '-');
  document.getElementById('trackTanggal').textContent = info.tanggalKirim || '-';
  document.getElementById('trackTotal').textContent = info.total || '-';

  let percent = 20;
  const st = (info.status || '').toLowerCase();
  if(st.includes('dikirim') || st.includes('on the way')) percent = 60;
  if(st.includes('dalam perjalanan') || st.includes('transit')) percent = 80;
  if(st.includes('selesai') || st.includes('delivered')) percent = 100;
  const bar = document.getElementById('trackProgressBar');
  if(bar) bar.style.width = percent + '%';

  const list = document.getElementById('trackList');
  if(list){
    list.innerHTML = '';
    (info.perjalanan || []).forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.waktu} — ${p.keterangan}`;
      list.appendChild(li);
    });
  }
}

// ================== PREVIEW FOTO ==================
function tampilPreview() {
  const input = document.getElementById('uploadFoto');
  const preview = document.getElementById('previewFoto');
  const file = input.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', function(){
  if(document.getElementById('katalogContainerSmall')){
    renderKatalog('katalogContainerSmall', true);
  }
  renderCheckoutItems();
  if(document.getElementById('checkoutGridContainer')){
    renderCheckoutGrid('checkoutGridContainer');
  }
});
