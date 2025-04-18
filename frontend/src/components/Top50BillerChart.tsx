import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import axios from 'axios';

interface StatusCounts {
  not_started: number;
  in_progress: number;
  go_live: number;
}

const Top50BillerChart = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
        const url = `http://localhost:5000/api/top-50-status${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;
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
        console.error('Error fetching top 50 biller status:', error);
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

  const COLORS = ['#FF8042', '#dc004e', '#00C49F'];

  const chartData = [
    {
      name: 'Not Started',
      value: statusData.not_started,
    },
    {
      name: 'In Progress',
      value: statusData.in_progress,
    },
    {
      name: 'Go Live',
      value: statusData.go_live,
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
        bgcolor: isDark ? theme.palette.background.paper : '#ffffff',
        borderRadius: 1,
        p: 3,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
        border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
      }}>
        <CircularProgress sx={{ color: '#dc004e', mb: 2 }} />
        <Typography sx={{ color: isDark ? theme.palette.text.primary : 'rgba(0,0,0,0.7)' }}>Loading chart data...</Typography>
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
        <Typography sx={{ color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          Please try refreshing the page
        </Typography>
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
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`
      }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            color: '#dc004e',
            fontWeight: 'bold'
          }}
        >
          Top 50 Biller Status
        </Typography>
        <FormControl
          sx={{
            minWidth: 120,
            '& .MuiInputLabel-root': {
              color: isDark ? '#fff' : 'rgba(0,0,0,0.7)'
            }
          }}
        >
          
        </FormControl>
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: `1px solid ${isDark ? theme.palette.divider : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}
            labelStyle={{ color: 'rgba(0,0,0,0.87)' }}
            itemStyle={{ color: isDark ? '#000000' : 'rgba(0,0,0,0.7)' }}
          />
          <Legend
            wrapperStyle={{
              color: isDark ? '#fff' : 'rgba(0,0,0,0.7)',
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default Top50BillerChart;