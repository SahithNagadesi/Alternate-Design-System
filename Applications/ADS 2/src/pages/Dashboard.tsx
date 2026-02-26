import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCaseTypes } from '../services/pega-api';

interface CaseType {
  ID: string;
  name: string;
}

export function Dashboard() {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCaseTypes()
      .then(setCaseTypes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="subtitle">Pega Application: <strong>HotelRes</strong></p>

      {loading && <p>Loading case types...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="card-grid">
          {caseTypes.map((ct) => (
            <div key={ct.ID} className="card">
              <h3>{ct.name}</h3>
              <p className="card-id">{ct.ID}</p>
              <Link to="/cases/new" className="btn btn-primary">
                Create Case
              </Link>
            </div>
          ))}
          {caseTypes.length === 0 && (
            <p className="empty">No case types found. Check your Pega server connection.</p>
          )}
        </div>
      )}
    </div>
  );
}
