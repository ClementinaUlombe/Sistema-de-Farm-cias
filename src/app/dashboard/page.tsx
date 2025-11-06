'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import SalesChart from './components/SalesChart';
import { UserRole } from '@prisma/client';

interface ChartData {
  name: string;
  sales: number;
  profit: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      setLoadingChart(true);
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);

      const url = `/api/reports/sales?from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.detailedSales) {
            const aggregatedData: { [key: string]: { sales: number, profit: number } } = {};

            data.detailedSales.forEach((sale: any) => {
              const date = new Date(sale.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
              if (!aggregatedData[date]) {
                aggregatedData[date] = { sales: 0, profit: 0 };
              }
              aggregatedData[date].sales += sale.total;
              aggregatedData[date].profit += sale.profit;
            });

            const sortedDates = Object.keys(aggregatedData).sort();

            const formattedData = sortedDates.map(date => {
              const [year, month, day] = date.split('-');
              return {
                name: `${day}/${month}`,
                sales: aggregatedData[date].sales,
                profit: aggregatedData[date].profit,
              };
            });

            setChartData(formattedData);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingChart(false));
    }
  }, [status, pathname]); // Using pathname to refetch on navigation

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'authenticated') {
    const userRole = session.user?.role as UserRole;

    return (
      <>
        <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
          Bem-vindo ao Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          Seu perfil é: {userRole}
        </Typography>
        {loadingChart ? <CircularProgress /> : <SalesChart data={chartData} />}
      </>
    );
  }

  return null;
}