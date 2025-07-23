import React from 'react';
import { Box, Typography } from '@mui/material';
import ExportManager from './ExportManager';

export default function Exports() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Exports
      </Typography>
      <ExportManager />
    </Box>
  );
}