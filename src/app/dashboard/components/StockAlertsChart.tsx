'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper, useTheme } from '@mui/material';

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
  <div className="bg-white shadow-md rounded-lg p-5 lg:p-10 w-full">
  <h2 className="text-xl sm:text-2xl font-semibold text-center mb-5">
    Alertas e Relatórios de Stock
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">

    {/* Produtos com Stock Baixo */}
    <div className="flex flex-col items-center w-full">
      <h3 className="text-lg font-medium text-center mb-2">Produtos com Stock Baixo</h3>
      {lowStockData.length > 0 ? (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lowStockData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
              <YAxis stroke="#666" tick={{ fill: '#666' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Quantidade" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex justify-center items-center">
          <p>Não há produtos com stock baixo.</p>
        </div>
      )}
    </div>

    {/* Produtos Próximos da Validade */}
    <div className="flex flex-col items-center w-full">
      <h3 className="text-lg font-medium text-center mb-2">Produtos Próximos da Validade</h3>
      {nearExpiryData.length > 0 ? (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nearExpiryData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
              <YAxis stroke="#666" tick={{ fill: '#666' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Dias para Expirar" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex justify-center items-center">
          <p>Não há produtos próximos da validade.</p>
        </div>
      )}
    </div>

    {/* Produtos Mais Vendidos */}
    <div className="flex flex-col items-center w-full">
      <h3 className="text-lg font-medium text-center mb-2">Produtos Mais Vendidos (Top 5)</h3>
      {mostSoldProductsData.length > 0 ? (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mostSoldProductsData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
              <YAxis stroke="#666" tick={{ fill: '#666' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Quantidade Vendida" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex justify-center items-center">
          <p>Não há dados de produtos mais vendidos.</p>
        </div>
      )}
    </div>

    {/* Movimentações de Stock Recentes */}
    <div className="flex flex-col items-center w-full mb-4">
      <h3 className="text-lg font-medium text-center mb-2">Movimentações de Stock Recentes (Últimos 30 Dias)</h3>
      {recentStockMovementsData.length > 0 ? (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentStockMovementsData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
              <YAxis stroke="#666" tick={{ fill: '#666' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Mudança Líquida" fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex justify-center items-center">
          <p>Não há movimentações de stock recentes.</p>
        </div>
      )}
    </div>

    {/* Vendas por Categoria */}
    <div className="flex flex-col items-center w-full">
      <h3 className="text-lg font-medium text-center mb-2">Vendas por Categoria (Top 5)</h3>
      {salesByCategoryData.length > 0 ? (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByCategoryData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666' }} />
              <YAxis stroke="#666" tick={{ fill: '#666' }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(86, 51, 202, 0.9)', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Total de Vendas" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex justify-center items-center">
          <p>Não há dados de vendas por categoria.</p>
        </div>
      )}
    </div>

  </div>
</div>

  );
};

export default StockAlertsChart;