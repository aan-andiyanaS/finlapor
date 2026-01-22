import { create } from 'zustand';
import { Transaction, transactionsApi } from '@/lib/api';

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    summary: {
        total_income: number;
        total_expense: number;
        balance: number;
    } | null;

    // Actions
    fetchTransactions: (params?: { type?: string; category?: string }) => Promise<void>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    fetchSummary: () => Promise<void>;
    clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    isLoading: false,
    error: null,
    summary: null,

    fetchTransactions: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const transactions = await transactionsApi.list(params);
            set({ transactions, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch transactions',
                isLoading: false
            });
        }
    },

    addTransaction: async (transaction) => {
        set({ isLoading: true, error: null });
        try {
            const newTransaction = await transactionsApi.create(transaction);
            set((state) => ({
                transactions: [newTransaction, ...state.transactions],
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to add transaction',
                isLoading: false
            });
            throw error;
        }
    },

    updateTransaction: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const updatedTransaction = await transactionsApi.update(id, updates);
            set((state) => ({
                transactions: state.transactions.map(t => t.id === id ? updatedTransaction : t),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update transaction',
                isLoading: false
            });
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await transactionsApi.delete(id);
            set((state) => ({
                transactions: state.transactions.filter(t => t.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete transaction',
                isLoading: false
            });
            throw error;
        }
    },

    fetchSummary: async () => {
        try {
            const summary = await transactionsApi.getSummary();
            set({ summary });
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    },

    clearError: () => {
        set({ error: null });
    },
}));
