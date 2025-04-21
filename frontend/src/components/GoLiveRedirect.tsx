import React from 'react';
import GoLiveForm from './GoLiveForm';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const GoLiveRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Accept both billerId and billerName, and listType from navigation state
  const { billerId, billerName, listType = 'billers', filters } = (location.state || {}) as {
    billerId?: number;
    billerName?: string;
    listType?: string;
    filters?: any;
  };

  const getReturnPath = () => {
    switch (listType) {
      case 'top-50-billers': return '/top-50-billers';
      case 'unavailable-isp': return '/unavailable-isp';
      case 'unavailable-mfi': return '/unavailable-mfi';
      default: return '/billers';
    }
  };

  React.useEffect(() => {
    if (!billerId && !billerName) {
      navigate(getReturnPath());
    }
  }, [billerId, billerName, navigate]);
  
  if (!billerId && !billerName) {
    return null;
  }

  const handleSubmit = async (integrationDate: string, onboardingDate: string) => {
    try {
      // Determine API endpoint and payload based on listType
      let apiUrl = '';
      let payload: any = {};
      if (listType === 'top-50-billers') {
        apiUrl = 'http://localhost:5000/api/top-50-billers/status';
        payload = {
          Biller: billerName, // <-- Capital B, must be present!
          Status: 'go_live',  // <-- Capital S
          integration_date: integrationDate,
          onboarding_date: onboardingDate
        };
      } else if (billerId) {
        apiUrl = `http://localhost:5000/api/billers/${billerId}/status`;
        payload = {
          status: 'go_live',
          integration_date: integrationDate,
          onboarding_date: onboardingDate
        };
      } else {
        throw new Error('No biller info provided.');
      }
      const response = await axios.post(apiUrl, payload);
      if (response.data.success) {
        navigate(getReturnPath());
      }
    } catch (error) {
      alert('Failed to update Go Live status.');
    }
  };

  const handleCancel = () => {
    navigate(getReturnPath());
  };

  return <GoLiveForm onSubmit={handleSubmit} onCancel={handleCancel} />;
};

export default GoLiveRedirect;
