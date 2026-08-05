import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import axios from 'axios';

const PISelector = ({ value, onChange }) => {
  const [pis, setPis] = useState([]);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pi`)
      .then(res => setPis(res.data.data || []))
      .catch(() => setError('Erro ao carregar PIs.'))
      .finally(() => setLoading(false));
  }, []);

  const selected = pis.find(p => p.id === value) || null;

  useEffect(() => {
    if (selected) {
      setQuery(selected.titulo || `PI ${selected.id}`);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selected]);

  // Filtra conforme o usuário digita (título, protocolo ou ID)
  const filtered = pis.filter(pi => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      (pi.titulo || '').toLowerCase().includes(q) ||
      (pi.protocolo || '').toLowerCase().includes(q) ||
      String(pi.id || '').includes(q)
    );
  });

  const selectPI = (pi) => {
    onChange(pi.id);
    setQuery(pi.titulo || `PI ${pi.id}`);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder="Buscar PI por título ou protocolo..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          onChange(null);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        style={{
          width: '100%',
          border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          padding: 'var(--space-2) var(--space-3)',
          fontSize: 'var(--text-sm)',
          boxSizing: 'border-box'
        }}
      />
      {selected ? (
        <Check size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-success)', pointerEvents: 'none' }} />
      ) : query ? (
        <X
          size={16}
          onClick={() => { setQuery(''); onChange(null); setShowDropdown(true); }}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--color-text-muted)' }}
        />
      ) : null}

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 200,
          overflowY: 'auto', zIndex: 20, boxShadow: 'var(--shadow-md)'
        }}>
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Carregando PIs...
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Nenhuma PI encontrada.
            </div>
          )}
          {filtered.map(pi => (
            <div
              key={pi.id}
              onMouseDown={() => selectPI(pi)}
              style={{
                padding: '10px 12px', cursor: 'pointer', fontSize: '0.875rem',
                borderBottom: '1px solid var(--color-border-light)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: 'var(--color-text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pi.titulo || `PI ${pi.id}`}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                Protocolo: {pi.protocolo || '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PISelector;