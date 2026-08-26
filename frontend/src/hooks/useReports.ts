import { useState, useEffect } from 'react';
import axios from '../api/axios';

export interface CashierData {
  name: string;
  totalSales: number;
  cashInDrawer: number;
}

export interface DashboardStats {
  todaySalesTotal: number;
  todaySalesCount: number;
  openCashRegister: number;
  bankBalance: number;
  inventoryValue: number;
  lowStockVariants: number;
  cashiersData: CashierData[];
  totalProducts: number;
  totalClients: number;
  accountsReceivable: number;
  todayExpenses: number;
  activeCashiers: number; // AÑADIDO
  totalUsers: number;     // AÑADIDO
}

export const useReports = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/reports/dashboard');
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};