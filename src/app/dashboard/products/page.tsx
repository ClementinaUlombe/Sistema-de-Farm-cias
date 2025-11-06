'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container, Box, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Grid,
  IconButton, Tooltip, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import FeedbackModal from '../../components/FeedbackModal'; // Import FeedbackModal
import BarcodeScanner from '../../components/BarcodeScanner';
import { Edit as EditIcon, Delete as DeleteIcon, QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';
import { UserRole } from '@prisma/client';

// Full product type to handle all fields
interface Product {
  id: string;
  name: string;
  category: string;
  dosage: string | null;
  manufacturer: string | null;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  stockQuantity: number;
  minStockQuantity: number;
  barcode: string | null;
}

const initialProductState = {
  name: '',
  category: '',
  dosage: '',
  manufacturer: '',
  purchasePrice: '0',
  sellingPrice: '0',
  expiryDate: '',
  stockQuantity: '0',
  minStockQuantity: '0',
  barcode: '',
};

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(''); // No longer needed if using feedbackModalState for errors

  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialProductState);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, productId: '' });
  const [feedbackModalState, setFeedbackModalState] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' }); // Replaced snackbar state
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar produtos');
      setProducts(await res.json());
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); // Use feedback modal for errors
    }
  }, [setFeedbackModalState]); // Add setFeedbackModalState to dependencies

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const userRole = session.user?.role as UserRole;
      if (![UserRole.ADMIN, UserRole.STOCKIST].includes(userRole)) {
        setLoading(false);
        // Display access denied modal
        setFeedbackModalState({
          open: true,
          message: 'Acesso Negado. Apenas Administradores e Stockistas podem ver esta página.',
          severity: 'error',
        });
        return;
      }
      fetchProducts().finally(() => setLoading(false));
    }
  }, [status, session, router, fetchProducts, setFeedbackModalState]); // Add setFeedbackModalState to dependencies

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormState({
        ...product,
        purchasePrice: String(product.purchasePrice),
        sellingPrice: String(product.sellingPrice),
        stockQuantity: String(product.stockQuantity),
        minStockQuantity: String(product.minStockQuantity),
        expiryDate: new Date(product.expiryDate).toISOString().split('T')[0],
        dosage: product.dosage || '',
        manufacturer: product.manufacturer || '',
        barcode: product.barcode || '',
      });
    } else {
      setEditingProduct(null);
      setFormState(initialProductState);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormState(initialProductState);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleScanSuccess = (decodedText: string) => {
    setFormState(prev => ({ ...prev, barcode: decodedText }));
    setScannerOpen(false);
    setFeedbackModalState({ open: true, message: 'Código de barras lido com sucesso!', severity: 'success' });
  };

  const handleSubmit = async () => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao salvar produto');
      }
      await fetchProducts();
      setFeedbackModalState({ open: true, message: `Produto ${editingProduct ? 'atualizado' : 'adicionado'} com sucesso!`, severity: 'success' }); // Use feedback modal for success
      handleCloseModal();
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); // Use feedback modal for errors
    }
  };

  const handleDeleteClick = (productId: string) => setDeleteConfirm({ open: true, productId });
  const handleDeleteCancel = () => setDeleteConfirm({ open: false, productId: '' });
  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/products/${deleteConfirm.productId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao apagar produto');
      }
      await fetchProducts();
      setFeedbackModalState({ open: true, message: 'Produto apagado com sucesso!', severity: 'success' }); // Use feedback modal for success
      handleDeleteCancel();
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); // Use feedback modal for errors
    }
  };

  if (loading || status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.STOCKIST) return (
    <FeedbackModal
      open={feedbackModalState.open} // Use feedbackModalState for access denied
      message="Acesso Negado. Apenas Administradores e Stockistas podem ver esta página."
      severity="error"
      onClose={() => router.push('/dashboard')}
    />
  );

  return (
    <Container component="main" maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography component="h1" variant="h4">Gestão de Produtos</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>Adicionar Novo Produto</Button>
      </Box>

      {/* Removed error Alert, now handled by FeedbackModal */}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Preço (MT)</TableCell>
              <TableCell>Data de Validade</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.stockQuantity}</TableCell>
                <TableCell>{product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell>{new Date(product.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar"><IconButton onClick={() => handleOpenModal(product)}><EditIcon /></IconButton></Tooltip>
                  <Tooltip title="Apagar"><IconButton onClick={() => handleDeleteClick(product.id)}><DeleteIcon /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Product Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField label="Nome do Produto" name="name" value={formState.name} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Categoria" name="category" value={formState.category} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Dosagem" name="dosage" value={formState.dosage} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Fabricante" name="manufacturer" value={formState.manufacturer} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Preço de Compra" name="purchasePrice" type="number" value={formState.purchasePrice} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Preço de Venda" name="sellingPrice" type="number" value={formState.sellingPrice} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Quantidade em Stock" name="stockQuantity" type="number" value={formState.stockQuantity} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Stock Mínimo" name="minStockQuantity" type="number" value={formState.minStockQuantity} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Data de Validade" name="expiryDate" type="date" value={formState.expiryDate} onChange={handleInputChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField label="Código de Barras (Opcional)" name="barcode" value={formState.barcode} onChange={handleInputChange} fullWidth />
                <Tooltip title="Escanear Código de Barras">
                  <IconButton color="primary" onClick={() => setScannerOpen(true)}>
                    <QrCodeScannerIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={(error) => setFeedbackModalState({ open: true, message: `Erro ao escanear: ${error}`, severity: 'error' })}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent><Typography>Tem a certeza que deseja apagar este produto? Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">Apagar</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Modal */}
      <FeedbackModal
        open={feedbackModalState.open}
        message={feedbackModalState.message}
        severity={feedbackModalState.severity}
        onClose={() => setFeedbackModalState({ ...feedbackModalState, open: false })}
      />
    </Container>
  );
}