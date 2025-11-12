'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { UserRole } from '@prisma/client';

interface MyReportData {
  totalSalesValue: number;
  saleCount: number;
  detailedSales: any[];
}

export default function MyReportPage() {
  const { data: session, status } = useSession();
  const [reportData, setReportData] = useState<MyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });

  useEffect(() => {
    generateReport();
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const url = `/api/reports/my-sales?from=${dates.from}&to=${dates.to}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao gerar relatório');
      setReportData(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const userRole = session?.user?.role as UserRole;

  if (status === 'loading')
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );

  if (!([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(userRole))
    return (
      <Container className="mt-4">
        <Alert severity="error">Acesso Negado.</Alert>
      </Container>
    );


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
  >
    <div className="lg:max-w-screen-lg lg:mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 dark:text-gray-100">Os Meus Relatórios de Vendas</h1>

      {/* Filtros */}
      <Paper elevation={3} className="shadow-md rounded-lg p-5 mb-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5">
            <label htmlFor="from" className="block text-sm font-medium mb-1 dark:text-gray-100">De</label>
            <input
              type="date"
              id="from"
              name="from"
              value={dates.from}
              onChange={handleDateChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="sm:col-span-5">
            <label htmlFor="to" className="block text-sm font-medium mb-1 dark:text-gray-100">Até</label>
            <input
              type="date"
              id="to"
              name="to"
              value={dates.to}
              onChange={handleDateChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>
          <div className="w-full sm:w-2/12 px-2">
            <Button 
              variant="contained" 
              onClick={generateReport}
              disabled={loading}
              className={`w-full p-2 rounded-md text-white font-medium ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Gerando...' : 'Gerar'}
            </Button>
          </div>
        </div>
      </Paper>

      {/* Mensagem de erro */}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center my-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
      )}

      {/* Relatórios */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <Paper elevation={3} className="shadow-md rounded-lg p-5 text-center">
              <h3 className="text-lg font-medium mb-2 dark:text-gray-100">Total Vendido</h3>
              <p className="text-2xl sm:text-3xl font-bold dark:text-gray-100">{reportData.totalSalesValue.toFixed(2)} MT</p>
            </Paper>
            <Paper elevation={3} className="shadow-md rounded-lg p-5 text-center">
              <h3 className="text-lg font-medium mb-2 dark:text-gray-100">Nº de Vendas</h3>
              <p className="text-2xl sm:text-3xl font-bold dark:text-gray-100">{reportData.saleCount}</p>
            </Paper>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold mb-3 dark:text-gray-100">Minhas Vendas Detalhadas</h2>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className="px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">Data</TableCell>
                  <TableCell className="hidden sm:table-cell px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">Nº Itens</TableCell>
                  <TableCell className="hidden sm:table-cell px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">Método Pag.</TableCell>
                  <TableCell className="px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.detailedSales.map(sale => (
                                    <TableRow key={sale.id}>
                                      <TableCell className="px-0.5 py-1 sm:p-2 text-xs sm:text-base truncate dark:text-gray-100">{new Date(sale.createdAt).toLocaleString()}</TableCell><TableCell className="hidden sm:table-cell px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">{sale.itemCount}</TableCell><TableCell className="hidden sm:table-cell px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">{sale.paymentMethod}</TableCell><TableCell className="px-0.5 py-1 sm:p-2 text-xs sm:text-base dark:text-gray-100">{sale.total.toFixed(2)}</TableCell>                                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  </Container>
);

}
