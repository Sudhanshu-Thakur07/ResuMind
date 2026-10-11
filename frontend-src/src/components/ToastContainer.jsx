import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onRemoveToast }) => {
  return (
    <div className="toast-anchor">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        return (
          <div key={t.id} className={`toast-item ${t.type}`}>
            <span className="toast-icon">
              <Icon size={18} />
            </span>
            <span>{t.message}</span>
            <button 
              onClick={() => onRemoveToast(t.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', marginLeft: '6px' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
