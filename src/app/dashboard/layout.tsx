'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import { UserRole } from '@prisma/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {[UserRole.ADMIN, UserRole.ATTENDANT].includes(userRole) && (
              <Link href="/dashboard/sales" passHref>
                <ListItem disablePadding>
                  <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                    <ListItemIcon sx={{ color: 'white' }}>
                      <AddShoppingCartIcon />
                    </ListItemIcon>
                    <ListItemText primary="Nova Venda" sx={{ color: 'white' }} />
                  </ListItemButton>
                </ListItem>
              </Link>
            )}

            {[UserRole.ADMIN, UserRole.STOCKIST].includes(userRole) && (
              <>
                <Link href="/dashboard/products" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <InventoryIcon />
                      </ListItemIcon>
                      <ListItemText primary="Gerir Produtos" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
                <Link href="/dashboard/reports/stock-history" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText primary="Histórico de Stock" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
              </>
            )}
            
            {[UserRole.ADMIN, UserRole.ATTENDANT].includes(userRole) && (
                <Link href="/dashboard/my-reports" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText primary="Os Meus Relatórios" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
            )}

            {userRole === UserRole.ADMIN && (
              <>
                <Link href="/dashboard/users" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <GroupIcon />
                      </ListItemIcon>
                      <ListItemText primary="Gerir Utilizadores" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
                <Link href="/dashboard/reports/sales" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText primary="Relatório de Vendas" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
                <Link href="/dashboard/reports" passHref>
                  <ListItem disablePadding>
                    <ListItemButton sx={{ bgcolor: '#69F0AE', '&:hover': { bgcolor: '#00E676' }, mb: 2 }}>
                      <ListItemIcon sx={{ color: 'white' }}>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText primary="Relatórios Gerais" sx={{ color: 'white' }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
              </>
            )}
          </List>
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
          {children}
        </Box>
      </Box>
    );
  }

  return null;
}
