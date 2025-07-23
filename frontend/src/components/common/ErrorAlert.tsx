import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

interface ErrorAlertProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ error, title = 'Error', onRetry }: ErrorAlertProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Box my={2}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {errorMessage}
      </Alert>
    </Box>
  );
}