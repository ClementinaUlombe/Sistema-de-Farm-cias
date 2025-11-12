'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container, Box, Typography, Button, CircularProgress, Grid, Paper, TextField, Autocomplete,
  List, ListItem, ListItemText, IconButton, Divider, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableRow, TableHead, TableContainer
} from '@mui/material';
import FeedbackModal from '../../components/FeedbackModal';
import BarcodeScanner from '../../components/BarcodeScanner';
import { AddCircleOutline, RemoveCircleOutline, Delete, Print, QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';
import { UserRole } from '@prisma/client';

// Types
interface Product { id: string; name: string; stockQuantity: number; sellingPrice: number; barcode: string | null; }
interface CartItem extends Product { quantity: number; }
interface LastSaleData { id: string; createdAt: string; total: number; discount: number; paymentMethod: string; attendant: { name: string }; items: { quantity: number; priceAtSale: number; product: { name: string } }[]; }

export default function SalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Page State

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackModalState, setFeedbackModalState] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [accessDeniedModalOpen, setAccessDeniedModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);


  // Sale State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState('0');

  // Receipt State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<LastSaleData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session.user?.role) {
      if (!([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(session.user.role as UserRole)) {
        setLoading(false);
        setAccessDeniedModalOpen(true);
        return;
      }
      fetch('/api/products').then(res => res.json()).then(setProducts).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0), [cart]);
  const total = useMemo(() => Math.max(0, subtotal - (parseFloat(discount) || 0)), [subtotal, discount]);

  const resetSale = () => {
    setCart([]);
    setDiscount('0');
    setPaymentMethod('dinheiro');
    setLastSale(null);
    setReceiptOpen(false);
    setAccessDeniedModalOpen(false);
    setFeedbackModalState({ open: false, message: '', severity: 'success' }); // Reset feedback modal
  };

  const handleScanSuccess = (decodedText: string) => {
    setScannerOpen(false);
    const product = products.find(p => p.barcode === decodedText);
    if (product) {
      addToCart(product);
      setFeedbackModalState({ open: true, message: `Produto ${product.name} adicionado ao carrinho.`, severity: 'success' });
    } else {
      setFeedbackModalState({ open: true, message: 'Produto não encontrado com este código de barras.', severity: 'error' });
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, amount: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0));
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const handleFinalizeSale = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, discount, paymentMethod }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao finalizar a venda');
      }
      const saleData = await res.json();
      setLastSale(saleData);
      setReceiptOpen(true);
      setFeedbackModalState({ open: true, message: 'Venda finalizada com sucesso!', severity: 'success' });
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (!([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(session?.user?.role as UserRole)) return (
    <FeedbackModal
      open={accessDeniedModalOpen}
      message="Acesso Negado. Você não tem permissão para acessar esta página."
      severity="error"
      onClose={() => router.push('/dashboard')}
    />
  );

 return (
  <>
    {/* Container principal */}
    <div className="max-w-full mt-4 mb-4 px-4 lg:max-w-6xl lg:mx-auto lg:translate-x-[-12%]">
      {/* ^ move ligeiramente para a esquerda apenas em telas grandes */}

      <Typography component="h1" variant="h4" gutterBottom>
        Ponto de Venda
      </Typography>

      {/* Conteúdo dividido em 2 colunas responsivas */}
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Lado esquerdo: pesquisa e carrinho */}
        <div className="w-full lg:w-2/3">
          <Paper className="p-4 shadow-md rounded-2xl">
            <Box className="flex gap-2 mb-4">
              <Autocomplete
                options={Array.isArray(products) ? products.filter((p) => p.stockQuantity > 0) : []}
                getOptionLabel={(o) => `${o.name} (Stock: ${o.stockQuantity})`}
                onChange={(e, val) => val && addToCart(val)}
                renderInput={(params) => <TextField {...params} label="Pesquisar Produto" />}
                sx={{ flexGrow: 1 }}
              />
              <IconButton color="primary" onClick={() => setScannerOpen(true)}>
                <QrCodeScannerIcon />
              </IconButton>
            </Box>

            <List sx={{ mt: 2 }}>
              {cart.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={item.name}
                    secondary={`Preço: ${item.sellingPrice.toFixed(2)} MT`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => updateQuantity(item.id, -1)}>
                      <RemoveCircleOutline />
                    </IconButton>
                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                    <IconButton
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stockQuantity}
                    >
                      <AddCircleOutline />
                    </IconButton>
                    <IconButton
                      onClick={() => removeFromCart(item.id)}
                      edge="end"
                      sx={{ ml: 2 }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
              {cart.length === 0 && (
                <Typography sx={{ p: 2, textAlign: 'center' }}>Carrinho vazio</Typography>
              )}
            </List>
          </Paper>
        </div>

        {/* Lado direito: total e pagamento */}
        <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
          <Paper className="p-4 shadow-md rounded-2xl">
            <Typography variant="h5" gutterBottom>
              Total da Venda
            </Typography>
            <Divider sx={{ my: 2 }} />

            <div className="my-2 text-right space-y-2">
              <div className="flex justify-between">
                <Typography>Subtotal:</Typography>
                <Typography>{subtotal.toFixed(2)} MT</Typography>
              </div>
              <div className="flex justify-between items-center">
                <Typography>Desconto:</Typography>
                <TextField
                  size="small"
                  variant="outlined"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  sx={{ input: { textAlign: 'right' } }}
                />
              </div>
            </div>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h3" align="center" sx={{ my: 3 }}>
              {total.toFixed(2)} MT
            </Typography>

            <FormControl fullWidth sx={{ my: 2 }}>
              <InputLabel>Método de Pagamento</InputLabel>
              <Select
                value={paymentMethod}
                label="Método de Pagamento"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                <MenuItem value="pos">POS</MenuItem>
                <MenuItem value="transferencia">Transferência</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || submitting}
            >
              {submitting ? <CircularProgress size={26} color="inherit" /> : 'Finalizar Venda'}
            </Button>
          </Paper>
        </div>
      </div>
    </div>

    {/* Modal do Recibo */}
    <Dialog open={receiptOpen} fullWidth maxWidth="sm">
      <DialogContent id="receipt-content">
        <Typography variant="h5" align="center" gutterBottom>
          Recibo
        </Typography>
        <Box sx={{ my: 2 }}>
          <Typography variant="body2">ID da Venda: {lastSale?.id}</Typography>
          <Typography variant="body2">
            Data: {lastSale && new Date(lastSale.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2">Atendente: {lastSale?.attendant.name}</Typography>
        </Box>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qtd</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lastSale?.items.map((item) => (
                <TableRow key={item.product.name}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.priceAtSale.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {(item.quantity * item.priceAtSale).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right">
                  Subtotal
                </TableCell>
                <TableCell align="right">
                  {lastSale && (lastSale.total + lastSale.discount).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right">
                  Desconto
                </TableCell>
                <TableCell align="right">- {lastSale?.discount.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} align="right">
                  <Typography variant="h6">Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">{lastSale?.total.toFixed(2)}</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Método de Pagamento: {lastSale?.paymentMethod}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ '@media print': { display: 'none' } }}>
        <Button onClick={() => window.print()} startIcon={<Print />}>
          Imprimir
        </Button>
        <Button onClick={resetSale} variant="contained">
          Nova Venda
        </Button>
      </DialogActions>
    </Dialog>

    {/* Scanner de código de barras */}
    <BarcodeScanner
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScanSuccess={handleScanSuccess}
      onScanError={(error) =>
        setFeedbackModalState({
          open: true,
          message: `Erro ao escanear: ${error}`,
          severity: 'error',
        })
      }
    />
  </>
);

}