import React, { useState, useEffect } from 'react';
import { useBillerStatusSync } from '../BillerStatusContext';
import axios from 'axios';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Link,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Search, Launch } from '@mui/icons-material';

interface MFIData {
  MFI: string;
  Web: string;
  Status: string;
}

interface Props {
  onDashboardUpdate?: (data: any) => void;
}

const STATUS_OPTIONS = [
  { value: 'not_started', display: 'Not Started' },
  { value: 'in_progress', display: 'In Progress' },
  { value: 'go_live', display: 'Go Live' },
];

const UnavailableMFIList: React.FC<Props> = ({ onDashboardUpdate }) => {
  const { subscribe, publish } = useBillerStatusSync();
  const [mfiData, setMFIData] = useState<MFIData[]>([]);
  const [filteredData, setFilteredData] = useState<MFIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const theme = useTheme();

  const fetchData = async () => {
    try {
      console.log('Fetching MFI data...');
      const response = await axios.get('http://localhost:5000/api/unavailable-mfi');
      console.log('API Response:', response.data);
      
      if (Array.isArray(response.data)) {
        setMFIData(response.data);
        setFilteredData(response.data);
        setError(null);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      console.error('Error fetching MFI data:', err);
      setError('Failed to load MFI data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Subscribe to biller status changes
    const unsubscribe = subscribe((event: { id: string; status: string }) => {
      setMFIData(prev =>
        prev.map(item =>
          item.MFI === event.id ? { ...item, Status: event.status } : item
        )
      );
      setFilteredData(prev =>
        prev.map(item =>
          item.MFI === event.id ? { ...item, Status: event.status } : item
        )
      );
    });
    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
    const filtered = mfiData.filter(mfi =>
      mfi.MFI.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, mfiData]);

  const formatUrl = (url: string): string => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleStatusChange = async (mfi: string, newStatus: string) => {
    setUpdatingStatus(mfi);
    try {
      const statusValue = newStatus; // newStatus is already the value format
      if (!statusValue) throw new Error('Invalid status');
      
      const response = await axios.post('http://localhost:5000/api/unavailable-mfi/status', {
        MFI: mfi,
        Status: statusValue
      });
      
      if (response.data.dashboard && onDashboardUpdate) {
        onDashboardUpdate(response.data.dashboard);
      }
      
      const updatedData = mfiData.map(item => 
        item.MFI === mfi ? { ...item, Status: newStatus } : item // Keep using the value format
      );
      setMFIData(updatedData);
      setFilteredData(updatedData.filter(mfi =>
        mfi.MFI.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      // Publish for real-time sync
      publish({ id: mfi, status: newStatus }); // mfi is the name string
      
      setNotification({
        message: 'Status updated successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setNotification({
        message: 'Failed to update status. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading MFI data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <Typography variant="h5" component="h2" color="primary">
          Unavailable MFI List
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Total: {filteredData.length}
          </Typography>
          <TextField
            size="small"
            placeholder="Search MFI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'background.paper',
                width: '200px',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }
            }}
          />
        </Stack>
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                MFI Name
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                Website
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((mfi, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { 
                      backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <TableCell>{mfi.MFI}</TableCell>
                  <TableCell>
                    {mfi.Web ? (
                      <Link
                        href={formatUrl(mfi.Web)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          }
                        }}
                      >
                        {mfi.Web}
                        <Launch sx={{ fontSize: '1rem', ml: 0.5 }} />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={mfi.Status}
                      onChange={(e: SelectChangeEvent) => handleStatusChange(mfi.MFI, e.target.value)}
                      disabled={updatingStatus === mfi.MFI}
                      sx={{
                        minWidth: 120,
                        '& .MuiSelect-select': {
                          py: 0.5,
                        }
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.display}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery ? 'No matching MFI found' : 'No MFI data available'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        message={notification?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            bgcolor: notification?.type === 'success' ? 'success.main' : 'error.main'
          }
        }}
      />
    </Box>
  );
};

export default UnavailableMFIList;
