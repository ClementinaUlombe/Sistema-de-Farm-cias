'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Typography, Alert, Paper, Button, CircularProgress, List, ListItem, ListItemText, Divider } from '@mui/material';
import { UserRole } from '@prisma/client';
import FeedbackModal from '../../../components/FeedbackModal';

interface BackupFile {
  name: string;
  createdAt: string;
}

export default function BackupPage() {
  const { data: session, status } = useSession();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auditoria/backup');
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar backups');
      setBackups(await res.json());
    } catch (err: any) {
      setFeedback({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchBackups();
    }
  }, [session]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/auditoria/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar backup');
      setFeedback({ open: true, message: data.message, severity: 'success' });
      fetchBackups(); // Refresh the list
    } catch (err: any) {
      setFeedback({ open: true, message: err.message, severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (status === 'loading') return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (session?.user?.role !== UserRole.ADMIN) return <Container><Alert severity="error" sx={{ mt: 4 }}>Acesso Negado.</Alert></Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Backup da Base de Dados
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Clique no botão abaixo para criar uma cópia de segurança instantânea da base de dados. Os backups são guardados no servidor.
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleCreateBackup} 
          disabled={creating || loading}
        >
          {creating ? 'Criando Backup...' : 'Criar Novo Backup'}
        </Button>
      </Paper>

      <Typography component="h2" variant="h5" gutterBottom>
        Backups Existentes
      </Typography>
      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <List>
            {backups.length > 0 ? backups.map((backup, index) => (
              <Box key={backup.name}>
                <ListItem>
                  <ListItemText 
                    primary={backup.name} 
                    secondary={`Criado em: ${new Date(backup.createdAt).toLocaleString()}`}
                  />
                </ListItem>
                {index < backups.length - 1 && <Divider />}
              </Box>
            )) : (
              <ListItem>
                <ListItemText primary="Nenhum backup encontrado." />
              </ListItem>
            )}
          </List>
        )}
      </Paper>

      <FeedbackModal
        open={feedback.open}
        message={feedback.message}
        severity={feedback.severity}
        onClose={() => setFeedback({ ...feedback, open: false })}
      />
    </Container>
  );
}
