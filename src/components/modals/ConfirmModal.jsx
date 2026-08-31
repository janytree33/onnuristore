import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소', isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'var(--jt-bg-container, #ffffff)',
        padding: '2rem', borderRadius: 'var(--jt-r-xl, 16px)',
        boxShadow: 'var(--jt-shadow-2xl, 0 25px 50px -12px rgba(0,0,0,0.25))',
        width: '90%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', animation: 'fadeIn 0.2s ease-out'
      }}>
        {isDestructive ? (
          <span className="material-symbols-rounded" style={{ color: 'var(--jt-seed-color-error, #EF4444)', fontSize: '48px' }}>warning</span>
        ) : (
          <span className="material-symbols-rounded" style={{ color: 'var(--jt-color-primary, #1F2328)', fontSize: '48px' }}>help</span>
        )}
        <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--jt-color-text, #111827)' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 2rem 0', color: 'var(--jt-color-text-secondary, #6B7280)', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          <button 
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '8px',
              backgroundColor: 'var(--jt-bg-layout, #F3F4F6)', color: 'var(--jt-color-text-secondary, #4B5563)',
              border: '1px solid #D1D5DB', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '8px',
              backgroundColor: isDestructive ? 'var(--jt-seed-color-error, #EF4444)' : 'var(--jt-color-primary, #1F2328)', 
              color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
