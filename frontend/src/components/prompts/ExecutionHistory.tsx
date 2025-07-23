import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '../../services/promptService';
import { PromptExecution } from '../../types';
import ExecutionStatus from './ExecutionStatus';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

interface ExecutionHistoryProps {
  open: boolean;
  promptId?: string;
  onClose: () => void;
}

export default function ExecutionHistory({ open, promptId, onClose }: ExecutionHistoryProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['executions', promptId],
    queryFn: () => promptService.getExecutions({ promptId, limit: 50 }),
    enabled: open && !!promptId,
  });

  const cancelMutation = useMutation({
    mutationFn: (executionId: string) => promptService.cancelExecution(executionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  const handleViewResult = (execution: PromptExecution) => {
    if (execution.generatedAsset) {
      window.open(execution.generatedAsset.storageUrl, '_blank');
    } else if (execution.result) {
      alert(JSON.stringify(execution.result, null, 2));
    }
  };

  const canCancel = (status: PromptExecution['status']) => {
    return status === 'PENDING' || status === 'PROCESSING';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Execution History</Typography>
          <Box>
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <LoadingSpinner message="Loading execution history..." />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : data?.data && data.data.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map((execution) => {
                  const startTime = new Date(execution.createdAt);
                  const endTime = execution.completedAt ? new Date(execution.completedAt) : null;
                  const duration = endTime 
                    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) 
                    : null;

                  return (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <ExecutionStatus status={execution.status} />
                      </TableCell>
                      <TableCell>
                        {startTime.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {endTime ? endTime.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {duration !== null ? `${duration}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {execution.status === 'COMPLETED' && execution.generatedAsset ? (
                          <Typography variant="body2" color="success.main">
                            Asset generated
                          </Typography>
                        ) : execution.status === 'FAILED' ? (
                          <Typography variant="body2" color="error.main">
                            {execution.error || 'Failed'}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {execution.status === 'COMPLETED' && (execution.generatedAsset || execution.result) && (
                          <Tooltip title="View Result">
                            <IconButton size="small" onClick={() => handleViewResult(execution)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canCancel(execution.status) && (
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              onClick={() => cancelMutation.mutate(execution.id)}
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No execution history available</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}