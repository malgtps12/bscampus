-- Migration: Add webhook_logs table for monitoring
-- Run this SQL in your Supabase SQL Editor

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  payment_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  reference VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  livemode BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;
