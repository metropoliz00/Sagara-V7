-- Database Setup for Keuangan Gugus 3 Melati

-- Create finance_transactions table
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    activity_name TEXT NOT NULL,
    income DECIMAL(15, 2) DEFAULT 0,
    expense DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: 
-- Income: Pemasukan
-- Expense: Pengeluaran
-- Balance (Saldo) is derived by summing Income - Expense in queries or application logic.

-- Security Policies (Supabase RLS)
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read data (Transparency)
CREATE POLICY "Public Read Access" 
ON finance_transactions 
FOR SELECT 
USING (true);

-- Allow Admin to manage data
-- In this app environment, the Server API uses service_role_key to manage records.
-- If managing directly from client, policies would need auth checks.
