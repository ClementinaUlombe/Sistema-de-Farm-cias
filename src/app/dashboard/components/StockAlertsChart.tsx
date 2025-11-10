'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper, useTheme, Grid } from '@mui/material';

interface Product {
  id: string; // Add id to Product interface
  name: string;
  stockQuantity: number;
  minStockQuantity: number;
  expiryDate: string;
}

interface LowStockData {
  name: string;
  Quantidade: number;
}

interface NearExpiryData {
  name: string;
  'Dias para Expirar': number;
}

interface MostSoldData {
  name: string;
  'Quantidade Vendida': number;
}

interface StockMovementData {
  name: string;
  'Mudança Líquida': number;
}

interface SalesByCategoryData {
  name: string;
  'Total de Vendas': number;
}


const StockAlertsChart = () => {
  const [lowStockData, setLowStockData] = useState<LowStockData[]>([]);
  const [nearExpiryData, setNearExpiryData] = useState<NearExpiryData[]>([]);
  const [mostSoldProductsData, setMostSoldProductsData] = useState<MostSoldData[]>([]);
  const [recentStockMovementsData, setRecentStockMovementsData] = useState<StockMovementData[]>([]);
  const [salesByCategoryData, setSalesByCategoryData] = useState<SalesByCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Stock Alerts (Low Stock and Near Expiry)
        const stockAlertsResponse = await fetch('/api/reports/stock-alerts');
        if (!stockAlertsResponse.ok) {
          throw new Error('Falha ao buscar os dados de alertas de stock.');
        }
        const stockAlertsJson: { lowStockProducts: Product[], nearExpiryProducts: Product[] } = await stockAlertsResponse.json();

        const lowStockChartData = stockAlertsJson.lowStockProducts.map(p => ({
          name: p.name,
          Quantidade: p.stockQuantity,
        }));

        const nearExpiryChartData = stockAlertsJson.nearExpiryProducts.map(p => {
          const expiryDate = new Date(p.expiryDate);
          const today = new Date();
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            name: p.name,
            'Dias para Expirar': diffDays,
          };
        });

        setLowStockData(lowStockChartData);
        setNearExpiryData(nearExpiryChartData);

        // Fetch Most Sold Products
        const mostSoldResponse = await fetch('/api/reports/most-sold-products');
        if (!mostSoldResponse.ok) {
          throw new Error('Falha ao buscar os produtos mais vendidos.');
        }
        const mostSoldJson: { name: string, quantitySold: number }[] = await mostSoldResponse.json();
        const mostSoldChartData = mostSoldJson.map(item => ({
          name: item.name,
          'Quantidade Vendida': item.quantitySold,
        }));
        setMostSoldProductsData(mostSoldChartData);

        // Fetch Recent Stock Movements
        const stockMovementsResponse = await fetch('/api/reports/recent-stock-movements');
        if (!stockMovementsResponse.ok) {
          throw new Error('Falha ao buscar as movimentações de stock recentes.');
        }
        const stockMovementsJson: { name: string, netChange: number }[] = await stockMovementsResponse.json();
        const stockMovementsChartData = stockMovementsJson.map(item => ({
          name: item.name,
          'Mudança Líquida': item.netChange,
        }));
        setRecentStockMovementsData(stockMovementsChartData);

        // Fetch Sales by Category
        const salesByCategoryResponse = await fetch('/api/reports/sales-by-category');
        if (!salesByCategoryResponse.ok) {
            throw new Error('Falha ao buscar vendas por categoria.');
        }
        const salesByCategoryJson: { name: string, 'Total de Vendas': number }[] = await salesByCategoryResponse.json();
        setSalesByCategoryData(salesByCategoryJson);


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

  return (
    <Paper elevation={3} sx={{ padding: '20px', width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', marginBottom: '20px' }}>
        Alertas e Relatórios de Stock
      </Typography>
      <Grid container spacing={6} justifyContent="center">
        {/* Produtos com Stock Baixo */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Produtos com Stock Baixo
          </Typography>
          {lowStockData.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Quantidade" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1">Não há produtos com stock baixo.</Typography>
            </Box>
          )}
        </Grid>

        {/* Produtos Próximos da Validade */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Produtos Próximos da Validade
          </Typography>
          {nearExpiryData.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nearExpiryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Dias para Expirar" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1">Não há produtos próximos da validade.</Typography>
            </Box>
          )}
        </Grid>

        {/* Produtos Mais Vendidos */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Produtos Mais Vendidos (Top 5)
          </Typography>
          {mostSoldProductsData.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostSoldProductsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Quantidade Vendida" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1">Não há dados de produtos mais vendidos.</Typography>
            </Box>
          )}
        </Grid>

        {/* Movimentações de Stock Recentes */}
        <Grid item xs={12} md={6} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Movimentações de Stock Recentes (Últimos 30 Dias)
          </Typography>
          {recentStockMovementsData.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentStockMovementsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Mudança Líquida" fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1">Não há movimentações de stock recentes.</Typography>
            </Box>
          )}
        </Grid>

         {/* Vendas por Categoria */}
         <Grid item xs={12} md={12}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Vendas por Categoria (Top 5)
          </Typography>
          {salesByCategoryData.length > 0 ? (
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCategoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Total de Vendas" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1">Não há dados de vendas por categoria.</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StockAlertsChart;