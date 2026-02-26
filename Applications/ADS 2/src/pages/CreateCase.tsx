import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaseTypes, createCase } from '../services/pega-api';

interface CaseType {
  ID: string;
  name: string;
}

export function CreateCase() {
  const navigate = useNavigate();
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCaseTypes()
      .then((types) => {
        setCaseTypes(types);
        // Pre-configured case types: Room Booking, Room Assignment
        if (types.length > 0) setSelectedType(types[0].ID);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTypes(false));
  }, []);

  async function handleCreate() {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    try {
      const result = await createCase(selectedType);
      const newCaseId = result.ID || result.data?.caseInfo?.ID;
      if (newCaseId) {
        navigate(`/cases/${encodeURIComponent(newCaseId)}`);
      } else {
        navigate('/cases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Create New Case</h2>

      {loadingTypes && <p>Loading case types...</p>}
      {error && <p className="error">{error}</p>}

      {!loadingTypes && (
        <div className="form">
          <label htmlFor="caseType">Case Type</label>
          <select
            id="caseType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {caseTypes.map((ct) => (
              <option key={ct.ID} value={ct.ID}>
                {ct.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading || !selectedType}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      )}
    </div>
  );
}
