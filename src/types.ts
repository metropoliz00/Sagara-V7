export interface FinanceTransaction {
  id: string;
  activity_name: string;
  income: number;
  expense: number;
  date: string;
  created_at?: string;
}

export interface FinanceSummary {
  total_income: number;
  total_expense: number;
  balance: number;
}
