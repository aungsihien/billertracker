import { useEffect, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

interface StatusCounts {
  not_started: number;
  in_progress: number;
  go_live: number;
}

const BillerStatusChart = () => {
  const [statusData, setStatusData] = useState<StatusCounts>({
    not_started: 0,
    in_progress: 0,
    go_live: 0
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        setCategories(['all', ...response.data]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch categories');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `http://localhost:5000/api/biller-status${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;
        const response = await axios.get(url);
        if (response.data && typeof response.data === 'object') {
          setStatusData({
            not_started: Number(response.data.not_started) || 0,
            in_progress: Number(response.data.in_progress) || 0,
            go_live: Number(response.data.go_live) || 0
          });
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (error) {
        console.error('Error fetching biller status:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch biller status');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const chartData = [
    {
      name: 'Not Started',
      value: statusData.not_started,
      color: '#FF8042'
    },
    {
      name: 'In Progress',
      value: statusData.in_progress,
      color: '#dc004e'
    },
    {
      name: 'Go Live',
      value: statusData.go_live,
      color: '#00C49F'
    }
  ];

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        bgcolor: '#ffffff',
        borderRadius: 1,
        p: 3,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <CircularProgress sx={{ color: '#dc004e', mb: 2 }} />
        <Typography sx={{ color: 'rgba(0,0,0,0.7)' }}>Loading chart data...</Typography>
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
        bgcolor: '#ffffff',
        borderRadius: 1,
        p: 3,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Typography sx={{ color: '#dc004e', textAlign: 'center', mb: 2 }}>
          Error: {error}
        </Typography>
        <Typography sx={{ color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          Please try refreshing the page
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      mb: 4,
      bgcolor: '#ffffff',
      p: 3,
      borderRadius: 1,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid rgba(0,0,0,0.1)'
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            color: '#dc004e',
            fontWeight: 'bold'
          }}
        >
          All Biller Status
        </Typography>
        <FormControl
          sx={{
            minWidth: 120,
            '& .MuiInputLabel-root': {
              color: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <InputLabel id="category-select-label">Category</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={selectedCategory}
            label="Category"
            onChange={handleCategoryChange}
            sx={{
              color: 'rgba(0,0,0,0.87)',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0,0,0,0.1)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#dc004e'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#dc004e'
              }
            }}
          >
            {categories.map((category) => (
              <MenuItem
                key={category}
                value={category}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(220,0,78,0.1)'
                  }
                }}
              >
                {category === 'all' ? 'All Categories' : category}  
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis dataKey="name" stroke="rgba(0,0,0,0.7)" />
          <YAxis stroke="rgba(0,0,0,0.7)" />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}
            labelStyle={{ color: 'rgba(0,0,0,0.87)' }}
            itemStyle={{ color: 'rgba(0,0,0,0.7)' }}
          />
          <Legend
            wrapperStyle={{
              color: 'rgba(0,0,0,0.7)',
              paddingTop: '20px'
            }}
          />
          <Bar dataKey="value" name="Count">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BillerStatusChart;