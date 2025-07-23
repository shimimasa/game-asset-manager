import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService, AssetFilters } from '../../services/assetService';
import { Asset } from '../../types';
import AssetCard from './AssetCard';
import AssetUpload from './AssetUpload';
import AssetDetail from './AssetDetail';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';

const ITEMS_PER_PAGE = 12;

export default function Assets() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AssetFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [searchInput, setSearchInput] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  // Fetch assets
  const { data, isLoading, error } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetService.getAssets(filters),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setDeleteAsset(null);
    },
  });

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput,
      offset: 0,
    });
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({
      ...filters,
      search: undefined,
      offset: 0,
    });
    setPage(1);
  };

  const handleFileTypeChange = (fileType: string) => {
    setFilters({
      ...filters,
      fileType: fileType as 'IMAGE' | 'AUDIO' | undefined,
      offset: 0,
    });
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setFilters({
      ...filters,
      offset: (value - 1) * ITEMS_PER_PAGE,
    });
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
  };

  const handleAssetUpdate = (updatedAsset: Asset) => {
    queryClient.setQueryData(['assets', filters], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((asset: Asset) =>
          asset.id === updatedAsset.id ? updatedAsset : asset
        ),
      };
    });
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    setUploadOpen(false);
  };

  if (isLoading) return <LoadingSpinner message="Loading assets..." />;
  if (error) return <ErrorAlert error={error} />;

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 1;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Assets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload Assets
        </Button>
      </Box>

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
        />
        <FormControl sx={{ minWidth: 120 }}>
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
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        {data?.total || 0} assets found
      </Typography>

      {/* Assets grid */}
      {data?.data && data.data.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {data.data.map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <AssetCard
                  asset={asset}
                  onEdit={handleAssetClick}
                  onDelete={setDeleteAsset}
                  onSelect={handleAssetClick}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No assets found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {filters.search ? 'Try adjusting your search criteria' : 'Upload your first asset to get started'}
          </Typography>
          {!filters.search && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadOpen(true)}
            >
              Upload Assets
            </Button>
          )}
        </Box>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Assets</DialogTitle>
        <DialogContent>
          <AssetUpload onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      {/* Asset detail dialog */}
      <AssetDetail
        asset={selectedAsset}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleAssetUpdate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteAsset}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deleteAsset?.filename}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => deleteAsset && deleteMutation.mutate(deleteAsset.id)}
        onCancel={() => setDeleteAsset(null)}
      />
    </Box>
  );
}