import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { Project, CreateProjectData } from '../../types';

interface ProjectEditorProps {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (data: CreateProjectData) => void;
}

export default function ProjectEditor({ open, project, onClose, onSave }: ProjectEditorProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [project]);

  const handleChange = (field: keyof CreateProjectData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {project ? 'Edit Project' : 'Create Project'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Project Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            fullWidth
            autoFocus
            helperText="Give your project a memorable name"
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={4}
            fullWidth
            helperText="Describe the purpose of this project (optional)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name.trim()}
        >
          {project ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}