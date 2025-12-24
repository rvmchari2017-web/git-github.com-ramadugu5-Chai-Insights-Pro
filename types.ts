
export type PaymentMethod = 'CASH' | 'GPAY' | 'PHONEPE' | 'OTHER';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  notes?: string;
  staffId?: string; // Optional link to staff
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  address: string;
  aadhaar: string;
  weeklyBasePay: number;
  totalHeldBalance: number;
  joinedDate: string;
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  paymentBreakdown: Record<PaymentMethod, number>;
}

export interface UserProfile {
  name: string;
  email: string;
  businessName: string;
  businessAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  shopImage?: string; // Base64
  isAuthenticated: boolean;
  isConfigured: boolean;
}
