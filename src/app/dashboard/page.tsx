'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, CircularProgress, Stack } from '@mui/material';
import { UserRole } from '@prisma/client';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'authenticated') {
    const userRole = session.user?.role as UserRole;

    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
          }}
        >
          <Typography component="h1" variant="h6" sx={{ mb: 2 }}>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4 }}>
            Olá, {session.user?.name}!
          </Typography>
          <Stack spacing={2} direction="column" sx={{ width: '80%' }}>
            {[UserRole.ADMIN, UserRole.ATTENDANT].includes(userRole) && (
              <Link href="/dashboard/sales" passHref>
                <Button variant="contained" color="primary" fullWidth>Nova Venda</Button>
              </Link>
            )}

            {[UserRole.ADMIN, UserRole.STOCKIST].includes(userRole) && (
              <>
                <Link href="/dashboard/products" passHref>
                  <Button variant="contained" color="secondary" fullWidth>Gerir Produtos</Button>
                </Link>
                <Link href="/dashboard/reports/stock-history" passHref>
                  <Button variant="contained" style={{ backgroundColor: '#673ab7' }} fullWidth>Histórico de Stock</Button>
                </Link>
              </>
            )}
            
            {[UserRole.ADMIN, UserRole.ATTENDANT].includes(userRole) && (
                <Link href="/dashboard/my-reports" passHref>
                  <Button variant="contained" style={{ backgroundColor: '#2196f3' }} fullWidth>Os Meus Relatórios</Button>
                </Link>
            )}

            {userRole === UserRole.ADMIN && (
              <>
                <Link href="/dashboard/users" passHref>
                  <Button variant="contained" color="success" fullWidth>Gerir Utilizadores</Button>
                </Link>
                <Link href="/dashboard/reports" passHref>
                  <Button variant="contained" color="warning" fullWidth>Relatórios Gerais</Button>
                </Link>
              </>
            )}
          </Stack>
          <Box sx={{ mt: 'auto', width: '80%' }}> {/* Pushes the sign-out button to the bottom */}
            <Button
              variant="outlined"
              onClick={() => signOut({ callbackUrl: '/login' })}
              fullWidth
            >
              Sair
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
            Bem-vindo ao Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4 }}>
            Seu perfil é: {userRole}
          </Typography>
          {/* Placeholder for graph or other content */}
          <Box
            sx={{
              height: 300,
              bgcolor: 'grey.200',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Área para Gráficos ou Conteúdo Principal
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
}
