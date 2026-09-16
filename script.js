const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkUeXkO_D5neoxOXAuXIX5PPE_TVStksvZa0qamEfaeffGLQN9n9zrLtxfEIhEH6H-OA/exec';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSHsUr_-ZhzVnquPFhFPfuhSV_yjMf1XcvXyywckh7jMQVB7QPR0EuQNDEjsyIz3EJFYQQspQLlkY6I/pub?output=csv';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Logic หน้า product.html
  const productList = document.getElementById('product-list');
  const filterBar = document.getElementById('filter-bar');

  if (productList) {
    fetch('products.json')
      .then(res => res.json())
      .then(products => {
        const urlParams = new URLSearchParams(window.location.search);
        const selectedCat = urlParams.get('category') || 'all';

        renderProducts(products, selectedCat);
        setupFilterButtons(products);
      });
  }

  function renderProducts(products, categoryFilter) {
    productList.innerHTML = '';
    const filtered = categoryFilter === 'all' 
      ? products 
      : products.filter(p => p.category === categoryFilter);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <h3>${item.name}</h3>
        <div class="desc">${item.description}</div>
        <div class="price-row">
          <span class="price">${item.price} ฿</span>
          <a href="order.html?item=${encodeURIComponent(item.name)}&price=${item.price}" class="btn-primary">สั่งเลย</a>
        </div>
      `;
      productList.appendChild(card);
    });
  }

  function setupFilterButtons(products) {
    if (!filterBar) return;
    const buttons = filterBar.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;
        renderProducts(products, category);
      });
    });
  }

  // 2. Logic หน้า order.html
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item');
    const priceParam = urlParams.get('price');

    if (itemParam) document.getElementById('items').value = itemParam;
    if (priceParam) document.getElementById('total').value = priceParam;

    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const payload = {
        customerName: document.getElementById('customerName').value,
        contact: document.getElementById('contact').value,
        items: document.getElementById('items').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
      };

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      });
    });
  }

  // 3. Logic หน้า admin.html
  const ordersTableBody = document.querySelector('#ordersTable tbody');
  if (ordersTableBody && CSV_URL) {
    fetch(CSV_URL)
      .then(res => res.text())
      .then(csvText => {
        const rows = parseCSV(csvText);
        ordersTableBody.innerHTML = '';
        
        const dataRows = rows.slice(1).reverse();

        dataRows.forEach(row => {
          if (row.length >= 5) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row[0] || ''}</td>
              <td>${row[1] || ''}</td>
              <td>${row[2] || ''}</td>
              <td>${row[3] || ''}</td>
              <td>${row[4] || ''} ฿</td>
              <td>${row[5] || ''}</td>
            `;
            ordersTableBody.appendChild(tr);
          }
        });
      });
  }

  function parseCSV(text) {
    let p = '', c = '', r = [];
    let q = false;
    let row = [''];
    for (let i = 0; i < text.length; i++) {
      c = text[i];
      let next = text[i+1];
      if (c === '"') {
        if (q && next === '"') { row[row.length - 1] += '"'; i++; }
        else { q = !q; }
      } else if (c === ',' && !q) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !q) {
        if (c === '\r' && next === '\n') { i++; }
        r.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') { r.push(row); }
    return r;
  }
});