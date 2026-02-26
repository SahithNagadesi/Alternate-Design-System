import { useEffect, useState } from 'react';
import { getCaseTypes } from '../services/pega-api';
import CaseWorkflow from '../components/CaseWorkflow';
import './HomePage.css';

interface CaseType {
  ID: string;
  name: string;
  description?: string;
}

export default function HomePage() {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType | null>(null);

  useEffect(() => {
    loadCaseTypes();
  }, []);

  async function loadCaseTypes() {
    setLoading(true);
    setError('');
    try {
      const types = await getCaseTypes();
      setCaseTypes(types);
    } catch (err: any) {
      setError(err?.response?.data?.errorDetails?.[0]?.message || err.message || 'Failed to load case types');
    } finally {
      setLoading(false);
    }
  }

  function handleCaseTypeClick(ct: CaseType) {
    setSelectedCaseType(ct);
  }

  function handleWorkflowClose() {
    setSelectedCaseType(null);
  }

  // Icon mapping based on case type name keywords
  function getCaseIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('booking') || lower.includes('reservation')) return '📅';
    if (lower.includes('room') && lower.includes('assign')) return '🔑';
    if (lower.includes('checkout') || lower.includes('check-out')) return '🚪';
    if (lower.includes('service') || lower.includes('request')) return '🛎️';
    if (lower.includes('complaint') || lower.includes('issue')) return '📝';
    return '🏨';
  }

  function getCaseColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    return colors[index % colors.length];
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-overlay" />
          <div className="hero-pattern" />
        </div>
        <div className="hero-content">
          <span className="hero-badge">🏨 HotelRes Management</span>
          <h1 className="hero-title">
            Welcome to <span className="hero-highlight">Hotel Booking</span> System
          </h1>
          <p className="hero-subtitle">
            Manage room bookings, assignments, and guest services — all powered by Pega DX API
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-icon">📋</span>
              <span className="stat-value">{caseTypes.length}</span>
              <span className="stat-label">Case Types</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">v24.1</span>
              <span className="stat-label">DX API</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔐</span>
              <span className="stat-value">OAuth</span>
              <span className="stat-label">Secured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Case Types Section */}
      <section className="case-types-section">
        <div className="section-header">
          <h2 className="section-title">Available Services</h2>
          <p className="section-subtitle">
            Click on any service below to create a new case and get started
          </p>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading case types from Pega...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Error loading case types</strong>
              <p>{error}</p>
            </div>
            <button className="btn btn-sm" onClick={loadCaseTypes}>Retry</button>
          </div>
        )}

        {!loading && !error && caseTypes.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No Case Types Found</h3>
            <p>No case types are available in the Pega application.</p>
          </div>
        )}

        {!loading && !error && caseTypes.length > 0 && (
          <div className="case-type-grid">
            {caseTypes.map((ct, index) => (
              <div
                key={ct.ID}
                className="case-type-card"
                onClick={() => handleCaseTypeClick(ct)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCaseTypeClick(ct)}
              >
                <div className="card-accent" style={{ background: getCaseColor(index) }} />
                <div className="card-body">
                  <div className="card-icon-wrapper" style={{ background: getCaseColor(index) }}>
                    <span className="card-icon">{getCaseIcon(ct.name)}</span>
                  </div>
                  <h3 className="card-title">{ct.name}</h3>
                  <p className="card-description">
                    {ct.description || `Create and manage ${ct.name} cases`}
                  </p>
                  <div className="card-id-tag">
                    <code>{ct.ID}</code>
                  </div>
                  <div className="card-action">
                    <span className="action-text">Click to start</span>
                    <span className="action-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Select a Service</h3>
            <p>Choose a case type from the available services above</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Fill Details</h3>
            <p>A new case is created and assignment fields are displayed for you</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Submit</h3>
            <p>Submit the form to update the case in Pega and move to the next step</p>
          </div>
        </div>
      </section>

      {/* Case Workflow Modal */}
      {selectedCaseType && (
        <CaseWorkflow
          caseType={selectedCaseType}
          onClose={handleWorkflowClose}
        />
      )}
    </div>
  );
}
