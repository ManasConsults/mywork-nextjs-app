'use client';

export function CloseButton(): React.JSX.Element {
  return (
    <button
      onClick={() => window.close()}
      style={{
        position: 'fixed',
        top: 12,
        right: 16,
        background: '#333',
        color: '#fff',
        border: 'none',
        padding: '4px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 12,
      }}
      className="no-print"
    >
      Close
    </button>
  );
}
