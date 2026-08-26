import { useState, useEffect } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface Expense {
  id: string;
  amount: number;
  concept: string;
  date: string;
  account: { name: string };
  category: { name: string } | null;
  user: { name: string };
}

export const useTreasury = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // <-- ASEGÚRATE DE QUE ESTÉ
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [accRes, expRes, catRes, transRes] = await Promise.all([
        axios.get('/treasury/accounts'),
        axios.get('/treasury/expenses'),
        axios.get('/treasury/expenses/categories'),
        axios.get('/treasury/transactions'), // <-- ASEGÚRATE DE QUE ESTÉ
      ]);
      setAccounts(accRes.data.data);
      setExpenses(expRes.data.data);
      setCategories(catRes.data.data);
      setTransactions(transRes.data.data); // <-- ASEGÚRATE DE QUE ESTÉ
    } catch (error) {
      console.error('Error fetching treasury data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createExpense = async (data: any) => {
    try {
      const response = await axios.post('/treasury/expenses', data);
      setExpenses((prev) => [response.data.data, ...prev]);
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === data.accountId ? { ...acc, balance: acc.balance - data.amount } : acc
        )
      );
      fetchData(); // Volvemos a fetch para que la nueva transacción aparezca
      toast.success('Gasto registrado');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar gasto');
      return false;
    }
  };

  const createAccount = async (name: string, type: string, initialBalance: number) => {
    try {
      const response = await axios.post('/treasury/accounts', { name, type, initialBalance });
      setAccounts((prev) => [...prev, response.data.data]);
      toast.success('Cuenta creada');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cuenta');
      return false;
    }
  };

  const createCategory = async (name: string) => {
    try {
      const response = await axios.post('/treasury/expenses/categories', { name });
      setCategories((prev) => [...prev, response.data.data]);
      toast.success('Categoría creada');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear categoría');
      return false;
    }
  };
  // Añade esta función antes del return:
  const createTransaction = async (data: {
    accountId: string;
    amount: number;
    type: string;
    concept: string;
  }) => {
    try {
      await axios.post('/treasury/transactions', data);
      // Actualizamos el saldo de la cuenta en el estado local
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === data.accountId
            ? {
                ...acc,
                balance:
                  data.type === 'DEPOSIT' ? acc.balance + data.amount : acc.balance - data.amount,
              }
            : acc
        )
      );
      fetchData(); // Refrescar historial de transacciones
      toast.success('Movimiento registrado correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar movimiento');
      return false;
    }
  };

  return {
    accounts,
    expenses,
    categories,
    transactions,
    loading,
    createExpense,
    createAccount,
    createCategory,
    createTransaction,
  };
};
