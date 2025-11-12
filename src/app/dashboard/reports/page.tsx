'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Container, Box, Typography, CircularProgress, Alert, Paper,
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
 <Container
      component="main"
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        // em telas grandes, move ligeiramente à esquerda
        '@media (min-width: 1024px)': { transform: 'translateX(-12%)' },
      }}
    >      <Typography component="h1" variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Central de Relatórios</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography component="h2" variant="h5" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Relatórios Gerais e de Auditoria</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Link href="/dashboard/reports/sales" passHref>
            <Button variant="contained">Relatório de Vendas</Button>
          </Link>
          <Link href="/dashboard/reports/stock-history" passHref>
            <Button variant="contained" color="secondary">Histórico de Stock</Button>
          </Link>
        </Stack>
      </Paper>

      <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Relatórios de Alertas</Typography>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* Low Stock Report */}
  <div className="bg-white shadow-md rounded-lg overflow-x-auto">
    <h3 className="text-lg font-medium p-4 border-b">Produtos com Stock Baixo</h3>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Produto</th>
          <th className="px-2 py-2 text-right text-sm font-medium text-gray-700">Stock Atual</th>
          <th className="px-2 py-2 text-right text-sm font-medium text-gray-700">Stock Mínimo</th>
        </tr>
      </thead>
      <tbody>
        {lowStock.length > 0 ? (
          lowStock.map(p => (
            <tr key={p.id} className="bg-red-50">
              <td className="px-2 py-2">{p.name}</td>
              <td className="px-2 py-2 text-right">{p.stockQuantity}</td>
              <td className="px-2 py-2 text-right">{p.minStockQuantity}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-2 py-4 text-center text-gray-500">Nenhum produto com stock baixo.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Near Expiry Report */}
  <div className="bg-white shadow-md rounded-lg overflow-x-auto">
    <h3 className="text-lg font-medium p-4 border-b">Produtos Próximos da Validade</h3>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Produto</th>
          <th className="px-2 py-2 text-left text-sm font-medium text-gray-700">Data de Validade</th>
          <th className="px-2 py-2 text-right text-sm font-medium text-gray-700">Stock</th>
        </tr>
      </thead>
      <tbody>
        {nearExpiry.length > 0 ? (
          nearExpiry.map(p => (
            <tr key={p.id} className="bg-orange-50">
              <td className="px-2 py-2">{p.name}</td>
              <td className="px-2 py-2">{new Date(p.expiryDate).toLocaleDateString()}</td>
              <td className="px-2 py-2 text-right">{p.stockQuantity}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-2 py-4 text-center text-gray-500">Nenhum produto próximo da validade.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

</div>

    </Container>
  );
}
