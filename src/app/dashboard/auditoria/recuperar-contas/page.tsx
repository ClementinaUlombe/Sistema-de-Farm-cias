'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Typography, Alert, Paper, Button, Stack, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, IconButton } from '@mui/material';
import { UserRole } from '@prisma/client';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import FeedbackModal from '../../../components/FeedbackModal';

interface InactiveUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function RecoverAccountsPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchInactiveUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/inactive');
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar utilizadores inativos');
      setUsers(await res.json());
    } catch (err: any) {
      setFeedback({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchInactiveUsers();
    }
  }, [session]);

  const handleReactivate = async (user: InactiveUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, isActive: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao reativar utilizador');
      setFeedback({ open: true, message: 'Utilizador reativado com sucesso!', severity: 'success' });
      fetchInactiveUsers(); // Refresh the list
    } catch (err: any) {
      setFeedback({ open: true, message: err.message, severity: 'error' });
    }
  };

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

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
    >      <Typography component="h1" variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        Recuperar Contas de Funcionários
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Aqui pode reativar contas de funcionários que foram desativadas.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>Nome</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Perfil</TableCell>
                <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{user.name}</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{user.email}</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{user.role}</TableCell>
                  <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Reativar Conta">
                        <IconButton size="small" onClick={() => handleReactivate(user)} color="success">
                          <RestoreFromTrashIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">Nenhum utilizador inativo encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <FeedbackModal
        open={feedback.open}
        message={feedback.message}
        severity={feedback.severity}
        onClose={() => setFeedback({ ...feedback, open: false })}
      />
    </Container>
  );
}
