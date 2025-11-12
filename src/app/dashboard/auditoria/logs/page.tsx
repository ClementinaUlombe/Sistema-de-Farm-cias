'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Box, Typography, Alert, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';
import { UserRole } from '@prisma/client';

interface LogEntry {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  targetId: string;
  details: any;
}

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      setLoading(true);
      fetch('/api/logs')
        .then(async res => {
          if (!res.ok) throw new Error((await res.json()).error || 'Falha ao carregar logs');
          return res.json();
        })
        .then(data => setLogs(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
        Logs de Atividades do Sistema
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ p: { xs: 1, sm: 2 } }}>Data</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Utilizador</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 } }}>Ação</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Alvo ID</TableCell>
                  <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={log.id}>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>{log.actorName}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{log.action}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 }, wordBreak: 'break-all', display: { xs: 'none', sm: 'table-cell' } }}>{log.targetId}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 }, wordBreak: 'break-all', display: { xs: 'none', sm: 'table-cell' } }}>{log.details ? JSON.stringify(log.details) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={logs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Container>
  );
}
