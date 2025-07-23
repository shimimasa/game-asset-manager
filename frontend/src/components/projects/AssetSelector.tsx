import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { assetService, AssetFilters } from '../../services/assetService';
import { Asset } from '../../types';
import AssetCard from '../assets/AssetCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

interface AssetSelectorProps {
  open: boolean;
  selectedAssets?: string[];
  onClose: () => void;
  onSelect: (assetIds: string[]) => void;
}

export default function AssetSelector({ 
  open, 
  selectedAssets = [], 
  onClose, 
  onSelect 
}: AssetSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedAssets));
  const [filters, setFilters] = useState<AssetFilters>({ limit: 100 });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetService.getAssets(filters),
    enabled: open,
  });

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput,
    });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({
      ...filters,
      search: undefined,
    });
  };

  const handleFileTypeChange = (fileType: string) => {
    setFilters({
      ...filters,
      fileType: fileType as 'IMAGE' | 'AUDIO' | undefined,
    });
  };

  const handleToggleAsset = (asset: Asset) => {
    const newSelected = new Set(selected);
    if (newSelected.has(asset.id)) {
      newSelected.delete(asset.id);
    } else {
      newSelected.add(asset.id);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (data?.data) {
      const allIds = new Set(data.data.map(asset => asset.id));
      setSelected(allIds);
    }
  };

  const handleDeselectAll = () => {
    setSelected(new Set());
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Select Assets</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search assets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
            size="small"
          />
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.fileType || ''}
              onChange={(e) => handleFileTypeChange(e.target.value)}
              label="Type"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="IMAGE">Images</MenuItem>
              <MenuItem value="AUDIO">Audio</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button size="small" onClick={handleDeselectAll}>
            Deselect All
          </Button>
        </Box>

        {/* Selection count */}
        <Typography variant="body2" color="text.secondary" mb={2}>
          {selected.size} asset{selected.size !== 1 ? 's' : ''} selected
        </Typography>

        {/* Assets grid */}
        {isLoading ? (
          <LoadingSpinner message="Loading assets..." />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : data?.data && data.data.length > 0 ? (
          <Grid container spacing={2}>
            {data.data.map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <Box position="relative">
                  <Box
                    position="absolute"
                    top={8}
                    left={8}
                    zIndex={1}
                  >
                    <Checkbox
                      checked={selected.has(asset.id)}
                      onChange={() => handleToggleAsset(asset)}
                      color="primary"
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
                    onSelect={() => handleToggleAsset(asset)}
                    selected={selected.has(asset.id)}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No assets found
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selected.size === 0}
        >
          Add {selected.size} Asset{selected.size !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}