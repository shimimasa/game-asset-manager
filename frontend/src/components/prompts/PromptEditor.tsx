import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Prompt, CreatePromptData } from '../../types';

interface PromptEditorProps {
  open: boolean;
  prompt?: Prompt | null;
  onClose: () => void;
  onSave: (data: CreatePromptData) => void;
}

const DEFAULT_IMAGE_PARAMS = {
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
};

const DEFAULT_AUDIO_PARAMS = {
  duration: 60,
  genre: 'electronic',
  mood: 'upbeat',
};

export default function PromptEditor({ open, prompt, onClose, onSave }: PromptEditorProps) {
  const [formData, setFormData] = useState<CreatePromptData>({
    title: '',
    content: '',
    type: 'IMAGE',
    parameters: DEFAULT_IMAGE_PARAMS,
  });

  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        content: prompt.content,
        type: prompt.type,
        parameters: prompt.parameters || (prompt.type === 'IMAGE' ? DEFAULT_IMAGE_PARAMS : DEFAULT_AUDIO_PARAMS),
      });
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'IMAGE',
        parameters: DEFAULT_IMAGE_PARAMS,
      });
    }
  }, [prompt]);

  const handleChange = (field: keyof CreatePromptData, value: any) => {
    if (field === 'type') {
      setFormData({
        ...formData,
        type: value,
        parameters: value === 'IMAGE' ? DEFAULT_IMAGE_PARAMS : DEFAULT_AUDIO_PARAMS,
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [key]: value,
      },
    });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const isImage = formData.type === 'IMAGE';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {prompt ? 'Edit Prompt' : 'Create Prompt'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              label="Type"
              disabled={!!prompt}
            >
              <MenuItem value="IMAGE">Image</MenuItem>
              <MenuItem value="AUDIO">Audio</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Prompt Content"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            multiline
            rows={6}
            required
            fullWidth
            helperText={`Describe the ${isImage ? 'image' : 'audio'} you want to generate`}
          />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <CodeIcon />
                <Typography>Advanced Parameters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {isImage ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Size</InputLabel>
                    <Select
                      value={formData.parameters?.size || '1024x1024'}
                      onChange={(e) => handleParameterChange('size', e.target.value)}
                      label="Size"
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
                      value={formData.parameters?.quality || 'standard'}
                      onChange={(e) => handleParameterChange('quality', e.target.value)}
                      label="Quality"
                    >
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="hd">HD</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Style</InputLabel>
                    <Select
                      value={formData.parameters?.style || 'vivid'}
                      onChange={(e) => handleParameterChange('style', e.target.value)}
                      label="Style"
                    >
                      <MenuItem value="vivid">Vivid</MenuItem>
                      <MenuItem value="natural">Natural</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Duration (seconds)"
                    type="number"
                    value={formData.parameters?.duration || 60}
                    onChange={(e) => handleParameterChange('duration', parseInt(e.target.value))}
                    inputProps={{ min: 5, max: 300 }}
                    fullWidth
                  />

                  <TextField
                    label="Genre"
                    value={formData.parameters?.genre || ''}
                    onChange={(e) => handleParameterChange('genre', e.target.value)}
                    fullWidth
                    helperText="e.g., electronic, classical, rock"
                  />

                  <TextField
                    label="Mood"
                    value={formData.parameters?.mood || ''}
                    onChange={(e) => handleParameterChange('mood', e.target.value)}
                    fullWidth
                    helperText="e.g., upbeat, calm, dramatic"
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.title || !formData.content}
        >
          {prompt ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}