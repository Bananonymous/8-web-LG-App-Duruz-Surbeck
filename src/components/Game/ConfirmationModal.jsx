import React from 'react';
import './ConfirmationModal.css';

/**
 * Custom confirmation modal component to replace browser alerts
 * Provides better mobile experience and styling consistency
 */
const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
    type = "default" // "default", "danger", "warning"
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="mj-confirmation-modal-backdrop" onClick={handleBackdropClick}>
            <div className="mj-confirmation-modal">
                <div className="mj-confirmation-modal-header">
                    <h3 className="mj-confirmation-modal-title">{title}</h3>
                </div>

                <div className="mj-confirmation-modal-body">
                    <p className="mj-confirmation-modal-message">{message}</p>
                </div>

                <div className="mj-confirmation-modal-actions">
                    <button
                        className="mj-btn mj-btn-secondary mj-confirmation-cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`mj-btn mj-confirmation-confirm ${type === 'danger' ? 'mj-btn-danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
