'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Container, Box, Typography, CircularProgress, Alert,  Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { UserRole } from '@prisma/client';

interface ReportData {
  totalSalesValue: number;
  totalProfit: number;
  saleCount: number;
  salesByEmployee: { [key: string]: { total: number, count: number } };
  detailedSales: any[];
}

export default function SalesReportPage() {
  const { data: session, status } = useSession();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === UserRole.ADMIN) {
      generateReport();
    }
  }, [status, session]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const params = new URLSearchParams();
      if (dates.from) params.append('from', dates.from);
      if (dates.to) params.append('to', dates.to);
      const queryString = params.toString();
      const url = `/api/reports/sales${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao gerar relatório');
      setReportData(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

  return (
 <Container
      component="main"
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        // em telas grandes, move ligeiramente à esquerda
        '@media (min-width: 1024px)': { transform: 'translateX(-12%)' },
      }}
    >      <Typography component="h1" variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Relatório de Vendas</Typography>
      
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 w-full">
  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
    {/* Campo "De" */}
    <div className="sm:col-span-5">
      <label htmlFor="from" className="block text-sm font-medium mb-1">De</label>
      <input
        type="date"
        id="from"
        name="from"
        value={dates.from}
        onChange={handleDateChange}
        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    {/* Campo "Até" */}
    <div className="sm:col-span-5">
      <label htmlFor="to" className="block text-sm font-medium mb-1">Até</label>
      <input
        type="date"
        id="to"
        name="to"
        value={dates.to}
        onChange={handleDateChange}
        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    {/* Botão "Gerar" */}
 <div className="w-full sm:w-2/12 px-2">
      <Button 
          variant="contained" 

    onClick={generateReport}
    disabled={loading}
    className={`w-full p-2 rounded-md text-white font-medium shadow-md transition duration-200 ${
      loading
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-[#43a047] hover:bg-[#388e3c]'
    }`}
  >
    {loading ? 'Gerando...' : 'Gerar'}
      </Button>
</div>


  </div>
</div>


      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      {reportData && (
       <div className="w-full">
  {/* Cards Resumo */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div className="bg-white shadow-md rounded-lg p-4 text-center">
      <h3 className="text-lg font-medium mb-2">Total de Vendas</h3>
      <p className="text-2xl sm:text-3xl font-bold">{reportData.totalSalesValue.toFixed(2)} MT</p>
    </div>
    <div className="bg-white shadow-md rounded-lg p-4 text-center">
      <h3 className="text-lg font-medium mb-2">Lucro Bruto</h3>
      <p className="text-2xl sm:text-3xl font-bold">{reportData.totalProfit.toFixed(2)} MT</p>
    </div>
    <div className="bg-white shadow-md rounded-lg p-4 text-center">
      <h3 className="text-lg font-medium mb-2">Nº de Vendas</h3>
      <p className="text-2xl sm:text-3xl font-bold">{reportData.saleCount}</p>
    </div>
  </div>

  {/* Vendas Detalhadas e por Funcionário */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Vendas Detalhadas */}
    <div className="lg:col-span-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Vendas Detalhadas</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 sm:p-4 text-left">Data</th>
              <th className="p-2 sm:p-4 text-left hidden sm:table-cell">Atendente</th>
              <th className="p-2 sm:p-4 text-left hidden sm:table-cell">Itens</th>
              <th className="p-2 sm:p-4 text-left">Total</th>
              <th className="p-2 sm:p-4 text-left hidden sm:table-cell">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {reportData.detailedSales.map((sale) => (
              <tr key={sale.id} className="border-b last:border-0">
                <td className="p-2 sm:p-4">{new Date(sale.createdAt).toLocaleString()}</td>
                <td className="p-2 sm:p-4 hidden sm:table-cell">{sale.attendantName}</td>
                <td className="p-2 sm:p-4 hidden sm:table-cell">{sale.itemCount}</td>
                <td className="p-2 sm:p-4">{sale.total.toFixed(2)}</td>
                <td className="p-2 sm:p-4 hidden sm:table-cell">{sale.profit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Vendas por Funcionário */}
    <div className="lg:col-span-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-2">Vendas por Funcionário</h2>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 sm:p-4 text-left">Funcionário</th>
              <th className="p-2 sm:p-4 text-left">Nº Vendas</th>
              <th className="p-2 sm:p-4 text-left hidden sm:table-cell">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(reportData.salesByEmployee).map(([name, data]) => (
              <tr key={name} className="border-b last:border-0">
                <td className="p-2 sm:p-4">{name}</td>
                <td className="p-2 sm:p-4">{data.count}</td>
                <td className="p-2 sm:p-4 hidden sm:table-cell">{data.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

      )}
    </Container>
  );
}
