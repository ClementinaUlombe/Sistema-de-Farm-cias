'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import SalesChart from './components/SalesChart';
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
      <>
        <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
          Bem-vindo ao Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          Seu perfil é: {userRole}
        </Typography>
        <SalesChart />
      </>
    );
  }

  return null;
}