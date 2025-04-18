import React, { useState, useEffect } from 'react';
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

interface BillerData {
  Biller: string;
  Category: string;
  Status: string;  // "Not started", "In progress", "Go Live"
  Web: string;
}

interface Props {
  onDashboardUpdate?: (data: any) => void;
}

const STATUS_OPTIONS = [
  { value: 'not_started', display: 'Not Started' },
  { value: 'in_progress', display: 'In Progress' },
  { value: 'go_live', display: 'Go Live' },
] as const;

const Top50BillersList: React.FC<Props> = ({ onDashboardUpdate }) => {
  const [billerData, setBillerData] = useState<BillerData[]>([]);
  const [filteredData, setFilteredData] = useState<BillerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const theme = useTheme();

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/top-50-billers');
      if (Array.isArray(response.data)) {
        setBillerData(response.data);
        setFilteredData(response.data);
        setError(null);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      console.error('Error fetching biller data:', err);
      setError('Failed to load biller data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on search query
  useEffect(() => {
    const filtered = billerData.filter(biller =>
      biller.Biller.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, billerData]);

  const handleStatusChange = async (biller: string, newStatus: string) => {
    setUpdatingStatus(biller);
    try {
      const response = await axios.post('http://localhost:5000/api/top-50-billers/status', {
        Biller: biller,
        Status: newStatus  // Already matches API format
      });
  
      // Update local state
      const updatedData = billerData.map(item => 
        item.Biller === biller ? { ...item, Status: newStatus } : item
      );
      setBillerData(updatedData);
      setFilteredData(updatedData.filter(biller =>
        biller.Biller.toLowerCase().includes(searchQuery.toLowerCase())
      ));
  
      // Update dashboard if callback provided
      if (onDashboardUpdate) {
        // If the backend provided dashboard data, use it
        if (response.data.dashboard) {
          onDashboardUpdate(response.data.dashboard);
        } else {
          // Otherwise, fetch the latest dashboard data
          try {
            const statusResponse = await axios.get('http://localhost:5000/api/top-50-status');
            if (statusResponse.data) {
              onDashboardUpdate(statusResponse.data);
            }
          } catch (err) {
            console.error('Error fetching updated dashboard data:', err);
          }
        }
      }
  
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
          Loading biller data...
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
          Top 50 Billers List
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Total: {filteredData.length}
          </Typography>
          <TextField
            size="small"
            placeholder="Search Biller..."
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
                Biller Name
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((biller, index) => (
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
                  <TableCell>{biller.Biller}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={biller.Status}
                      onChange={(e: SelectChangeEvent) => handleStatusChange(biller.Biller, e.target.value)}
                      disabled={updatingStatus === biller.Biller}
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
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery ? 'No matching biller found' : 'No biller data available'}
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

export default Top50BillersList;
