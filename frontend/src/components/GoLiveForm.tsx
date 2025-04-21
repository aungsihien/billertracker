import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface GoLiveFormProps {
  onSubmit: (integrationDate: string, onboardingDate: string) => void;
  onCancel: () => void;
}

const GoLiveForm: React.FC<GoLiveFormProps> = ({ onSubmit, onCancel }) => {
  const [integrationDate, setIntegrationDate] = useState('');
  const [onboardingDate, setOnboardingDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrationDate || !onboardingDate) {
      setError('Both dates are required.');
      return;
    }
    setError('');
    onSubmit(integrationDate, onboardingDate);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, border: '1px solid #ccc', borderRadius: 2, bgcolor: '#fff' }}>
      <Typography variant="h6" gutterBottom>Go Live Details</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Integration Date"
          type="date"
          value={integrationDate}
          onChange={e => setIntegrationDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Onboarding Date"
          type="date"
          value={onboardingDate}
          onChange={e => setOnboardingDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          required
        />
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="contained" color="primary" type="submit">Confirm Go Live</Button>
          <Button variant="outlined" color="secondary" onClick={onCancel}>Cancel</Button>
        </Box>
      </form>
    </Box>
  );
};

export default GoLiveForm;
