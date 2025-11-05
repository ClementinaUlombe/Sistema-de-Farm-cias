'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Container, Box, Typography, CircularProgress, Alert, Grid, Paper, TextField, Button,
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const url = `/api/reports/sales?from=${dates.from}&to=${dates.to}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao gerar relatório');
      setReportData(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>Relatório de Vendas</Typography>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}><TextField name="from" label="De" type="date" value={dates.from} onChange={handleDateChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={5}><TextField name="to" label="Até" type="date" value={dates.to} onChange={handleDateChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={2}><Button variant="contained" onClick={generateReport} disabled={loading} fullWidth>{loading ? 'Gerando...' : 'Gerar'}</Button></Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      {reportData && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">Total de Vendas</Typography><Typography variant="h4">{reportData.totalSalesValue.toFixed(2)} MT</Typography></Paper></Grid>
            <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">Lucro Bruto</Typography><Typography variant="h4">{reportData.totalProfit.toFixed(2)} MT</Typography></Paper></Grid>
            <Grid item xs={12} sm={4}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">Nº de Vendas</Typography><Typography variant="h4">{reportData.saleCount}</Typography></Paper></Grid>
          </Grid>

          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              <Typography component="h2" variant="h5" gutterBottom>Vendas Detalhadas</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Atendente</TableCell><TableCell>Itens</TableCell><TableCell>Total</TableCell><TableCell>Lucro</TableCell></TableRow></TableHead>
                  <TableBody>
                    {reportData.detailedSales.map(sale => (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{sale.attendantName}</TableCell>
                        <TableCell>{sale.itemCount}</TableCell>
                        <TableCell>{sale.total.toFixed(2)}</TableCell>
                        <TableCell>{sale.profit.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography component="h2" variant="h5" gutterBottom>Vendas por Funcionário</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Funcionário</TableCell><TableCell>Nº Vendas</TableCell><TableCell>Valor Total</TableCell></TableRow></TableHead>
                  <TableBody>
                    {Object.entries(reportData.salesByEmployee).map(([name, data]) => (
                      <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{data.count}</TableCell>
                        <TableCell>{data.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
}
