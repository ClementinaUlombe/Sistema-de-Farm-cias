'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Container, Box, Typography, CircularProgress, Alert, Grid, Paper, TextField, Button, Autocomplete
  , Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { UserRole } from '@prisma/client';

interface Movement {
  id: string;
  createdAt: string;
  quantityChange: number;
  reason: string;
  product: { name: string };
  user: { name: string };
}

interface Product {
  id: string;
  name: string;
}

export default function StockHistoryPage() {
  const { data: session, status } = useSession();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', productId: '' });

  // Fetch products for the filter dropdown
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProductChange = (event: any, newValue: Product | null) => {
    setFilters(prev => ({ ...prev, productId: newValue ? newValue.id : '' }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        productId: filters.productId,
      });
      const res = await fetch(`/api/reports/stock-movements?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao gerar relatório');
      setMovements(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const userRole = session?.user?.role as UserRole;

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (![UserRole.ADMIN, UserRole.STOCKIST].includes(userRole)) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>Histórico de Movimentação de Stock</Typography>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}><TextField name="from" label="De" type="date" value={filters.from} onChange={handleFilterChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField name="to" label="Até" type="date" value={filters.to} onChange={handleFilterChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.name}
              onChange={handleProductChange}
              renderInput={(params) => <TextField {...params} label="Filtrar por Produto" />}
            />
          </Grid>
          <Grid item xs={12} sm={2}><Button variant="contained" onClick={generateReport} disabled={loading} fullWidth>{loading ? 'Gerando...' : 'Gerar'}</Button></Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Produto</TableCell><TableCell>Alteração</TableCell><TableCell>Motivo</TableCell><TableCell>Utilizador</TableCell></TableRow></TableHead>
          <TableBody>
            {movements.map(mov => (
              <TableRow key={mov.id}>
                <TableCell>{new Date(mov.createdAt).toLocaleString()}</TableCell>
                <TableCell>{mov.product.name}</TableCell>
                <TableCell sx={{ color: mov.quantityChange > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                </TableCell>
                <TableCell>{mov.reason}</TableCell>
                <TableCell>{mov.user.name}</TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && !loading && <TableRow><TableCell colSpan={5} align="center">Nenhum movimento encontrado para os filtros selecionados.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
