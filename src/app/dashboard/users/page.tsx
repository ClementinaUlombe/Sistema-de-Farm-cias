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
  const [error, setError] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: '' });
  const [feedbackModalState, setFeedbackModalState] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar utilizadores');
      setUsers(await res.json());
    } catch (err: any) { setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      if (session.user?.role !== UserRole.ADMIN) {
        setLoading(false);
        return;
      }
      fetchUsers().finally(() => setLoading(false));
    }
  }, [status, session, router, fetchUsers]);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormState({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setFormState(initialFormState);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setFormState(initialFormState);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao salvar utilizador');
      await fetchUsers();
      setFeedbackModalState({ open: true, message: `Utilizador ${editingUser ? 'atualizado' : 'criado'} com sucesso!`, severity: 'success' });
      handleCloseModal();
    } catch (err: any) { setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); }
  };

  const handleDeleteClick = (userId: string) => setDeleteConfirm({ open: true, userId });
  const handleDeleteCancel = () => setDeleteConfirm({ open: false, userId: '' });
  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/users/${deleteConfirm.userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao apagar utilizador');
      await fetchUsers();
      setFeedbackModalState({ open: true, message: 'Utilizador apagado com sucesso!', severity: 'success' });
      handleDeleteCancel();
    } catch (err: any) { setFeedbackModalState({ open: true, message: err.message, severity: 'error' }); }
  };

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
            <Grid item xs={12}><TextField label="Nome Completo" name="name" value={formState.name} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12}><TextField label="Email" name="email" type="email" value={formState.email} onChange={handleInputChange} fullWidth required /></Grid>
            <Grid item xs={12}><TextField label="Senha" name="password" type="password" onChange={handleInputChange} fullWidth required={!editingUser} helperText={editingUser ? 'Deixe em branco para não alterar' : ''} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Perfil</InputLabel>
                <Select name="role" value={formState.role} label="Perfil" onChange={handleInputChange}>
                  <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                  <MenuItem value={UserRole.ATTENDANT}>Atendente</MenuItem>
                  <MenuItem value={UserRole.STOCKIST}>Stockista</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={handleDeleteCancel}>
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
