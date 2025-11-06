import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { keyframes } from '@emotion/react';

const scaleIn = keyframes`
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

interface FeedbackModalProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, message, severity, onClose }) => {
  const IconComponent = severity === 'success' ? CheckCircleOutlineIcon : ErrorOutlineIcon;
  const iconColor = severity === 'success' ? 'success.main' : 'error.main';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <IconComponent sx={{ fontSize: 60, color: iconColor, mb: 1, animation: severity === 'success' ? `${scaleIn} 0.3s ease-out` : 'none' }} />
        <Typography variant="h6" component="div">
          {severity === 'success' ? 'Sucesso!' : 'Erro!'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackModal;
