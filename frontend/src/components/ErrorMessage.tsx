// Error message component with retry functionality

import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  details?: string;
}

export function ErrorMessage({ message, title = 'Error', onRetry, details }: ErrorMessageProps) {
  return (
    <div className={styles['error-container']}>
      <div className={styles['error-icon']}>⚠️</div>
      <h3 className={styles['error-title']}>{title}</h3>
      <p className={styles['error-message']}>{message}</p>
      {details && (
        <details className={styles['error-details']}>
          <summary>Show details</summary>
          <pre>{details}</pre>
        </details>
      )}
      {onRetry && (
        <button onClick={onRetry} className={styles['retry-button']}>
          Try Again
        </button>
      )}
    </div>
  );
}
