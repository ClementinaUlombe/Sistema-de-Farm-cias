'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Alert } from '@mui/material';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

const qrcodeRegionId = "qrcode-reader";

export default function BarcodeScanner({ isOpen, onClose, onScanSuccess, onScanError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false); // New state to manage loading

  // Effect 1: Handle camera permissions when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCameraError(null);
      setHasCamera(false);
      setIsLoadingCamera(true); // Start loading

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasCamera(true);
          setIsLoadingCamera(false); // Stop loading
        })
        .catch(err => {
          console.error("Camera access error:", err);
          setCameraError("Não foi possível aceder à câmara. Verifique as permissões.");
          setIsLoadingCamera(false); // Stop loading
        });
    } else {
      // Cleanup when dialog closes
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner on close", error);
        });
        scannerRef.current = null;
      }
      setHasCamera(false);
      setCameraError(null);
      setIsLoadingCamera(false);
    }
  }, [isOpen]);

  // Effect 2: Initialize and clean up the scanner when camera is ready and dialog is open
  useEffect(() => {
    if (isOpen && hasCamera) {
      // Ensure the div is in the DOM before initializing
      // This useEffect runs after the render cycle where hasCamera became true
      const scanner = new Html5QrcodeScanner(
        qrcodeRegionId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false // verbose
      );
      scannerRef.current = scanner;

      scanner.render(onScanSuccess, (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      });

      // Cleanup function for this effect
      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner on unmount/re-render", error);
          });
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen, hasCamera, onScanSuccess, onScanError]);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Leitor de Código de Barras</DialogTitle>
      <DialogContent>
        {cameraError ? (
          <Alert severity="error">{cameraError}</Alert>
        ) : isLoadingCamera ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>A verificar acesso à câmara...</Typography>
          </Box>
        ) : hasCamera ? (
          // Render the scanner div only when camera is available
          <div id={qrcodeRegionId} style={{ width: "100%" }} />
        ) : null /* Should not happen if isLoadingCamera and cameraError are handled */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
