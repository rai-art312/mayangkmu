const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Nomor penjual (ganti dengan nomor penjual)
const PENJUAL_NUMBER = '6281234567890@s.whatsapp.net'; // Format: 62xxxxxxxxxx@s.whatsapp.net

// Database sederhana (JSON file)
const fs = require('fs');
const ORDERS_FILE = 'orders.json';
let orders = [];

if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

// Fungsi simpan orders
function saveOrders() {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Inisialisasi WhatsApp
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        generateHighQualityLinkPreview: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Bot SELENDANG MAYANG siap!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            await handleIncomingMessage(sock, msg);
        }
    });
}

// Handle pesan masuk
async function handleIncomingMessage(sock, msg) {
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    console.log(`Pesan dari ${from}: ${text}`);

    // Auto reply untuk konfirmasi pesanan
    if (text.toLowerCase().includes('pesanan') || text.includes('order')) {
        await sock.sendMessage(from, {
            text: `✅ *TERIMA KASIH PESANAN ANDA SUDAH DITERIMA!*\n\nPenjual akan segera menghubungi Anda untuk konfirmasi.\n⏱️ Estimasi: 5-10 menit\n\n*Selendang Mayang Betawi* 🧊🍰`
        });
    }
}

// Webhook untuk terima order dari website
app.post('/api/order', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Generate order ID
        const orderId = `SM${Date.now()}`;
        orderData.id = orderId;
        orderData.timestamp = new Date().toISOString();
        orders.unshift(orderData);
        saveOrders();

        // Kirim ke WA penjual
        const orderMessage = formatOrderMessage(orderData);
        
        // Simulasi kirim ke penjual (ganti dengan sock.sendMessage jika bot aktif)
        console.log('📱 Mengirim ke penjual:', orderMessage);
        
        // Kirim konfirmasi ke pembeli
        const buyerReply = `✅ *Pesanan #${orderId} DITERIMA!*\n\nTerima kasih ${orderData.customerName}! Penjual akan menghubungi Anda sebentar lagi.\nEstimasi pengiriman: 30-60 menit.`;
        
        res.json({ 
            success: true, 
            orderId,
            message: buyerReply 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Format pesan order untuk penjual
function formatOrderMessage(order) {
    let message = `*📦 PESANAN BARU SELENDANG MAYANG*\n\n`;
    message += `🆔 *#${order.id}*\n`;
    message += `👤 ${order.customerName}\n`;
    message += `📱 ${order.customerPhone}\n`;
    message += `⏰ ${new Date(order.timestamp).toLocaleString('id-ID')}\n\n`;
    message += `*📋 RINCIAN PESANAN:*\n`;
    
    order.items.forEach(item => {
        message += `• ${item.name} x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}\n`;
    });
    
    message += `\n💰 *TOTAL: Rp ${order.total.toLocaleString('id-ID')}*\n\n`;
    message += `⛟ *TUNGGU KONFIRMASI ALAMAT*\n`;
    message += `💳 *TUNGGU KONFIRMASI PEMBAYARAN*\n\n`;
    message += `Klik *REPLY* untuk konfirmasi! 🚀`;
    
    return message;
}

// Dashboard orders
app.get('/orders', (req, res) => {
    res.json(orders);
});

// QR Code page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

connectToWhatsApp();

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📱 Scan QR Code di http://localhost:${PORT}`);
});