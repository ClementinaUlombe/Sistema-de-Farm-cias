'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Container, Box, Typography, CircularProgress, Alert, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
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

  // Generate report on initial load
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
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const userRole = session?.user?.role as UserRole;

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(userRole)) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>Os Meus Relatórios de Vendas</Typography>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 5 }}><TextField name="from" label="De" type="date" value={dates.from} onChange={handleDateChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 5 }}><TextField name="to" label="Até" type="date" value={dates.to} onChange={handleDateChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 2 }}><Button variant="contained" onClick={generateReport} disabled={loading} fullWidth>{loading ? 'Gerando...' : 'Gerar'}</Button></Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      {reportData && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">Total Vendido</Typography><Typography variant="h4">{reportData.totalSalesValue.toFixed(2)} MT</Typography></Paper></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">Nº de Vendas</Typography><Typography variant="h4">{reportData.saleCount}</Typography></Paper></Grid>
          </Grid>

          <Typography component="h2" variant="h5" gutterBottom>Minhas Vendas Detalhadas</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Nº Itens</TableCell><TableCell>Método Pag.</TableCell><TableCell>Total</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.detailedSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{sale.itemCount}</TableCell>
                    <TableCell>{sale.paymentMethod}</TableCell>
                    <TableCell>{sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
}
