# Setup MongoDB untuk Reset Password BSCampus

## 1. Setup MongoDB Atlas (Free Tier)

### Buat Cluster
1. Daftar di https://www.mongodb.com/cloud/atlas/register
2. Pilih **Free Tier (M0)** → AWS/Google Cloud
3. Pilih region terdekat (Singapore)
4. Nama cluster: `bscampus`

### Setup Database User
1. Security → Database Access → Add New Database User
2. Username: `bscampus_admin`
3. Password: Generate secure password
4. Database User Privileges: `Read and write to any database`
5. Simpan username & password

### Setup Network Access
1. Security → Network Access → Add IP Address
2. Pilih **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Atau tambahkan IP spesifik untuk keamanan lebih

### Get Connection String
1. Klik **Connect** pada cluster
2. Pilih **Connect your application**
3. Driver: Node.js, Version: 5.5 or later
4. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/
   ```

---

## 2. Update .env.local

Ganti placeholder di `.env.local`:

```env
MONGODB_URI=mongodb+srv://bscampus_admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/bscampus?retryWrites=true&w=majority
```

**Contoh:**
```env
MONGODB_URI=mongodb+srv://bscampus_admin:MySecurePass123@cluster0.abc12.mongodb.net/bscampus?retryWrites=true&w=majority
```

---

## 3. Struktur Database MongoDB

### Database: `bscampus`

### Collection: `users`
```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@student.pnl.ac.id",
  "password_hash": "$2a$10$...",
  "created_at": ISODate("2026-10-09T15:56:42.953Z"),
  "updated_at": ISODate("2026-10-09T15:56:42.953Z")
}
```

### Collection: `password_reset_codes`
```json
{
  "_id": ObjectId("..."),
  "user_id": "507f1f77bcf86cd799439011",
  "reset_code": "1234",
  "expires_at": ISODate("2026-10-09T16:11:42.953Z"),
  "used": false,
  "created_at": ISODate("2026-10-09T15:56:42.953Z")
}
```

---

## 4. File-file MongoDB yang Sudah Dibuat

✅ `lib/mongodb.ts` - Koneksi MongoDB dengan pooling  
✅ `lib/user.ts` - CRUD operations untuk users  
✅ `lib/password-reset.ts` - Reset password logic  
✅ `app/api/auth/forgot-password/route-mongodb.ts` - API forgot password  
✅ `app/api/auth/verify-reset-code/route-mongodb.ts` - API verify code  
✅ `app/api/auth/reset-password/route-mongodb.ts` - API reset password  

---

## 5. Aktivasi MongoDB Routes

Setelah setup MongoDB selesai, rename file routes:

```bash
# Backup old Supabase routes
mv app/api/auth/forgot-password/route.ts app/api/auth/forgot-password/route-supabase.ts
mv app/api/auth/verify-reset-code/route.ts app/api/auth/verify-reset-code/route-supabase.ts
mv app/api/auth/reset-password/route.ts app/api/auth/reset-password/route-supabase.ts

# Activate MongoDB routes
mv app/api/auth/forgot-password/route-mongodb.ts app/api/auth/forgot-password/route.ts
mv app/api/auth/verify-reset-code/route-mongodb.ts app/api/auth/verify-reset-code/route.ts
mv app/api/auth/reset-password/route-mongodb.ts app/api/auth/reset-password/route.ts
```

---

## 6. Testing

### Test MongoDB Connection
Buat file test: `test-mongodb.js`

```javascript
const { MongoClient } = require('mongodb');

const uri = "YOUR_MONGODB_URI_HERE";
const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    
    const db = client.db('bscampus');
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

test();
```

Run: `node test-mongodb.js`

### Test Reset Password Flow
1. `npm run dev`
2. Buka `/forgot-password`
3. Input email user
4. Cek console untuk kode 4 digit
5. Input kode → set password baru
6. Login dengan password baru

---

## 7. Migration Data (Opsional)

Jika ada data user di Supabase, bisa migrate:

1. Export users dari Supabase (SQL):
```sql
SELECT id, name, email, password_hash, created_at 
FROM users;
```

2. Import ke MongoDB via script atau MongoDB Compass

---

## 8. Production Checklist

- [ ] Setup MongoDB Atlas cluster
- [ ] Create database user dengan strong password
- [ ] Whitelist IP atau pilih 0.0.0.0/0
- [ ] Copy connection string ke `.env.local`
- [ ] Test koneksi MongoDB
- [ ] Activate MongoDB routes
- [ ] Test forgot password flow
- [ ] Deploy ke Vercel dengan MONGODB_URI di environment variables

---

## Environment Variables Summary

```env
# MongoDB (Required untuk reset password)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bscampus

# Email Service (Required)
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# JWT & Admin
JWT_SECRET=your_secret_key
ADMIN_USERNAME=MXLERA
ADMIN_PASSWORD=your_password
```

---

## Keuntungan MongoDB untuk Reset Password

✅ **Flexible schema** - mudah tambah field baru  
✅ **Fast queries** - index pada user_id dan reset_code  
✅ **Scalable** - support jutaan reset requests  
✅ **Free tier** - 512MB storage gratis  
✅ **Auto-expire** - bisa set TTL index untuk auto-delete expired codes  

---

## Troubleshooting

### Error: "MongoServerError: Authentication failed"
- Cek username & password di connection string
- Pastikan database user sudah dibuat

### Error: "MongoServerError: IP not whitelisted"
- Tambahkan IP di Network Access
- Atau allow 0.0.0.0/0 untuk development

### Error: "Cannot connect to MongoDB"
- Cek internet connection
- Cek connection string format
- Pastikan cluster sudah running

---

## Next Steps

1. Setup MongoDB Atlas cluster
2. Update MONGODB_URI di `.env.local`
3. Activate MongoDB routes (rename files)
4. Test reset password feature
5. Deploy ke Vercel
