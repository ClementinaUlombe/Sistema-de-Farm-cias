'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import Link from 'next/link';
import { keyframes } from '@emotion/react';

// Define keyframes for a subtle background animation
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError('Credenciais inválidas. Verifique o email e a senha.');
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url(/Farmacianochile.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(105, 240, 174, 0.6)', // Brighter green overlay with opacity
          zIndex: 0,
        }}
      />

      {/* Content Container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Stack vertically on small screens, side-by-side on medium and up
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: 1200, // Max width for the content area
          p: 3,
        }}
      >
        {/* Left Side: Title and Phrase */}
        <Box
          sx={{
            textAlign: { xs: 'center', md: 'left' },
            color: 'white',
            mb: { xs: 4, md: 0 }, // Margin bottom on small screens
            maxWidth: { xs: '100%', md: '50%' },
            paddingLeft: { md: 4 }, // Add padding to the left on medium screens and up
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom sx={{ whiteSpace: 'nowrap' }}>
            Farmacia da Luz
          </Typography>
          <Typography variant="h5">
            Sua saúde é a nossa prioridade. Oferecemos uma ampla gama de produtos e serviços farmacêuticos com excelência e cuidado.
          </Typography>
        </Box>

        {/* Right Side: Login Form Container */}
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white for the form background
            borderRadius: 2,
            maxWidth: 400, // Adjusted max width for the form
            width: '100%',
          }}
        >
        <Typography component="h1" variant="h5">
          Login do Sistema
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth // Keep fullWidth to fill the compact Paper width
            id="email"
            label="Endereço de Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth // Keep fullWidth to fill the compact Paper width
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Entrar
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
            <Link href="/forgot-password" passHref>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                Esqueceu a senha?
              </Typography>
            </Link>
            <Link href="/signup" passHref>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                Não tem uma conta? Cadastre-se
              </Typography>
            </Link>
          </Box>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
}
