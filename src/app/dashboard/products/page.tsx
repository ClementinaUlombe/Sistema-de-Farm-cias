'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container, Box, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, 
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
 <Container
      component="main"
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        // em telas grandes, move ligeiramente à esquerda
        '@media (min-width: 1024px)': { transform: 'translateX(-12%)' },
      }}
    >      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography component="h1" variant="h4">Gestão de Produtos</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>Adicionar Novo Produto</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>Nome</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>Categoria</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Stock</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Preço (MT)</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Data de Validade</TableCell>
              <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{product.name}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{product.category}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{product.stockQuantity}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{new Date(product.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenModal(product)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Apagar"><IconButton size="small" onClick={() => handleDeleteClick(product.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
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
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Produto</label>
        <input
          type="text"
          name="name"
          value={formState.name}
          onChange={handleInputChange}
          placeholder="Ex: Paracetamol 500mg"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Categoria</label>
        <input
          type="text"
          name="category"
          value={formState.category}
          onChange={handleInputChange}
          placeholder="Ex: Analgésicos"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dosagem</label>
        <input
          type="text"
          name="dosage"
          value={formState.dosage}
          onChange={handleInputChange}
          placeholder="Ex: 500mg"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.dosage ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.dosage && <p className="text-red-500 text-sm mt-1">{formErrors.dosage}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Fabricante</label>
        <input
          type="text"
          name="manufacturer"
          value={formState.manufacturer}
          onChange={handleInputChange}
          placeholder="Ex: Pfizer"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.manufacturer ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.manufacturer && <p className="text-red-500 text-sm mt-1">{formErrors.manufacturer}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Preço de Compra</label>
        <input
          type="number"
          name="purchasePrice"
          value={formState.purchasePrice}
          onChange={handleInputChange}
          placeholder="Ex: 150.00"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.purchasePrice ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.purchasePrice && <p className="text-red-500 text-sm mt-1">{formErrors.purchasePrice}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Preço de Venda</label>
        <input
          type="number"
          name="sellingPrice"
          value={formState.sellingPrice}
          onChange={handleInputChange}
          placeholder="Ex: 200.00"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.sellingPrice ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.sellingPrice && <p className="text-red-500 text-sm mt-1">{formErrors.sellingPrice}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Quantidade em Stock</label>
        <input
          type="number"
          name="stockQuantity"
          value={formState.stockQuantity}
          onChange={handleInputChange}
          placeholder="Ex: 100"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.stockQuantity && <p className="text-red-500 text-sm mt-1">{formErrors.stockQuantity}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
        <input
          type="number"
          name="minStockQuantity"
          value={formState.minStockQuantity}
          onChange={handleInputChange}
          placeholder="Ex: 10"
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.minStockQuantity ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.minStockQuantity && <p className="text-red-500 text-sm mt-1">{formErrors.minStockQuantity}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Data de Validade</label>
        <input
          type="date"
          name="expiryDate"
          value={formState.expiryDate}
          onChange={handleInputChange}
          className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            formErrors.expiryDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {formErrors.expiryDate && <p className="text-red-500 text-sm mt-1">{formErrors.expiryDate}</p>}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Código de Barras (Opcional)</label>
          <input
            type="text"
            name="barcode"
            value={formState.barcode}
            onChange={handleInputChange}
            placeholder="Ex: 7891234567890"
            className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              formErrors.barcode ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.barcode && <p className="text-red-500 text-sm mt-1">{formErrors.barcode}</p>}
        </div>
        <Tooltip title="Escanear Código de Barras">
          <IconButton color="primary" onClick={() => setScannerOpen(true)}>
            <QrCodeScannerIcon />
          </IconButton>
        </Tooltip>
      </div>

    </div>
  </DialogContent>
  <DialogActions className="justify-end">
    <button
      onClick={handleCloseModal}
      className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
    >
      Cancelar
    </button>
    <Button
      onClick={handleSubmit}
              variant="contained" 

      disabled={Object.values(formErrors).some(error => !!error)}
      className={`px-4 py-2 rounded-md text-white ${
        Object.values(formErrors).some(error => !!error)
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      Salvar
    </Button>
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