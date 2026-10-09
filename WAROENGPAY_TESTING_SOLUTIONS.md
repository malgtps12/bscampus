# 3 Cara Setup WaroengPay QRIS Testing

## ❌ Problem
WaroengPay hanya menerima callback URL dengan port: 80, 443, 8080, 8443
Dev server berjalan di port 3000 → tidak diizinkan

---

## ✅ Solusi 1: Ubah Port Dev Server ke 8080 (Tercepat)

### Step 1: Update `.env.local`
```env
NEXT_PUBLIC_APP_URL=http://localhost:8080
```

### Step 2: Jalankan dev server di port 8080
```bash
npm run dev -- -p 8080
```

### Step 3: Test WaroengPay
```bash
# Update script test
NEXT_PUBLIC_APP_URL=http://localhost:8080
node test-waroengpay.js
```

**Keuntungan:** Cepat, tidak perlu ngrok, langsung jalan ✅

---

## 2️⃣ Solusi 2: Gunakan Ngrok (Untuk Public URL)

### Step 1: Daftar Ngrok
- Buka: https://dashboard.ngrok.com/signup
- Daftar dengan email
- Dapat authtoken

### Step 2: Setup Authtoken
```bash
ngrok config add-authtoken <YOUR_AUTHTOKEN_HERE>
```

### Step 3: Start Ngrok
```bash
ngrok http 3000
```

Output:
```
Forwarding    https://abc123-xx-xx.ngrok.io -> http://localhost:3000
```

### Step 4: Update `.env.local`
```env
NEXT_PUBLIC_APP_URL=https://abc123-xx-xx.ngrok.io
```

### Step 5: Restart dev server & test
```bash
npm run dev
node test-waroengpay.js
```

---

## 3️⃣ Solusi 3: Deploy ke Vercel (Production Ready)

Deploy ke Vercel → sudah di domain dengan port 443 ✅

---

## 🎯 RECOMMENDED: Solusi 1 (Tercepat)

**Jalankan:**

```bash
# Terminal 1: Dev server di port 8080
npm run dev -- -p 8080

# Terminal 2: Update env & test
# Edit .env.local: NEXT_PUBLIC_APP_URL=http://localhost:8080
node test-waroengpay.js
```

**Result:** Checkout QRIS akan berhasil! 🎉

---

Pilih mana yang ingin Anda lakukan?
