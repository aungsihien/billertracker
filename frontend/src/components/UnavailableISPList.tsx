import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Stack,
  Link,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar
} from '@mui/material';
import { Search, Launch } from '@mui/icons-material';
import axios from 'axios';

interface ISPData {
  ISP: string;
  Web: string;
  Status: string;
}

const STATUS_OPTIONS = [
  { display: 'Not Started', value: 'not_started' ,color: '#2e7d32'},
  { display: 'In Progress', value: 'in_progress' ,color: '#1565c0'},
  { display: 'Go Live', value: 'go_live', color: '#2e7d32' }
] as const;

type StatusType = typeof STATUS_OPTIONS[number]['display'];

interface DashboardData {
  target_count: number;
  unavailable_isp: number;
  unavailable_mfi: number;
  last_updated: string | null;
}

interface Props {
  onDashboardUpdate?: (data: DashboardData) => void;
}

const UnavailableISPList: React.FC<Props> = ({ onDashboardUpdate }) => {
  const [ispData, setISPData] = useState<ISPData[]>([]);
  const [filteredData, setFilteredData] = useState<ISPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const theme = useTheme();

  const fetchData = async () => {
    try {
      console.log('Fetching ISP data...');
      const response = await axios.get('http://localhost:5000/api/unavailable-isp');
      console.log('API Response:', response.data);
      
      if (Array.isArray(response.data)) {
        setISPData(response.data);
        setFilteredData(response.data);
        setError(null);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      console.error('Error fetching ISP data:', err);
      setError('Failed to load ISP data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search
  useEffect(() => {
    const filtered = ispData.filter(isp =>
      isp.ISP.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, ispData]);

  const formatUrl = (url: string): string => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const handleStatusChange = async (isp: string, newStatus: string) => {
    setUpdatingStatus(isp);
    try {
      const statusValue = STATUS_OPTIONS.find(s => s.display === newStatus)?.value;
      if (!statusValue) throw new Error('Invalid status');
      
      const response = await axios.post('http://localhost:5000/api/unavailable-isp/status', {
        ISP: isp,
        Status: statusValue
      });
      
      // Update dashboard if needed
      if (response.data.dashboard && onDashboardUpdate) {
        onDashboardUpdate(response.data.dashboard);
      }
      
      // Update local state
      const updatedData = ispData.map(item => 
        item.ISP === isp ? { ...item, Status: newStatus } : item
      );
      setISPData(updatedData);
      setFilteredData(updatedData.filter(isp =>
        isp.ISP.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
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
          Loading ISP data...
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
          Unavailable ISP List
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Total: {filteredData.length}
          </Typography>
          <TextField
            size="small"
            placeholder="Search ISP..."
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
                ISP Name
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
              filteredData.map((isp, index) => (
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
                  <TableCell>{isp.ISP}</TableCell>
                  <TableCell>
                    {isp.Web ? (
                      <Link
                        href={formatUrl(isp.Web)}
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
                        {isp.Web}
                        <Launch sx={{ fontSize: '1rem', ml: 0.5 }} />
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={isp.Status}
                      onChange={(e: SelectChangeEvent) => handleStatusChange(isp.ISP, e.target.value)}
                      disabled={updatingStatus === isp.ISP}
                      sx={{
                        minWidth: 120,
                        '& .MuiSelect-select': {
                          py: 0.5,
                        }
                      }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.display}>
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
                    {searchQuery ? 'No matching ISP found' : 'No ISP data available'}
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

export default UnavailableISPList;
