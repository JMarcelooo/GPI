import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000, actionLabel, onAction }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const bg = type === 'success' ? 'var(--color-success)' : 'var(--color-error)';
  const Icon = type === 'success' ? CheckCircle : XCircle;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: bg, color: '#fff', padding: '14px 20px',
      borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      fontSize: 14, fontWeight: 500, maxWidth: 400,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s ease, opacity 0.3s ease'
    }}>
      <Icon size={20} />
      <span style={{ flex: 1 }}>{message}</span>
      {actionLabel && (
        <button onClick={() => { if (onAction) onAction(); if (onClose) onClose(); }} style={{
          background: 'rgba(255,255,255,0.22)', border: 'none', color: '#fff',
          cursor: 'pointer', padding: '6px 12px', borderRadius: 6,
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap'
        }}>{actionLabel}</button>
      )}
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} style={{
        background: 'none', border: 'none', color: '#fff',
        cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.8
      }}><X size={16} /></button>
    </div>
  );
}
