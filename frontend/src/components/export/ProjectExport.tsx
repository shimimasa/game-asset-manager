import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  SelectAll as SelectAllIcon,
  DeselectAll as DeselectAllIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';
import { exportService, ExportOptions } from '../../services/exportService';
import { Asset } from '../../types';
import AssetCard from '../assets/AssetCard';
import ExportDialog from './ExportDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

export default function ProjectExport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Fetch project
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  });

  // Fetch project assets
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['projectAssets', id],
    queryFn: () => projectService.getProjectAssets(id!, { limit: 1000 }),
    enabled: !!id,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (options: ExportOptions) => {
      const assetIds = selectedAssets.size > 0 
        ? Array.from(selectedAssets)
        : undefined;
      
      return exportService.exportProject(id!, { ...options, assetIds });
    },
    onSuccess: () => {
      setExportSuccess(true);
      setExportDialogOpen(false);
      setTimeout(() => {
        navigate('/exports');
      }, 2000);
    },
  });

  const handleToggleAsset = (assetId: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (assetsData?.assets) {
      setSelectedAssets(new Set(assetsData.assets.map(a => a.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAssets(new Set());
  };

  const handleExport = async (options: ExportOptions) => {
    await exportMutation.mutateAsync(options);
  };

  if (projectLoading) return <LoadingSpinner message="Loading project..." />;
  if (projectError) return <ErrorAlert error={projectError} />;
  if (!project) return <ErrorAlert error="Project not found" />;

  const assets = assetsData?.assets || [];
  const hasAssets = assets.length > 0;
  const allSelected = hasAssets && selectedAssets.size === assets.length;
  const noneSelected = selectedAssets.size === 0;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit">
          Projects
        </Link>
        <Link component={RouterLink} to={`/projects/${id}`} color="inherit">
          {project.name}
        </Link>
        <Typography color="text.primary">Export</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/projects/${id}`)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">Export Project</Typography>
        </Box>
      </Box>

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Export started successfully! Redirecting to export manager...
        </Alert>
      )}

      {/* Project info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>{project.name}</Typography>
        {project.description && (
          <Typography variant="body2" color="text.secondary">
            {project.description}
          </Typography>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Asset selection */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Select Assets to Export</Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAll}
            disabled={!hasAssets || allSelected}
          >
            Select All
          </Button>
          <Button
            startIcon={<DeselectAllIcon />}
            onClick={handleDeselectAll}
            disabled={!hasAssets || noneSelected}
          >
            Deselect All
          </Button>
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
            disabled={!hasAssets}
          >
            Export {noneSelected ? 'All' : selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
          </Button>
        </Box>
      </Box>

      {/* Info message */}
      <Alert severity="info" sx={{ mb: 3 }}>
        {noneSelected 
          ? 'All assets in this project will be exported.'
          : `${selectedAssets.size} asset${selectedAssets.size !== 1 ? 's' : ''} selected for export.`}
      </Alert>

      {/* Assets grid */}
      {assetsLoading ? (
        <LoadingSpinner message="Loading assets..." />
      ) : hasAssets ? (
        <Grid container spacing={3}>
          {assets.map((asset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
              <Box position="relative">
                <Box
                  position="absolute"
                  top={8}
                  left={8}
                  zIndex={1}
                >
                  <Checkbox
                    checked={selectedAssets.has(asset.id)}
                    onChange={() => handleToggleAsset(asset.id)}
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      }
                    }}
                  />
                </Box>
                <AssetCard
                  asset={asset}
                  onSelect={() => handleToggleAsset(asset.id)}
                  selected={selectedAssets.has(asset.id)}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No assets in this project to export
          </Typography>
        </Box>
      )}

      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        title={`Export ${project.name}`}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
      />
    </Box>
  );
}