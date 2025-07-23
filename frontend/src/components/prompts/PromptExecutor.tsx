import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { promptService } from '../../services/promptService';
import { Prompt, PromptExecution } from '../../types';
import ExecutionStatus from './ExecutionStatus';

interface PromptExecutorProps {
  open: boolean;
  prompt: Prompt | null;
  onClose: () => void;
}

export default function PromptExecutor({ open, prompt, onClose }: PromptExecutorProps) {
  const queryClient = useQueryClient();
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [execution, setExecution] = useState<PromptExecution | null>(null);

  React.useEffect(() => {
    if (prompt) {
      setParameters(prompt.parameters || {});
      setExecution(null);
    }
  }, [prompt]);

  const executeMutation = useMutation({
    mutationFn: () => promptService.executePrompt(prompt!.id, parameters),
    onSuccess: (data) => {
      setExecution(data);
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      
      // Poll for status updates
      if (data.status === 'PENDING' || data.status === 'PROCESSING') {
        pollStatus(data.id);
      }
    },
  });

  const pollStatus = async (executionId: string) => {
    const interval = setInterval(async () => {
      try {
        const updated = await promptService.getExecution(executionId);
        setExecution(updated);
        
        if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters({
      ...parameters,
      [key]: value,
    });
  };

  const handleExecute = () => {
    if (prompt) {
      executeMutation.mutate();
    }
  };

  const handleClose = () => {
    setExecution(null);
    onClose();
  };

  if (!prompt) return null;

  const isImage = prompt.type === 'IMAGE';
  const isExecuting = executeMutation.isPending || execution?.status === 'PENDING' || execution?.status === 'PROCESSING';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Execute Prompt: {prompt.title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {prompt.content}
            </Typography>
          </Alert>

          <Typography variant="subtitle2">Parameters</Typography>
          
          {isImage ? (
            <>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={parameters.size || '1024x1024'}
                  onChange={(e) => handleParameterChange('size', e.target.value)}
                  label="Size"
                  disabled={isExecuting}
                >
                  <MenuItem value="256x256">256x256</MenuItem>
                  <MenuItem value="512x512">512x512</MenuItem>
                  <MenuItem value="1024x1024">1024x1024</MenuItem>
                  <MenuItem value="1792x1024">1792x1024</MenuItem>
                  <MenuItem value="1024x1792">1024x1792</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={parameters.quality || 'standard'}
                  onChange={(e) => handleParameterChange('quality', e.target.value)}
                  label="Quality"
                  disabled={isExecuting}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="hd">HD</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Style</InputLabel>
                <Select
                  value={parameters.style || 'vivid'}
                  onChange={(e) => handleParameterChange('style', e.target.value)}
                  label="Style"
                  disabled={isExecuting}
                >
                  <MenuItem value="vivid">Vivid</MenuItem>
                  <MenuItem value="natural">Natural</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <TextField
                label="Duration (seconds)"
                type="number"
                value={parameters.duration || 60}
                onChange={(e) => handleParameterChange('duration', parseInt(e.target.value))}
                inputProps={{ min: 5, max: 300 }}
                fullWidth
                disabled={isExecuting}
              />

              <TextField
                label="Genre"
                value={parameters.genre || ''}
                onChange={(e) => handleParameterChange('genre', e.target.value)}
                fullWidth
                disabled={isExecuting}
              />

              <TextField
                label="Mood"
                value={parameters.mood || ''}
                onChange={(e) => handleParameterChange('mood', e.target.value)}
                fullWidth
                disabled={isExecuting}
              />
            </>
          )}

          {execution && (
            <Box mt={2}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Typography variant="subtitle2">Execution Status</Typography>
                <ExecutionStatus status={execution.status} />
              </Box>
              
              {isExecuting && <LinearProgress />}
              
              {execution.status === 'COMPLETED' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Generation completed successfully!
                  {execution.generatedAsset && (
                    <Button
                      size="small"
                      onClick={() => window.open(execution.generatedAsset!.storageUrl, '_blank')}
                      sx={{ ml: 2 }}
                    >
                      View Result
                    </Button>
                  )}
                </Alert>
              )}
              
              {execution.status === 'FAILED' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {execution.error || 'Generation failed'}
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          onClick={handleExecute}
          variant="contained"
          disabled={isExecuting}
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}