import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillerStatusSync } from '../BillerStatusContext';
import { useTheme, alpha } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

  import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Button
  } from '@mui/material';
  import axios from 'axios';

  interface Biller {
    id: number;
    name: string;
    status: string;
  }

  type Status = 'not_started' | 'in_progress' | 'go_live';
  
  const statusOptions: { value: Status; label: string; color: string }[] = [
    { value: 'go_live', label: 'Go Live', color: '#2e7d32' },
    { value: 'in_progress', label: 'In Progress', color: '#1565c0' },
    { value: 'not_started', label: 'Not Started', color: '#c62828' },
  ];

  const BillerList = () => {
  const navigate = useNavigate();
  const { subscribe, publish } = useBillerStatusSync();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
    const [billers, setBillers] = useState<Biller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

    const handleStatusChange = async (billerId: number, newStatus: Status) => {
  if (newStatus === 'go_live') {
    // Redirect to GoLiveRedirect, pass billerId
    navigate('/go-live', { state: { billerId } });
    return;
  }
  // Existing logic for other status changes
  try {
    setUpdatingStatus(billerId);
    const response = await axios.post(
      `http://localhost:5000/api/billers/${billerId}/status`,
      { status: newStatus.toLowerCase() }
    );
    if (response.data.success) {
      setBillers(prevBillers =>
        prevBillers.map(biller =>
          biller.id === billerId
            ? { ...biller, status: newStatus }
            : biller
        )
      );
      // Publish biller status change for real-time sync
      const biller = billers.find(b => b.id === billerId);
      if (biller) {
        publish({ id: biller.name, status: newStatus });
      }
      setError(null); // Clear any previous errors
    } else {
      throw new Error(response.data.error || 'Failed to update status');
    }
  } catch (error: any) {
    console.error('Error updating status:', error);
    if (error.response && error.response.data && error.response.data.error) {
      // Handle backend validation error messages
      setError(error.response.data.error);
    } else {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update biller status'
      );
    }
  } finally {
    setUpdatingStatus(null);
  }
};

    const fetchBillers = async (search?: string) => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('http://localhost:5000/api/billers', {
          params: { search }
        });
        console.log('API Response:', response.data);
        
        if (!response.data || !response.data.success) {
          throw new Error('No data received from server');
        }
        
        const { data: billerData } = response.data;
        
        if (!Array.isArray(billerData) || billerData.length === 0) {
          throw new Error('No biller data available');
        }
        
        setBillers(billerData);
      } catch (error) {
        console.error('Error fetching billers:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch biller data'
        );
      } finally {
        setLoading(false);
      }
    };
    useEffect(() => {
      fetchBillers();
      // Subscribe to biller status changes
      const unsubscribe = subscribe(event => {
        setBillers(prevBillers =>
          prevBillers.map(biller =>
            biller.name === event.id
              ? { ...biller, status: event.status }
              : biller
          )
        );
      });
      return () => unsubscribe();
    }, [subscribe]);

    if (loading) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          bgcolor: isDark ? theme.palette.background.paper : '#ffffff',
          borderRadius: 1,
          p: 3,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
          border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
        }}>
          <CircularProgress sx={{ color: '#dc004e', mb: 2 }} />
          <Typography sx={{ color: 'rgba(0,0,0,0.7)' }}>Loading biller data...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          bgcolor: isDark ? theme.palette.background.paper : '#ffffff',
          borderRadius: 1,
          p: 3,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
          border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
        }}>
          <Typography sx={{ color: '#dc004e', textAlign: 'center', mb: 2 }}>
            Error: {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => fetchBillers()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      );
    }

    if (billers.length === 0) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          bgcolor: isDark ? theme.palette.background.paper : '#ffffff',
          borderRadius: 1,
          p: 3,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
          border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
        }}>
          <Typography sx={{ color: 'rgba(0,0,0,0.7)', textAlign: 'center' }}>
            No biller data available
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => fetchBillers()}
            sx={{ mt: 2 }}
          >
            Refresh Data
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{
        mb: 4,
        bgcolor: isDark ? theme.palette.background.paper : '#ffffff',
        p: 3,
        borderRadius: 1,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
        border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              color: '#dc004e',
              fontWeight: 'bold',
            }}
          >
            Biller List
          </Typography>
          <Box
            component="form"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              width: '300px'
            }}
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search billers..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                
                // Clear existing timeout
                if (searchTimeout) {
                  clearTimeout(searchTimeout);
                }
                
                // Set new timeout for search
                const timeout = setTimeout(() => {
                  fetchBillers(query);
                }, 300);
                
                setSearchTimeout(timeout);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: isDark ? `1px solid ${theme.palette.divider}` : '1px solid #ddd',
                width: '100%',
                background: isDark ? theme.palette.background.default : '#fff',
                color: isDark ? '#fff' : '#000',
                fontSize: '14px'
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          const worksheet = XLSX.utils.json_to_sheet(billers.map(({ id, name, status }) => ({ ID: id, Name: name, Status: status })));
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Billers');
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
          saveAs(data, 'biller_list.xlsx');
        }}
        sx={{ mb: 1 }}
      >
        Export to Excel
      </Button>
    </Box>
    <TableContainer component={Paper} sx={{ boxShadow: 'none', maxHeight: '600px', overflow: 'auto' }}>
          <Table sx={{ minWidth: 650 }} stickyHeader>
            <TableHead sx={{ backgroundColor: isDark ? theme.palette.background.paper : '#f5f5f5', zIndex: 1 }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: isDark ? theme.palette.background.paper : '#f5f5f5', zIndex: 2 }}>Biller Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: isDark ? theme.palette.background.paper : '#f5f5f5', zIndex: 2 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {billers.map((biller) => (
                <TableRow
                  key={biller.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{biller.name}</TableCell>
                  <TableCell>
                    <select
                      value={biller.status}
                      onChange={(e) => handleStatusChange(biller.id, e.target.value as Status)}
                      disabled={updatingStatus === biller.id}
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: 
                          biller.status === 'not_started' ? '#ffebee' :
                          biller.status === 'in_progress' ? '#e3f2fd' :
                          biller.status === 'go_live' ? '#e8f5e9' :
                          '#f5f5f5',
                        color:
                          biller.status === 'not_started' ? '#c62828' :
                          biller.status === 'in_progress' ? '#1565c0' :
                          biller.status === 'go_live' ? '#2e7d32' :
                          '#616161',
                        cursor: updatingStatus === biller.id ? 'wait' : 'pointer',
                        minWidth: '120px'
                      }}
                    >
                      {statusOptions.map(option => (
                        <option
                          key={option.value}
                          value={option.value}
                          style={{ color: option.color }}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  import ErrorBoundary from './ErrorBoundary';

const BillerListWithBoundary = () => (
  <ErrorBoundary>
    <BillerList />
  </ErrorBoundary>
);

export default BillerListWithBoundary;