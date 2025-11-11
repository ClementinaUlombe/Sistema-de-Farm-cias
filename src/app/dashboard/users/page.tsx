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
import FeedbackModal from '../../components/FeedbackModal';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

const initialFormState = {
  name: '',
  email: '',
  password: '',
  role: UserRole.ATTENDANT,
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Keeping this for consistency, though feedbackModalState handles errors now
  
  const [formErrors, setFormErrors] = useState<any>({});
  
  
  
    const validateField = (name: string, value: string) => {
  
      let error = '';
  
      switch (name) {
  
        case 'name':
  
          if (!value) error = 'Nome é obrigatório.';
  
          else if (value.length < 2 || value.length > 50) error = 'O nome deve ter entre 2 e 50 caracteres.';
  
          break;
  
        case 'email':
  
          if (!value) error = 'Email é obrigatório.';
  
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Formato de email inválido.';
  
          break;
  
        case 'password':
  
          if (!editingUser || (editingUser && value)) { // Required for new user, or if provided for existing
  
            if (!value) error = 'Senha é obrigatória.';
  
            else if (value.length < 8) error = 'A senha deve ter pelo menos 8 caracteres.';
  
            else if (!/[A-Z]/.test(value)) error = 'A senha deve conter pelo menos uma letra maiúscula.';
  
            else if (!/[a-z]/.test(value)) error = 'A senha deve conter pelo menos uma letra minúscula.';
  
            else if (!/[0-9]/.test(value)) error = 'A senha deve conter pelo menos um número.';
  
            else if (!/[^A-Za-z0-9]/.test(value)) error = 'A senha deve conter pelo menos um caractere especial.';
  
          }
  
          break;
  
        case 'role':
  
          if (!value) error = 'Perfil é obrigatório.';
  
          break;
  
        default:
  
          break;
  
      }
  
      setFormErrors(prev => ({ ...prev, [name]: error }));
  
      return error;
  
    };
  
  
  
    const handleInputChange = (e: any) => {
  
      const { name, value } = e.target;
  
      setFormState(prev => ({ ...prev, [name]: value }));
  
      validateField(name, value); // Validate on change
  
    };
  
  
  
    const handleSubmit = async () => {
  
      let hasErrors = false;
  
      const newErrors: any = {};
  
      // Validate all fields
  
      ['name', 'email', 'role'].forEach(field => {
  
        const error = validateField(field, formState[field as keyof typeof formState]);
  
        if (error) {
  
          newErrors[field] = error;
  
          hasErrors = true;
  
        }
  
      });
  
      // Password validation is conditional
  
      const passwordError = validateField('password', formState.password);
  
      if (passwordError) {
  
        newErrors.password = passwordError;
  
        hasErrors = true;
  
      }
  
  
  
      setFormErrors(newErrors);
  
  
  
      if (hasErrors) {
  
        setFeedbackModalState({ open: true, message: 'Por favor, corrija os erros no formulário.', severity: 'error' });
  
        return;
  
      }
  
  
  
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
  
      const method = editingUser ? 'PUT' : 'POST';
  
      try {
  
        const dataToSend: any = { ...formState };
  
        if (editingUser) {
  
          delete dataToSend.id;
  
          delete dataToSend.isActive;
  
        }
  
  
  
        const res = await fetch(url, {
  
          method,
  
          headers: { 'Content-Type': 'application/json' },
  
          body: JSON.stringify(dataToSend),
  
        });
  
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao salvar utilizador');
  
        await fetchUsers();
  
        setFeedbackModalState({ open: true, message: `Utilizador ${editingUser ? 'atualizado' : 'criado'} com sucesso!`, severity: 'success' });
  
        handleCloseModal();
  
      } catch (err: any) { setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); }
  
    };
  
  
  
    const handleDeleteClick = (userId: string) => {
  
      setUserIdToDelete(userId);
  
      setDeleteConfirmOpen(true);
  
    };
  
    const handleDeleteCancel = () => {
  
      setDeleteConfirmOpen(false);
  
      setUserIdToDelete('');
  
    };
  
    const handleDeleteConfirm = async () => {
  
      if (!userIdToDelete) {
  
        setFeedbackModalState({ open: true, message: 'ID do utilizador não fornecido para apagar.', severity: 'error' });
  
        handleDeleteCancel();
  
        return;
  
      }
  
      try {
  
        const res = await fetch(`/api/users/${userIdToDelete}`, { method: 'DELETE' });
  
        if (!res.ok) throw new Error((await res.json()).error || 'Falha ao apagar utilizador');
  
        await fetchUsers();
  
        setFeedbackModalState({ open: true, message: 'Utilizador apagado com sucesso!', severity: 'success' });
  
        handleDeleteCancel();
  
      } catch (err: any) { setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); }
  
    };
  
  
  const fetchUsers = useCallback(async () => {
    console.log("fetchUsers called");
    try {
      const res = await fetch('/api/users');
      console.log("fetchUsers response received:", res.ok);
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar utilizadores');
      setUsers(await res.json());
      console.log("Users fetched successfully");
    } catch (err: any) {
      console.error("Error in fetchUsers:", err);
      setFeedbackModalState({ open: true, message: err.message, severity: 'error' });
    } finally {
      console.log("fetchUsers finished");
      setLoading(false);
    }
  }, []);
  
    if (loading || status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  
    if (session?.user?.role !== UserRole.ADMIN) return (
  
      <FeedbackModal
  
        open={true}
  
        message="Acesso Negado. Apenas Administradores podem ver esta página."
  
        severity="error"
  
        onClose={() => router.push('/dashboard')}
  
      />
  
    );
  
  
  
    return (
  
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
  
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
  
          <Typography component="h1" variant="h4">Gestão de Utilizadores</Typography>
  
          <Button variant="contained" onClick={() => handleOpenModal()}>Adicionar Utilizador</Button>
  
        </Box>
  
  
  
        <TableContainer component={Paper}>
  
          <Table>
  
            <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Email</TableCell><TableCell>Perfil</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
  
            <TableBody>
  
              {users.map((user) => (
  
                <TableRow key={user.id}>
  
                  <TableCell>{user.name}</TableCell>
  
                  <TableCell>{user.email}</TableCell>
  
                  <TableCell>{user.role}</TableCell>
  
                  <TableCell align="right">
  
                    <Tooltip title="Editar"><IconButton onClick={() => handleOpenModal(user)}><EditIcon /></IconButton></Tooltip>
  
                    {session?.user?.id !== user.id && <Tooltip title="Apagar"><IconButton onClick={() => handleDeleteClick(user.id)}><DeleteIcon /></IconButton></Tooltip>}
  
                  </TableCell>
  
                </TableRow>
  
              ))}
  
            </TableBody>
  
          </Table>
  
        </TableContainer>
  
  
  
        {/* Add/Edit User Modal */}
  
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
  
          <DialogTitle>{editingUser ? 'Editar Utilizador' : 'Adicionar Novo Utilizador'}</DialogTitle>
  
          <DialogContent>
  
            <Grid container spacing={2} sx={{ mt: 1 }}>
  
              <Grid item xs={12}>
  
                <TextField
  
                  label="Nome Completo"
  
                  name="name"
  
                  value={formState.name}
  
                  onChange={handleInputChange}
  
                  fullWidth
  
                  required
  
                  error={!!formErrors.name}
  
                  helperText={formErrors.name || "Ex: João Silva"}
  
                  placeholder="Ex: João Silva"
  
                />
  
              </Grid>
  
              <Grid item xs={12}>
  
                <TextField
  
                  label="Email"
  
                  name="email"
  
                  type="email"
  
                  value={formState.email}
  
                  onChange={handleInputChange}
  
                  fullWidth
  
                  required
  
                  error={!!formErrors.email}
  
                  helperText={formErrors.email || "Ex: joao.silva@example.com"}
  
                  placeholder="Ex: joao.silva@example.com"
  
                />
  
              </Grid>
  
              <Grid item xs={12}>
  
                <TextField
  
                  label="Senha"
  
                  name="password"
  
                  type="password"
  
                  onChange={handleInputChange}
  
                  fullWidth
  
                  required={!editingUser}
  
                  error={!!formErrors.password}
  
                  helperText={formErrors.password || (editingUser ? 'Deixe em branco para não alterar' : 'Ex: MinhaSenhaForte1!')}
  
                  placeholder={editingUser ? '' : 'Ex: MinhaSenhaForte1!'}
  
                />
  
              </Grid>
  
              <Grid item xs={12}>
  
                <FormControl fullWidth required error={!!formErrors.role}>
  
                  <InputLabel>Perfil</InputLabel>
  
                  <Select name="role" value={formState.role} label="Perfil" onChange={handleInputChange}>
  
                    <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
  
                    <MenuItem value={UserRole.ATTENDANT}>Atendente</MenuItem>
  
                    <MenuItem value={UserRole.STOCKIST}>Stockista</MenuItem>
  
                  </Select>
  
                  {formErrors.role && <Typography color="error" variant="caption">{formErrors.role}</Typography>}
  
                </FormControl>
  
              </Grid>
  
            </Grid>
  
          </DialogContent>
  
          <DialogActions>
  
            <Button onClick={handleCloseModal}>Cancelar</Button>
  
            <Button onClick={handleSubmit} variant="contained" disabled={Object.values(formErrors).some(error => !!error)}>Salvar</Button>
  
          </DialogActions>
  
        </Dialog>
  
  
  
        {/* Delete Confirmation Dialog */}
  
        <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
  
          <DialogTitle>Confirmar Exclusão</DialogTitle>
  
          <DialogContent><Typography>Tem a certeza que deseja apagar este utilizador?</Typography></DialogContent>
  
          <DialogActions>
  
            <Button onClick={handleDeleteCancel}>Cancelar</Button>
  
            <Button onClick={handleDeleteConfirm} variant="contained" color="error">Apagar</Button>
  
          </DialogActions>
  
        </Dialog>
  
  
  
        <FeedbackModal
  
          open={feedbackModalState.open}
  
          message={feedbackModalState.message}
  
          severity={feedbackModalState.severity}
  
          onClose={() => setFeedbackModalState({ ...feedbackModalState, open: false })}
  
        />
  
      </Container>
  
    );
  
  }