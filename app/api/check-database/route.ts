import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      tables: {},
      migrations_needed: []
    }

    // Check users table
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    results.tables.users = usersError ? { exists: false, error: usersError.message } : { exists: true }

    // Check password_reset_codes table
    const { data: resetCodesCheck, error: resetCodesError } = await supabase
      .from('password_reset_codes')
      .select('id')
      .limit(1)
    
    if (resetCodesError) {
      results.tables.password_reset_codes = { exists: false, error: resetCodesError.message }
      results.migrations_needed.push({
        name: 'password_reset_codes',
        sql: `
-- Create password_reset_codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reset_code VARCHAR(4) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_reset_code ON password_reset_codes(reset_code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
        `
      })
    } else {
      results.tables.password_reset_codes = { exists: true }
    }

    // Check for bank/ewallet fields in users table
    const { data: userSample, error: userFieldsError } = await supabase
      .from('users')
      .select('bank_name, account_number, ewallet_type')
      .limit(1)
    
    if (userFieldsError) {
      results.migrations_needed.push({
        name: 'add_payment_fields_to_users',
        sql: `
-- Add payment fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ewallet_number VARCHAR(50);
        `
      })
    }

    results.summary = {
      all_tables_exist: results.migrations_needed.length === 0,
      migrations_count: results.migrations_needed.length
    }

    if (results.migrations_needed.length > 0) {
      results.instructions = [
        "1. Open Supabase Dashboard: https://supabase.com/dashboard",
        "2. Go to SQL Editor",
        "3. Run the SQL migrations listed above",
        "4. Refresh this page to verify"
      ]
    }

    return NextResponse.json(results, { 
      status: results.migrations_needed.length > 0 ? 500 : 200 
    })
  } catch (error) {
    console.error("[Check DB] Error:", error)
    return NextResponse.json(
      { error: "Failed to check database", details: error },
      { status: 500 }
    )
  }
}
