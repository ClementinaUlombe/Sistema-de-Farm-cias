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
  const [formErrors, setFormErrors] = useState<any>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialProductState);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, productId: '' });
  const [feedbackModalState, setFeedbackModalState] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar produtos');
      setProducts(await res.json());
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' });
    }
  }, [setFeedbackModalState]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const userRole = session.user?.role as UserRole;
      if (!([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(userRole)) {
        setLoading(false);
        setFeedbackModalState({
          open: true,
          message: 'Acesso Negado. Apenas Administradores e Stockistas podem ver esta página.',
          severity: 'error',
        });
        return;
      }
      fetchProducts().finally(() => setLoading(false));
    }
  }, [status, session, router, fetchProducts, setFeedbackModalState]);

  const validateField = (name: string, value: string, currentFormState: typeof initialProductState) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value) error = 'Nome do produto é obrigatório.';
        else if (value.length < 2 || value.length > 100) error = 'O nome do produto deve ter entre 2 e 100 caracteres.';
        break;
      case 'category':
        if (!value) error = 'Categoria é obrigatória.';
        else if (value.length < 2 || value.length > 50) error = 'A categoria deve ter entre 2 e 50 caracteres.';
        break;
      case 'dosage':
        if (value && value.length > 50) error = 'A dosagem não pode exceder 50 caracteres.';
        break;
      case 'manufacturer':
        if (value && value.length > 100) error = 'O fabricante não pode exceder 100 caracteres.';
        break;
      case 'purchasePrice':
        const pp = parseFloat(value);
        if (!value) error = 'Preço de compra é obrigatório.';
        else if (isNaN(pp) || pp <= 0) error = 'Deve ser um número maior que 0.';
        break;
      case 'sellingPrice':
        const sp = parseFloat(value);
        const currentPp = parseFloat(currentFormState.purchasePrice);
        if (!value) error = 'Preço de venda é obrigatório.';
        else if (isNaN(sp) || sp <= 0) error = 'Deve ser um número maior que 0.';
        else if (!isNaN(currentPp) && sp < currentPp) error = 'Não pode ser menor que o preço de compra.';
        break;
      case 'stockQuantity':
        const sq = parseInt(value, 10);
        if (!value) error = 'Quantidade em stock é obrigatória.';
        else if (!Number.isInteger(sq) || sq < 0) error = 'Deve ser um número inteiro >= 0.';
        break;
      case 'minStockQuantity':
        const msq = parseInt(value, 10);
        const currentSq = parseInt(currentFormState.stockQuantity, 10);
        if (!value) error = 'Stock mínimo é obrigatório.';
        else if (!Number.isInteger(msq) || msq < 0) error = 'Deve ser um número inteiro >= 0.';
        else if (!isNaN(currentSq) && msq > currentSq) error = 'Não pode ser maior que a quantidade em stock.';
        break;
      case 'expiryDate':
        const ed = new Date(value);
        if (!value) error = 'Data de validade é obrigatória.';
        else if (isNaN(ed.getTime())) error = 'Data inválida.';
        else if (ed <= new Date()) error = 'Deve ser uma data futura.';
        break;
      case 'barcode':
        if (value && value.length > 50) error = 'O código de barras não pode exceder 50 caracteres.';
        break;
      default:
        break;
    }
    setFormErrors((prev: any) => ({ ...prev, [name]: error }));
    return error;
  };

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
    setFormErrors({}); // Clear errors when opening modal
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormState(initialProductState);
    setFormErrors({}); // Clear errors when closing modal
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => {
      const newState = { ...prev, [name]: value };
      validateField(name, value, newState); // Pass newState for interdependent validation
      return newState;
    });
  };

  const handleScanSuccess = (decodedText: string) => {
    setFormState(prev => ({ ...prev, barcode: decodedText }));
    validateField('barcode', decodedText, formState); // Validate after scan
    setScannerOpen(false);
    setFeedbackModalState({ open: true, message: 'Código de barras lido com sucesso!', severity: 'success' });
  };

  const handleSubmit = async () => {
    let hasErrors = false;
    const newErrors: any = {};
    const fieldsToValidate = [
      'name', 'category', 'purchasePrice', 'sellingPrice', 'expiryDate',
      'stockQuantity', 'minStockQuantity', 'dosage', 'manufacturer', 'barcode'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formState[field as keyof typeof formState], formState);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setFormErrors(newErrors);

    if (hasErrors) {
      setFeedbackModalState({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
      return;
    }

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
      setFeedbackModalState({ open: true, message: `Produto ${editingProduct ? 'atualizado' : 'adicionado'} com sucesso!`, severity: 'success' });
      handleCloseModal();
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' });
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
      setFeedbackModalState({ open: true, message: 'Produto apagado com sucesso!', severity: 'success' });
      handleDeleteCancel();
    } catch (err: any) {
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' });
    }
  };

  if (loading || status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN && session?.user?.role !== UserRole.STOCKIST) return (
    <FeedbackModal
      open={feedbackModalState.open}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nome do Produto"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.name}
                helperText={formErrors.name || "Ex: Paracetamol 500mg"}
                placeholder="Ex: Paracetamol 500mg"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Categoria"
                name="category"
                value={formState.category}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.category}
                helperText={formErrors.category || "Ex: Analgésicos"}
                placeholder="Ex: Analgésicos"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Dosagem"
                name="dosage"
                value={formState.dosage}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.dosage}
                helperText={formErrors.dosage || "Ex: 500mg"}
                placeholder="Ex: 500mg"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fabricante"
                name="manufacturer"
                value={formState.manufacturer}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.manufacturer}
                helperText={formErrors.manufacturer || "Ex: Pfizer"}
                placeholder="Ex: Pfizer"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Preço de Compra"
                name="purchasePrice"
                type="number"
                value={formState.purchasePrice}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.purchasePrice}
                helperText={formErrors.purchasePrice || "Ex: 150.00"}
                placeholder="Ex: 150.00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Preço de Venda"
                name="sellingPrice"
                type="number"
                value={formState.sellingPrice}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.sellingPrice}
                helperText={formErrors.sellingPrice || "Ex: 200.00"}
                placeholder="Ex: 200.00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Quantidade em Stock"
                name="stockQuantity"
                type="number"
                value={formState.stockQuantity}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.stockQuantity}
                helperText={formErrors.stockQuantity || "Ex: 100"}
                placeholder="Ex: 100"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Stock Mínimo"
                name="minStockQuantity"
                type="number"
                value={formState.minStockQuantity}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.minStockQuantity}
                helperText={formErrors.minStockQuantity || "Ex: 10"}
                placeholder="Ex: 10"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Data de Validade"
                name="expiryDate"
                type="date"
                value={formState.expiryDate}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.expiryDate}
                helperText={formErrors.expiryDate || "Ex: 2025-12-31"}
                placeholder="Ex: 2025-12-31"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  label="Código de Barras (Opcional)"
                  name="barcode"
                  value={formState.barcode}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.barcode}
                  helperText={formErrors.barcode || "Ex: 7891234567890"}
                  placeholder="Ex: 7891234567890"
                />
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
          <Button onClick={handleSubmit} variant="contained" disabled={Object.values(formErrors).some(error => !!error)}>Salvar</Button>
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