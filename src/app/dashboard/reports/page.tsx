'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Container, Box, Typography, CircularProgress, Alert, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Stack
} from '@mui/material';
import { UserRole } from '@prisma/client';

interface ProductReportItem {
  id: string;
  name: string;
  stockQuantity: number;
  minStockQuantity: number;
  expiryDate: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lowStock, setLowStock] = useState<ProductReportItem[]>([]);
  const [nearExpiry, setNearExpiry] = useState<ProductReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      if (session.user?.role !== UserRole.ADMIN) {
        setLoading(false);
        return;
      }
      fetch('/api/reports/stock-alerts')
        .then(async res => {
          if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar relatórios');
          return res.json();
        })
        .then(data => {
          setLowStock(data.lowStockProducts);
          setNearExpiry(data.nearExpiryProducts);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [status, session, router]);

  if (loading || status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado. Apenas Administradores podem ver esta página.</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>Central de Relatórios</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography component="h2" variant="h5" gutterBottom>Relatórios Gerais e de Auditoria</Typography>
        <Stack direction="row" spacing={2}>
          <Link href="/dashboard/reports/sales" passHref>
            <Button variant="contained">Relatório de Vendas</Button>
          </Link>
          <Link href="/dashboard/reports/stock-history" passHref>
            <Button variant="contained" color="secondary">Histórico de Stock</Button>
          </Link>
        </Stack>
      </Paper>

      <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4 }}>Relatórios de Alertas</Typography>
      <Grid container spacing={4} sx={{ mt: 1 }}>
        {/* Low Stock Report */}
        <Grid item xs={12} md={6}>
          <Typography component="h3" variant="h6" gutterBottom>Produtos com Stock Baixo</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Produto</TableCell><TableCell align="right">Stock Atual</TableCell><TableCell align="right">Stock Mínimo</TableCell></TableRow></TableHead>
              <TableBody>
                {lowStock.length > 0 ? lowStock.map(p => (
                  <TableRow key={p.id} sx={{ backgroundColor: 'rgba(255, 0, 0, 0.05)' }}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell align="right">{p.stockQuantity}</TableCell>
                    <TableCell align="right">{p.minStockQuantity}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} align="center">Nenhum produto com stock baixo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Near Expiry Report */}
        <Grid item xs={12} md={6}>
          <Typography component="h3" variant="h6" gutterBottom>Produtos Próximos da Validade</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Produto</TableCell><TableCell>Data de Validade</TableCell><TableCell align="right">Stock</TableCell></TableRow></TableHead>
              <TableBody>
                {nearExpiry.length > 0 ? nearExpiry.map(p => (
                  <TableRow key={p.id} sx={{ backgroundColor: 'rgba(255, 165, 0, 0.05)' }}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{new Date(p.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{p.stockQuantity}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} align="center">Nenhum produto próximo da validade.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}
