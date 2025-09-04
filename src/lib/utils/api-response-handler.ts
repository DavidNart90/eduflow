import { useAppStore } from '@/lib/stores';
import { ReportGenerationResult } from '@/lib/reports/client';

/**
 * Utility for handling API responses and showing appropriate toasts
 */
export class ApiResponseHandler {
  /**
   * Handle a report generation result and show appropriate toast
   */
  static handleReportResult(result: ReportGenerationResult) {
    const { showSuccess, showError, showWarning, showInfo } =
      useAppStore.getState();

    if (result.success) {
      // Show success toast
      if (result.toast) {
        switch (result.toast.type) {
          case 'success':
            showSuccess(result.toast.title, result.toast.message);
            break;
          case 'error':
            showError(result.toast.title, result.toast.message);
            break;
          case 'warning':
            showWarning(result.toast.title, result.toast.message);
            break;
          case 'info':
            showInfo(result.toast.title, result.toast.message);
            break;
          default:
            showInfo(result.toast.title, result.toast.message);
            break;
        }
      } else {
        // Fallback success message
        showSuccess(
          'Operation Successful',
          result.message || 'The operation completed successfully'
        );
      }
    } else {
      // Show error toast with details
      const errorMessage = result.details
        ? `${result.error}\n\nDetails: ${result.details}`
        : result.error || 'An unexpected error occurred';

      showError('Operation Failed', errorMessage);
    }

    return result;
  }

  /**
   * Handle generic API responses and show toasts
   */
  static handleApiResponse(response: {
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
    toast?: {
      type: 'success' | 'error' | 'warning' | 'info';
      title: string;
      message?: string;
    };
  }) {
    const { showSuccess, showError, showWarning, showInfo } =
      useAppStore.getState();

    if (response.success) {
      if (response.toast) {
        switch (response.toast.type) {
          case 'success':
            showSuccess(response.toast.title, response.toast.message);
            break;
          case 'error':
            showError(response.toast.title, response.toast.message);
            break;
          case 'warning':
            showWarning(response.toast.title, response.toast.message);
            break;
          case 'info':
            showInfo(response.toast.title, response.toast.message);
            break;
          default:
            showInfo(response.toast.title, response.toast.message);
            break;
        }
      } else {
        showSuccess(
          'Success',
          response.message || 'Operation completed successfully'
        );
      }
    } else {
      const errorMessage = response.details
        ? `${response.error}\n\nDetails: ${response.details}`
        : response.error || 'An unexpected error occurred';

      showError('Error', errorMessage);
    }

    return response;
  }

  /**
   * Show a loading toast for long-running operations
   */
  static showLoadingToast(message: string = 'Processing...') {
    const { showInfo } = useAppStore.getState();
    showInfo('Please Wait', message);
  }

  /**
   * Show a download success toast
   */
  static showDownloadSuccess(fileName: string) {
    const { showSuccess } = useAppStore.getState();
    showSuccess(
      'Download Complete',
      `${fileName} has been downloaded successfully`
    );
  }

  /**
   * Show a download error toast
   */
  static showDownloadError(error: string) {
    const { showError } = useAppStore.getState();
    showError('Download Failed', error || 'The file could not be downloaded');
  }
}
