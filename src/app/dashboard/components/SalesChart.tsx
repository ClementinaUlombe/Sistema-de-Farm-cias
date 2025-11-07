'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper, Grid } from '@mui/material';
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
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ padding: '10px', backgroundColor: 'rgba(17, 215, 241, 0.9)' }}>
        <Typography variant="subtitle2" gutterBottom>{`Mês: ${label}`}</Typography>
        <Typography variant="body2" sx={{ color: '#2196f3' }}>
          {`Vendas: ${formatCurrency(payload[0].value)}`}
        </Typography>
        <Typography variant="body2" sx={{ color: '#4caf50' }}>
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
    <Paper elevation={3} sx={{ padding: '20px', width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', marginBottom: '10px' }}>
        Análise de Vendas e Lucros
      </Typography>
      
      <Grid container spacing={2} sx={{ marginBottom: '20px', textAlign: 'center' }}>
        <Grid item xs={6}>
          <Typography variant="h6" color="textSecondary">Vendas Totais</Typography>
          <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
            <AnimatedNumber value={totalSales} formatter={formatCurrency} />
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6" color="textSecondary">Lucro Total</Typography>
          <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
            <AnimatedNumber value={totalProfit} formatter={formatCurrency} />
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Bar dataKey="sales" name="Vendas" fill="#2196f3" radius={[4, 4, 0, 0]} isAnimationActive={true} />
            <Bar dataKey="profit" name="Lucro" fill="#4caf50" radius={[4, 4, 0, 0]} isAnimationActive={true} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SalesChart;
