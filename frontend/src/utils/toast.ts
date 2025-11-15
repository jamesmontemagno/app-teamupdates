// Toast notification helpers

import toast from 'react-hot-toast';
import { ApiError } from '../api/client';

export function showSuccess(message: string): string {
  return toast.success(message);
}

export function showError(error: unknown, fallbackMessage = 'An error occurred'): string {
  let message = fallbackMessage;

  if (error instanceof ApiError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return toast.error(message);
}

export function showLoading(message: string): string {
  return toast.loading(message);
}

export function dismissToast(toastId: string): void {
  toast.dismiss(toastId);
}

export function showInfo(message: string): string {
  return toast(message, {
    icon: 'ℹ️',
  });
}

export function showWarning(message: string): string {
  return toast(message, {
    icon: '⚠️',
    duration: 5000,
  });
}

// Helper to show a loading toast and update it with success/error
export async function withLoadingToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((result: T) => string);
    error?: string | ((error: unknown) => string);
  }
): Promise<T> {
  return toast.promise(promise, {
    loading: messages.loading,
    success: (result) => {
      if (typeof messages.success === 'function') {
        return messages.success(result);
      }
      return messages.success;
    },
    error: (error) => {
      if (messages.error) {
        if (typeof messages.error === 'function') {
          return messages.error(error);
        }
        return messages.error;
      }
      if (error instanceof ApiError) {
        return error.message;
      }
      if (error instanceof Error) {
        return error.message;
      }
      return 'An error occurred';
    },
  });
}
