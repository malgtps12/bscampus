-- Migration: Add password reset functionality (6 digit code)
-- Run this SQL in your Supabase SQL Editor
--
-- Catatan: versi lama tabel ini memakai kolom reset_code VARCHAR(4) yang
-- tidak pernah dipakai kode aplikasi (flow reset sebelumnya gagal).
-- Tabel lama tersebut dibuang lalu dibuat ulang (kode reset bersifat sementara,
-- jadi tidak ada data yang perlu dipertahankan) supaya kolom email/code_hash
-- benar-benar terpasang dan aman dijalankan berulang kali.

DROP TABLE IF EXISTS password_reset_codes CASCADE;

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satu kode aktif per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_codes_email
  ON password_reset_codes (email);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);

-- Verify table was created
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'password_reset_codes'
ORDER BY ordinal_position;
