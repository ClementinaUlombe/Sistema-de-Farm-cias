'use client';

import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

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
      <Paper elevation={3} sx={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="subtitle2" gutterBottom>{`Mês: ${label}`}</Typography>
        <Typography variant="body2" sx={{ color: '#0088FE' }}>
          {`Vendas: ${formatCurrency(payload[0].value)}`}
        </Typography>
        <Typography variant="body2" sx={{ color: '#FF8042' }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: 300 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (data.length === 0) {
    return (
      <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6">Não há dados de vendas para exibir.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', marginBottom: '20px' }}>
        Análise de Vendas e Lucros
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 40, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            stroke="#666" 
            tick={{ fill: '#666' }} 
          />
          <YAxis 
            stroke="#666" 
            tick={{ fill: '#666' }} 
            tickFormatter={(value) => new Intl.NumberFormat('pt-AO', { 
              notation: 'compact', 
              compactDisplay: 'short' 
            }).format(value as number)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
          />
          <Bar dataKey="sales" name="Vendas" fill="#0088FE" />
          <Line type="monotone" dataKey="profit" name="Lucro" stroke="#FF8042" strokeWidth={3} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SalesChart;
