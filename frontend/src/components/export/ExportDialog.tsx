import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ExportOptions } from '../../services/exportService';

interface ExportDialogProps {
  open: boolean;
  title?: string;
  allowedFormats?: ExportOptions['format'][];
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export default function ExportDialog({
  open,
  title = 'Export Assets',
  allowedFormats = ['WEBP', 'JPG', 'PNG', 'ZIP'],
  onClose,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportOptions['format']>('ZIP');
  const [quality, setQuality] = useState(85);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImageFormat = format === 'WEBP' || format === 'JPG' || format === 'PNG';

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const options: ExportOptions = {
        format,
        ...(isImageFormat && { quality }),
      };
      await onExport(options);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      onClose();
      setError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportOptions['format'])}
              label="Export Format"
              disabled={exporting}
            >
              {allowedFormats.includes('ZIP') && (
                <MenuItem value="ZIP">ZIP Archive (Original formats)</MenuItem>
              )}
              {allowedFormats.includes('WEBP') && (
                <MenuItem value="WEBP">WebP Images</MenuItem>
              )}
              {allowedFormats.includes('JPG') && (
                <MenuItem value="JPG">JPEG Images</MenuItem>
              )}
              {allowedFormats.includes('PNG') && (
                <MenuItem value="PNG">PNG Images</MenuItem>
              )}
            </Select>
          </FormControl>

          {isImageFormat && (
            <Box>
              <Typography gutterBottom>
                Quality: {quality}%
              </Typography>
              <Slider
                value={quality}
                onChange={(_, value) => setQuality(value as number)}
                min={1}
                max={100}
                marks={[
                  { value: 1, label: '1%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                ]}
                disabled={exporting || format === 'PNG'}
                sx={{ mt: 1 }}
              />
              {format === 'PNG' && (
                <Typography variant="caption" color="text.secondary">
                  PNG format always uses lossless compression
                </Typography>
              )}
            </Box>
          )}

          <Alert severity="info">
            {format === 'ZIP' 
              ? 'Assets will be exported in their original formats within a ZIP archive.'
              : `All image assets will be converted to ${format} format.`}
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={exporting}
          startIcon={exporting && <CircularProgress size={20} />}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}