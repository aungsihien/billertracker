import React from 'react';
import GoLiveForm from './GoLiveForm';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const GoLiveRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // billerId is passed via state from BillerList
  const { billerId } = (location.state || {}) as { billerId?: number };

  if (!billerId) {
    // If no billerId, redirect to billers list
    navigate('/billers');
    return null;
  }

  const handleSubmit = async (integrationDate: string, onboardingDate: string) => {
    try {
      // Update status to 'go_live' with dates
      const response = await axios.post(
        `http://localhost:5000/api/billers/${billerId}/status`,
        {
          status: 'go_live',
          integration_date: integrationDate,
          onboarding_date: onboardingDate
        }
      );
      if (response.data.success) {
        navigate('/billers');
      }
    } catch (error) {
      alert('Failed to update Go Live status.');
    }
  };

  const handleCancel = () => {
    navigate('/billers');
  };

  return <GoLiveForm onSubmit={handleSubmit} onCancel={handleCancel} />;
};

export default GoLiveRedirect;
