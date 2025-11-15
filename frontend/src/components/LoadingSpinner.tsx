// Loading spinner component

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ text, size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={styles['spinner-container']}>
      <div className={`${styles.spinner} ${styles[`spinner--${size}`]}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className={styles['spinner-text']}>{text}</p>}
    </div>
  );
}
