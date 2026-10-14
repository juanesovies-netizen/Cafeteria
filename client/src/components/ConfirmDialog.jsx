import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, confirmText = 'Eliminar', onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmText}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <div className="confirm-icon">
          <AlertTriangle size={22} />
        </div>
        <p>{message}</p>
      </div>
    </Modal>
  );
}
