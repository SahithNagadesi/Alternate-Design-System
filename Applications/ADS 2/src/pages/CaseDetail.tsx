import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCaseById } from '../services/pega-api';

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!caseId) return;
    getCaseById(decodeURIComponent(caseId))
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  return (
    <div>
      <Link to="/cases" className="back-link">&larr; Back to Cases</Link>

      {loading && <p>Loading case...</p>}
      {error && <p className="error">{error}</p>}

      {caseData && (
        <div className="case-detail">
          <h2>{(caseData as { name?: string }).name || caseId}</h2>

          <div className="detail-grid">
            {Object.entries(caseData).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="detail-label">{key}</span>
                <span className="detail-value">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
