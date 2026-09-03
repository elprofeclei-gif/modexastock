import { useState, useEffect } from 'react';
import axios from '../api/axios';

export interface CashierData {
  name: string;
  totalSales: number;
  cashInDrawer: number;
  startTime: string;
}

export interface TopProduct {
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface LowStockVariant {
  id: string;
  name: string;
  size: string;
  color: string;
  stock: number;
  severity: 'critical' | 'low';
}

// ✅ NUEVA INTERFAZ PARA LA GRÁFICA
export interface SalesByDay {
  date: string;
  total: number;
}

export interface DashboardStats {
  todaySalesTotal: number;
  todaySalesCount: number;
  salesVariation: number;
  avgTicket: number;
  openCashRegister: number;
  bankBalance: number;
  todayExpenses: number;
  todayCOGS?: number;
  netProfit?: number;
  voidedSalesToday?: number;

  totalProducts: number;
  totalVariants: number;
  totalStockUnits: number;
  inventoryValue: number;
  accountsReceivable: number;
  accountsPayable?: number;
  totalClients: number;
  activeCashiers: number;

  cashiersData: CashierData[];
  topProducts: TopProduct[];
  salesByDay: SalesByDay[];

  lowStockVariants: LowStockVariant[];
  criticalCount: number;
  lowCount: number;
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
