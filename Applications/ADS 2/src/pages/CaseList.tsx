import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../services/pega-api';

interface Case {
  ID: string;
  name: string;
  status: string;
  urgency: string;
}

export function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Cases</h2>
        <Link to="/cases/new" className="btn btn-primary">New Case</Link>
      </div>

      {loading && <p>Loading cases...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.ID}>
                <td>
                  <Link to={`/cases/${encodeURIComponent(c.ID)}`}>{c.ID}</Link>
                </td>
                <td>{c.name}</td>
                <td><span className="badge">{c.status}</span></td>
                <td>{c.urgency}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">No cases found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
