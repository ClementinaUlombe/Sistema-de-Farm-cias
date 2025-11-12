'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper,  useTheme } from '@mui/material';
import AnimatedNumber from './AnimatedNumber';

interface ChartData {
  name: string;
  sales: number;
  profit: number;
}

// Formata os números para o formato de moeda Kwanza Angolano (AOA)
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

// Componente de Tooltip Customizado
const CustomTooltip = ({ active, payload, label }: any) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ padding: '10px', backgroundColor: 'rgba(86, 51, 202, 0.9)' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>{`Mês: ${label}`}</Typography>
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {`Vendas: ${formatCurrency(payload[0].value)}`}
        </Typography>
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {`Lucro: ${formatCurrency(payload[1].value)}`}
        </Typography>
      </Paper>
    );
  }
  return null;
};

const SalesChart = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sales');
        if (!response.ok) {
          throw new Error('Falha ao buscar os dados de vendas.');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: 400 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (data.length === 0) {
    return (
      <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6">Não há dados de vendas para exibir.</Typography>
      </Box>
    );
  }

  const totalSales = data.reduce((acc, item) => acc + item.sales, 0);
  const totalProfit = data.reduce((acc, item) => acc + item.profit, 0);

  return (
    <Paper elevation={3} sx={{ padding: { xs: '20px', lg: '10px' }, width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', marginBottom: '10px' }}>
        Análise de Vendas e Lucros
      </Typography>
      
      <div className="grid grid-cols-2 gap-4 mb-5 text-center justify-center">
  {/* Vendas Totais */}
  <div className="col-span-1">
    <Typography variant="h6" color="textSecondary">
      Vendas Totais
    </Typography>
    <Typography
      variant="h4"
      sx={{
        color: theme.palette.secondary.main,
        fontWeight: 'bold',
        fontSize: { xs: '1rem', sm: '2.125rem' },
      }}
      className="font-bold text-gray-800 text-lg sm:text-2xl"
    >
      <AnimatedNumber value={totalSales} formatter={formatCurrency} />
    </Typography>
  </div>

  {/* Lucro Total */}
  <div className="col-span-1">
    <Typography variant="h6" color="textSecondary">
      Lucro Total
    </Typography>
          <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', fontSize: { xs: '1rem', sm: '2.125rem' } }}>
            <AnimatedNumber value={totalProfit} formatter={formatCurrency} />
          </Typography>
  </div>
</div>


      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
            <YAxis 
              stroke="#666" 
              tick={{ fill: '#666' }} 
              tickFormatter={(value) => new Intl.NumberFormat('pt-AO', { 
                notation: 'compact', 
                compactDisplay: 'short' 
              }).format(value as number)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="sales" name="Vendas" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} isAnimationActive={true} />
            <Bar dataKey="profit" name="Lucro" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SalesChart;
