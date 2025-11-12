'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Container, Box, Typography, CircularProgress, Alert, Paper, TextField, Button, Autocomplete
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

  // Generate report on initial load
  useEffect(() => {
    generateReport();
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
  if (!([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(userRole)) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

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
    >      <Typography component="h1" variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Histórico de Movimentação de Stock</Typography>
      
     <Paper className="p-4 mb-6">
  <div className="flex flex-wrap -mx-2 items-center">
    <div className="w-full sm:w-3/12 px-2 mb-2 sm:mb-0">
      <TextField 
        name="from" 
        label="De" 
        type="date" 
        value={filters.from} 
        onChange={handleFilterChange} 
        fullWidth 
        InputLabelProps={{ shrink: true }} 
      />
    </div>
    <div className="w-full sm:w-3/12 px-2 mb-2 sm:mb-0">
      <TextField 
        name="to" 
        label="Até" 
        type="date" 
        value={filters.to} 
        onChange={handleFilterChange} 
        fullWidth 
        InputLabelProps={{ shrink: true }} 
      />
    </div>
    <div className="w-full sm:w-4/12 px-2 mb-2 sm:mb-0">
      <Autocomplete
        options={products}
        getOptionLabel={(option) => option.name}
        onChange={handleProductChange}
        renderInput={(params) => <TextField {...params} label="Filtrar por Produto" />}
      />
    </div>
    <div className="w-full sm:w-2/12 px-2">
      <Button 
        variant="contained" 
        onClick={generateReport} 
        disabled={loading} 
        fullWidth
      >
        {loading ? 'Gerando...' : 'Gerar'}
      </Button>
    </div>
  </div>
</Paper>


      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell sx={{ p: { xs: 1, sm: 2 } }}>Data</TableCell><TableCell sx={{ p: { xs: 1, sm: 2 } }}>Produto</TableCell><TableCell sx={{ p: { xs: 1, sm: 2 } }}>Alteração</TableCell><TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Motivo</TableCell><TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Utilizador</TableCell></TableRow></TableHead>
          <TableBody>
            {movements.map(mov => (
              <TableRow key={mov.id}>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{new Date(mov.createdAt).toLocaleString()}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{mov.product.name}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, color: mov.quantityChange > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{mov.reason}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{mov.user.name}</TableCell>
              </TableRow>
            ))}
            {movements.length === 0 && !loading && <TableRow><TableCell colSpan={5} align="center">Nenhum movimento encontrado para os filtros selecionados.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
