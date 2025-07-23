import React from 'react';
import {
  Chip,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { PromptExecution } from '../../types';

interface ExecutionStatusProps {
  status: PromptExecution['status'];
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export default function ExecutionStatus({ status, size = 'small', showLabel = true }: ExecutionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <PendingIcon />,
          label: 'Pending',
          color: 'default' as const,
        };
      case 'PROCESSING':
        return {
          icon: <CircularProgress size={16} />,
          label: 'Processing',
          color: 'primary' as const,
        };
      case 'COMPLETED':
        return {
          icon: <SuccessIcon />,
          label: 'Completed',
          color: 'success' as const,
        };
      case 'FAILED':
        return {
          icon: <ErrorIcon />,
          label: 'Failed',
          color: 'error' as const,
        };
    }
  };

  const config = getStatusConfig();

  if (!showLabel) {
    return (
      <Box display="flex" alignItems="center">
        {config.icon}
      </Box>
    );
  }

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
    />
  );
}