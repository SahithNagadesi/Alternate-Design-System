import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pegaAPI } from '../services/pega-api';
import './Home.css';

interface CaseType {
  ID: string;
  name: string;
  pyLabel?: string;
  CanCreate?: string;
}

const Home: React.FC = () => {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCaseTypes();
  }, []);

  const fetchCaseTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pegaAPI.getCaseTypes();
      
      // Filter for HotelRes case types
      const hotelCaseTypes = response.caseTypes?.filter((ct: CaseType) => 
        ct.ID?.includes('HotelRes') || 
        ct.name?.toLowerCase().includes('room') ||
        ct.name?.toLowerCase().includes('booking')
      ) || [];
      
      setCaseTypes(hotelCaseTypes);
    } catch (err: any) {
      console.error('Error fetching case types:', err);
      setError(err.message || 'Failed to load case types');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseTypeClick = async (caseTypeId: string) => {
    try {
      // Navigate to create case page with the case type
      navigate('/create-case', { state: { caseTypeId } });
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create case');
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Hotel Reservation System</h1>
          <p className="hero-subtitle">
            Book your perfect room or manage room assignments with ease
          </p>
        </div>
        <div className="hero-image">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="80" width="300" height="180" fill="#3b82f6" opacity="0.1" rx="8"/>
            <rect x="70" y="100" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <rect x="160" y="100" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <rect x="250" y="100" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <rect x="70" y="170" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <rect x="160" y="170" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <rect x="250" y="170" width="80" height="60" fill="#3b82f6" opacity="0.3" rx="4"/>
            <circle cx="200" cy="50" r="15" fill="#fbbf24"/>
            <path d="M 180,60 Q 200,40 220,60" stroke="#fbbf24" strokeWidth="3" fill="none"/>
          </svg>
        </div>
      </div>

      <div className="case-types-section">
        <h2 className="section-title">Select a Service</h2>
        
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading available services...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>{error}</p>
            <button onClick={fetchCaseTypes} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && caseTypes.length === 0 && (
          <div className="empty-state">
            <p>No case types available. Please check your Pega configuration.</p>
          </div>
        )}

        {!loading && !error && caseTypes.length > 0 && (
          <div className="case-types-grid">
            {caseTypes.map((caseType) => (
              <div
                key={caseType.ID}
                className="case-type-card"
                onClick={() => handleCaseTypeClick(caseType.ID)}
              >
                <div className="card-icon">
                  {caseType.name?.toLowerCase().includes('booking') ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2"/>
                      <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
                <h3 className="card-title">{caseType.pyLabel || caseType.name}</h3>
                <p className="card-description">
                  {caseType.name?.toLowerCase().includes('booking')
                    ? 'Create a new room booking reservation'
                    : 'Assign rooms to guests'}
                </p>
                <div className="card-action">
                  <span>Get Started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                    <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="features-section">
        <h2 className="section-title">Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#dbeafe' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Quick Booking</h3>
            <p>Fast and easy room reservation process</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#dcfce7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#10b981">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Instant Confirmation</h3>
            <p>Get immediate booking confirmation</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon" style={{ background: '#fef3c7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Secure & Safe</h3>
            <p>Your data is protected and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
