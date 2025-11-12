'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, AppBar, Toolbar, IconButton, Drawer, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import RestoreIcon from '@mui/icons-material/Restore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BackupIcon from '@mui/icons-material/Backup';
import MenuIcon from '@mui/icons-material/Menu';
import { UserRole } from '@prisma/client';
import ThemeSwitcher from '../components/ThemeSwitcher';

const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [auditoriaOpen, setAuditoriaOpen] = useState(false);
  const theme = useTheme(); // Use theme
  const themeMode = theme.palette.mode; // Get theme mode
  const [mobileOpen, setMobileOpen] = useState(false); // New state for mobile drawer
  const isMdUp = useMediaQuery(theme.breakpoints.up('md')); // New media query

  const handleDrawerToggle = () => { // New function to toggle mobile drawer
    setMobileOpen(!mobileOpen);
  };

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
    const isActive = (href: string) => pathname === href; // Helper function for active state

    const handleAuditoriaClick = () => {
      setAuditoriaOpen(!auditoriaOpen);
    };

    const baseTextColor = themeMode === 'dark' ? 'white' : 'black'; // Dynamic base text color

    const drawerContent = (
      <div> {/* Changed from Box to div */}
        <Link href="/dashboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography component="h1" variant="h6" sx={{ mb: 2, color: baseTextColor, textAlign: 'center' }}> {/* Dynamic Dashboard text color */}
            Dashboard
          </Typography>
        </Link>
        <Typography variant="subtitle1" sx={{ mb: 4, color: baseTextColor, textAlign: 'center' }}> {/* Dynamic Olá text color */}
          Olá, {session.user?.name}!
        </Typography>
        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'transparent' }}> {/* Transparent background for List */}
          {([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(userRole) && (
            <Link href="/dashboard/sales" passHref>
              <ListItem disablePadding>
                <ListItemButton
                  sx={{
                    bgcolor: isActive('/dashboard/sales') ? 'black' : 'transparent',
                    '&:hover': {
                      bgcolor: isActive('/dashboard/sales') ? 'black' : '#7cb342', // Black if active, darker green if not
                    },
                    mb: 2,
                    color: isActive('/dashboard/sales') ? 'white' : baseTextColor, // Dynamic text color
                  }}
                >
                  <ListItemIcon sx={{ color: isActive('/dashboard/sales') ? 'white' : baseTextColor }}>
                    <AddShoppingCartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Nova Venda" sx={{ color: isActive('/dashboard/sales') ? 'white' : baseTextColor }} />
                </ListItemButton>
              </ListItem>
            </Link>
          )}

          {([UserRole.ADMIN, UserRole.STOCKIST] as UserRole[]).includes(userRole) && (
            <>
              <Link href="/dashboard/products" passHref>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      bgcolor: isActive('/dashboard/products') ? 'black' : 'transparent',
                      '&:hover': {
                        bgcolor: isActive('/dashboard/products') ? 'black' : '#7cb342',
                      },
                      mb: 2,
                      color: isActive('/dashboard/products') ? 'white' : baseTextColor,
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive('/dashboard/products') ? 'white' : baseTextColor }}>
                      <InventoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Gerir Produtos" sx={{ color: isActive('/dashboard/products') ? 'white' : baseTextColor }} />
                  </ListItemButton>
                </ListItem>
              </Link>
              <Link href="/dashboard/reports/stock-history" passHref>
                <ListItem disablePadding>
                  <ListItemButton
                    sx={{
                      bgcolor: isActive('/dashboard/reports/stock-history') ? 'black' : 'transparent',
                      '&:hover': {
                        bgcolor: isActive('/dashboard/reports/stock-history') ? 'black' : '#7cb342',
                      },
                      mb: 2,
                      color: isActive('/dashboard/reports/stock-history') ? 'white' : baseTextColor,
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive('/dashboard/reports/stock-history') ? 'white' : baseTextColor }}>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Histórico de Stock" sx={{ color: isActive('/dashboard/reports/stock-history') ? 'white' : baseTextColor }} />
                  </ListItemButton>
                </ListItem>
              </Link>
            </>
          )}
            
          {([UserRole.ADMIN, UserRole.ATTENDANT] as UserRole[]).includes(userRole) && (
                <Link href="/dashboard/my-reports" passHref>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{
                        bgcolor: isActive('/dashboard/my-reports') ? 'black' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive('/dashboard/my-reports') ? 'black' : '#7cb342',
                        },
                        mb: 2,
                        color: isActive('/dashboard/my-reports') ? 'white' : baseTextColor,
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive('/dashboard/my-reports') ? 'white' : baseTextColor }}>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText primary="Os Meus Relatórios" sx={{ color: isActive('/dashboard/my-reports') ? 'white' : baseTextColor }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
            )}

            {userRole === UserRole.ADMIN && (
              <>
                <Link href="/dashboard/users" passHref>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{
                        bgcolor: isActive('/dashboard/users') ? 'black' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive('/dashboard/users') ? 'black' : '#7cb342',
                        },
                        mb: 2,
                        color: isActive('/dashboard/users') ? 'white' : baseTextColor,
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive('/dashboard/users') ? 'white' : baseTextColor }}>
                        <GroupIcon />
                      </ListItemIcon>
                      <ListItemText primary="Gerir Utilizadores" sx={{ color: isActive('/dashboard/users') ? 'white' : baseTextColor }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
                <Link href="/dashboard/reports/sales" passHref>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{
                        bgcolor: isActive('/dashboard/reports/sales') ? 'black' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive('/dashboard/reports/sales') ? 'black' : '#7cb342',
                        },
                        mb: 2,
                        color: isActive('/dashboard/reports/sales') ? 'white' : baseTextColor,
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive('/dashboard/reports/sales') ? 'white' : baseTextColor }}>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText primary="Relatório de Vendas" sx={{ color: isActive('/dashboard/reports/sales') ? 'white' : baseTextColor }} />
                    </ListItemButton>
                  </ListItem>
                </Link>
                <Link href="/dashboard/reports" passHref>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{
                        bgcolor: isActive('/dashboard/reports') ? 'black' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive('/dashboard/reports') ? 'black' : '#7cb342',
                        },
                        mb: 2,
                        color: isActive('/dashboard/reports') ? 'white' : baseTextColor,
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive('/dashboard/reports') ? 'white' : baseTextColor }}>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText primary="Relatórios Gerais" sx={{ color: isActive('/dashboard/reports') ? 'white' : baseTextColor }} />
                    </ListItemButton>
                  </ListItem>
                </Link>

                {/* Auditoria e Segurança Collapsible Menu */}
                <ListItemButton
                  onClick={handleAuditoriaClick}
                  sx={{
                    bgcolor: auditoriaOpen ? 'black' : 'transparent', // Black if open (active), transparent if closed
                    '&:hover': {
                      bgcolor: auditoriaOpen ? 'black' : '#7cb342',
                    },
                    mb: 2,
                    color: auditoriaOpen ? 'white' : baseTextColor,
                  }}
                >
                  <ListItemIcon sx={{ color: auditoriaOpen ? 'white' : baseTextColor }}>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText primary="Auditoria e Segurança" sx={{ color: auditoriaOpen ? 'white' : baseTextColor }} />
                  {auditoriaOpen ? <ExpandLess sx={{ color: auditoriaOpen ? 'white' : baseTextColor }} /> : <ExpandMore sx={{ color: auditoriaOpen ? 'white' : baseTextColor }} />}
                </ListItemButton>
                <Collapse in={auditoriaOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <Link href="/dashboard/auditoria/recuperar-contas" passHref>
                      <ListItemButton
                        sx={{
                          pl: 4,
                          mb: 1,
                          bgcolor: isActive('/dashboard/auditoria/recuperar-contas') ? 'black' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive('/dashboard/auditoria/recuperar-contas') ? 'black' : '#7cb342',
                          },
                          color: isActive('/dashboard/auditoria/recuperar-contas') ? 'white' : baseTextColor,
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive('/dashboard/auditoria/recuperar-contas') ? 'white' : baseTextColor }}><RestoreIcon /></ListItemIcon>
                        <ListItemText primary="Recuperar Contas" sx={{ color: isActive('/dashboard/auditoria/recuperar-contas') ? 'white' : baseTextColor }} />
                      </ListItemButton>
                    </Link>
                    <Link href="/dashboard/auditoria/logs" passHref>
                      <ListItemButton
                        sx={{
                          pl: 4,
                          mb: 1,
                          bgcolor: isActive('/dashboard/auditoria/logs') ? 'black' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive('/dashboard/auditoria/logs') ? 'black' : '#7cb342',
                          },
                          color: isActive('/dashboard/auditoria/logs') ? 'white' : baseTextColor,
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive('/dashboard/auditoria/logs') ? 'white' : baseTextColor }}><ListAltIcon /></ListItemIcon>
                        <ListItemText primary="Logs de Atividades" sx={{ color: isActive('/dashboard/auditoria/logs') ? 'white' : baseTextColor }} />
                      </ListItemButton>
                    </Link>
                    <Link href="/dashboard/auditoria/backup" passHref>
                      <ListItemButton
                        sx={{
                          pl: 4,
                          mb: 1,
                          bgcolor: isActive('/dashboard/auditoria/backup') ? 'black' : 'transparent',
                          '&:hover': {
                            bgcolor: isActive('/dashboard/auditoria/backup') ? 'black' : '#7cb342',
                          },
                          color: isActive('/dashboard/auditoria/backup') ? 'white' : baseTextColor,
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive('/dashboard/auditoria/backup') ? 'white' : baseTextColor }}><BackupIcon /></ListItemIcon>
                        <ListItemText primary="Backup da Base de Dados" sx={{ color: isActive('/dashboard/auditoria/backup') ? 'white' : baseTextColor }} />
                      </ListItemButton>
                    </Link>
                  </List>
                </Collapse>
              </>
            )}
          </List>
          <Box sx={{ mt: 'auto', width: '80%' }}> {/* Pushes the sign-out button to the bottom */}
            <Button
              variant="contained"
              onClick={() => signOut({ callbackUrl: '/login' })}
              fullWidth
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': {
                  bgcolor: '#212121',
                },
              }}
            >
              Sair
            </Button>
          </Box>
        </div>
    );

    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* AppBar for mobile */}
        {!isMdUp && (
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#8bc34a' }}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: baseTextColor }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ color: baseTextColor }}>
                Farmacia da Luz
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{ width: isMdUp ? drawerWidth : 0, flexShrink: { sm: 0 } }} // Adjust width based on screen size
          aria-label="mailbox folders"
        >
          {/* Temporary drawer for mobile */}
          {!isMdUp ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#8bc34a', color: baseTextColor },
              }}
            >
              <Box sx={{ py: 4, color: baseTextColor }}> {/* Wrap drawerContent in a Box */}
                {drawerContent}
              </Box>
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#8bc34a', color: baseTextColor },
              }}
              open
            >
              <Box sx={{ py: 4, color: baseTextColor }}> {/* Wrap drawerContent in a Box */}
                {drawerContent}
              </Box>
            </Drawer>
          )}
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 3, lg: 0 }, // Remove padding for large screens
            width: { sm: `calc(100% - ${isMdUp ? drawerWidth : 0}px)` }, // Adjust width based on drawer
            ml: { sm: `${isMdUp ? drawerWidth : 0}px` }, // Adjust margin-left based on drawer
            mt: { xs: !isMdUp ? '64px' : '0px', md: '0px' }, // Add top margin for mobile app bar
            position: 'relative'
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  return null;
}