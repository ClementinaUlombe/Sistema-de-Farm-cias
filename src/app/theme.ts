import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      light: '#A7FFEB',
      main: '#69F0AE',
      dark: '#00BFA5',
      contrastText: '#000', // Ensure contrast for text on primary color
    },
    secondary: {
      main: '#546e7a', // A cool grey for secondary actions
    },
    background: {
      default: '#f5f5f5', // A very light grey (off-white) for the main background
      paper: '#ffffff',   // White for paper elements like cards and tables
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
        fontWeight: 700,
    },
    h5: {
        fontWeight: 600,
    }
  },
  components: {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none',
            }
        }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 12,
            }
        }
    }
  }
});

export default theme;
