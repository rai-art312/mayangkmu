// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orderId = localStorage.getItem('orderId') || 1;

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function addToCart(name, price, quantity = 1) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ name, price, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${name} ditambahkan ke keranjang!`);
}

function openCart() {
    document.getElementById('cartModal').style.display = 'flex';
    renderCartItems();
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Keranjang Anda kosong</p>
                <a href="#products" class="cta-button" onclick="closeCart()" style="margin-top: 1rem;">Lihat Produk</a>
            </div>
        `;
        cartTotalElement.textContent = 'Rp 0';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = cart.map((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <p>Rp ${item.price.toLocaleString('id-ID')}</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="subtotal">Rp ${subtotal.toLocaleString('id-ID')}</div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotalElement.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

function updateQuantity(index, change) {
    if (cart[index].quantity + change <= 0) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity += change;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showNotification('Item dihapus dari keranjang!');
}

// WA CHECKOUT - Langsung terkirim ke penjual
function checkout() {
    if (cart.length === 0) {
        showNotification('Keranjang kosong!');
        return;
    }
    
    // Generate order details
    const timestamp = new Date().toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const customerName = prompt('Masukkan nama Anda:') || 'Pelanggan';
    const customerPhone = prompt('Masukkan nomor HP Anda:') || '';
    
    if (!customerPhone) {
        showNotification('Nomor HP wajib diisi!');
        return;
    }
    
    // Format pesan WA
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let orderMessage = `*📦 PESANAN BARU SELENDANG MAYANG*\n\n`;
    orderMessage += `🆔 No. Pesanan: #${orderId}\n`;
    orderMessage += `👤 Nama: ${customerName}\n`;
    orderMessage += `📱 HP: ${customerPhone}\n`;
    orderMessage += `⏰ Waktu: ${timestamp}\n\n`;
    orderMessage += `*📋 Rincian Pesanan:*\n`;
    
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        orderMessage += `• ${item.name} (${item.quantity}x) = Rp ${subtotal.toLocaleString('id-ID')}\n`;
    });
    
    orderMessage += `\n💰 *TOTAL: Rp ${total.toLocaleString('id-ID')}*\n\n`;
    orderMessage += `⛟ Alamat Pengiriman?\n`;
    orderMessage += `💳 Metode Pembayaran?\n\n`;
    orderMessage += `Silakan konfirmasi pesanan ini! 🙏`;
    
    // Encode untuk WA
    const encodedMessage = encodeURIComponent(orderMessage);
    const waNumber = '6281234567890'; // Ganti dengan nomor WA penjual (format internasional)
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    
    // Buka WA langsung
    window.open(waUrl, '_blank');
    
    // Simpan order ID untuk next order
    orderId++;
    localStorage.setItem('orderId', orderId);
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    closeCart();
    
    showNotification('✅ Pesanan berhasil dikirim ke WA Penjual!');
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// Close cart modal when clicking outside
window.onclick = function(event) {
    const cartModal = document.getElementById('cartModal');
    if (event.target === cartModal) {
        closeCart();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});