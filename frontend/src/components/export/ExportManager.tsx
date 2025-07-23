import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  CloudDownload as ProcessingIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exportService, ExportJob } from '../../services/exportService';
import { format } from 'date-fns';

export default function ExportManager() {
  const queryClient = useQueryClient();
  const [downloadingJobs, setDownloadingJobs] = useState<Set<string>>(new Set());

  // Fetch export history
  const { data: exports, isLoading, refetch } = useQuery({
    queryKey: ['exportHistory'],
    queryFn: () => exportService.getExportHistory(50),
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  // Auto-refresh for pending/processing jobs
  useEffect(() => {
    const hasPendingJobs = exports?.some(
      job => job.status === 'pending' || job.status === 'processing'
    );
    
    if (hasPendingJobs) {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [exports, refetch]);

  const handleDownload = async (job: ExportJob) => {
    if (!job.downloadUrl || downloadingJobs.has(job.id)) return;

    setDownloadingJobs(prev => new Set(prev).add(job.id));

    try {
      const blob = await exportService.downloadExport(job.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${job.id}.${job.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingJobs(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="action" />;
      case 'processing':
        return <ProcessingIcon color="primary" />;
    }
  };

  const getStatusChip = (status: ExportJob['status']) => {
    const statusConfig = {
      completed: { label: 'Completed', color: 'success' as const },
      failed: { label: 'Failed', color: 'error' as const },
      pending: { label: 'Pending', color: 'default' as const },
      processing: { label: 'Processing', color: 'primary' as const },
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={getStatusIcon(status)}
      />
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Export History</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {exports && exports.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Quality</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exports.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    {format(new Date(job.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Chip label={job.format} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {job.quality ? `${job.quality}%` : '-'}
                  </TableCell>
                  <TableCell>{getStatusChip(job.status)}</TableCell>
                  <TableCell>
                    {job.status === 'completed' && job.downloadUrl && (
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() => handleDownload(job)}
                          disabled={downloadingJobs.has(job.id)}
                          size="small"
                        >
                          {downloadingJobs.has(job.id) ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DownloadIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    {job.status === 'failed' && job.error && (
                      <Tooltip title={job.error}>
                        <IconButton size="small">
                          <ErrorIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No export history yet
          </Typography>
        </Paper>
      )}
    </Box>
  );
}