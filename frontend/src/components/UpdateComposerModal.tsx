import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { UpdateComposer, type ComposerPayload } from './UpdateComposer';
import type { UserProfile } from '../api/types';
import styles from './UpdateComposerModal.module.css';

interface UpdateComposerModalProps {
  profile: UserProfile;
  onClose: () => void;
  onCreate: (payload: ComposerPayload) => void;
}

export function UpdateComposerModal({ profile, onClose, onCreate }: UpdateComposerModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', width: '90%' }}>
        <div className={styles['modal-header']}>
          <h2 className="modal-title">Add Update</h2>
          <button 
            className={styles['modal-close']}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <UpdateComposer onCreate={onCreate} profile={profile} />
      </div>
    </div>,
    document.body
  );
}
