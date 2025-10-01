import { toast } from 'react-hot-toast';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    callback: () => void;
  };
  persistent?: boolean;
}

export interface ProcessingUpdate {
  contributionId: string;
  status: 'UPLOADING' | 'PROCESSING' | 'PROCESSED' | 'MANUAL_REVIEW_NEEDED' | 'LOW_CONFIDENCE_OCR' | 'PROCESSING_FAILED' | 'APPROVED' | 'REJECTED';
  progress?: number;
  message?: string;
  extractedData?: any;
  adminComments?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, (update: ProcessingUpdate) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Subscribe to processing updates for specific contributions
   */
  subscribeToProcessingUpdates(contributionIds: string[], callback: (update: ProcessingUpdate) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.callbacks.set(subscriptionId, callback);

    // Initialize SSE connection if not already connected
    this.initializeSSEConnection();

    // Send subscription request to backend
    this.sendSubscriptionRequest(contributionIds);

    return subscriptionId;
  }

  /**
   * Unsubscribe from processing updates
   */
  unsubscribe(subscriptionId: string): void {
    this.callbacks.delete(subscriptionId);
    
    // Close SSE connection if no more subscribers
    if (this.callbacks.size === 0 && this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Initialize Server-Sent Events connection for real-time updates
   */
  private initializeSSEConnection(): void {
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      return; // Already connected
    }

    try {
      this.eventSource = new EventSource('/api/v1/contributions/images/updates');

      this.eventSource.onopen = () => {
        console.log('SSE connection established for processing updates');
        this.reconnectAttempts = 0;
        this.showNotification({
          type: 'info',
          title: 'Connected',
          message: 'Real-time updates enabled',
          persistent: false
        });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const update: ProcessingUpdate = JSON.parse(event.data);
          this.handleProcessingUpdate(update);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.handleSSEError();
      };

      // Listen for specific processing events
      this.eventSource.addEventListener('processing-update', (event) => {
        try {
          const update: ProcessingUpdate = JSON.parse((event as MessageEvent).data);
          this.handleProcessingUpdate(update);
        } catch (error) {
          console.error('Error parsing processing update:', error);
        }
      });

      this.eventSource.addEventListener('approval-update', (event) => {
        try {
          const update: ProcessingUpdate = JSON.parse((event as MessageEvent).data);
          this.handleApprovalUpdate(update);
        } catch (error) {
          console.error('Error parsing approval update:', error);
        }
      });

    } catch (error) {
      console.error('Failed to initialize SSE connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle processing updates and notify subscribers
   */
  private handleProcessingUpdate(update: ProcessingUpdate): void {
    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in processing update callback:', error);
      }
    });

    // Show appropriate notification based on status
    this.showProcessingNotification(update);
  }

  /**
   * Handle approval/rejection updates
   */
  private handleApprovalUpdate(update: ProcessingUpdate): void {
    this.callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in approval update callback:', error);
      }
    });

    this.showApprovalNotification(update);
  }

  /**
   * Show processing status notifications
   */
  private showProcessingNotification(update: ProcessingUpdate): void {
    const { status, contributionId, message } = update;
    const shortId = contributionId.slice(-8);

    switch (status) {
      case 'PROCESSING':
        this.showNotification({
          type: 'info',
          title: 'Processing Started',
          message: `AI is analyzing your image (ID: ${shortId})`,
          persistent: false
        });
        break;

      case 'PROCESSED':
        this.showNotification({
          type: 'success',
          title: 'Processing Complete ✅',
          message: `Successfully extracted bus schedule data from your image`,
          persistent: true,
          action: {
            label: 'View Results',
            callback: () => this.navigateToContributions()
          }
        });
        break;

      case 'MANUAL_REVIEW_NEEDED':
        this.showNotification({
          type: 'warning',
          title: 'Manual Review Required ⚠️',
          message: 'Your image has been processed but needs admin review for accuracy',
          persistent: true
        });
        break;

      case 'LOW_CONFIDENCE_OCR':
        this.showNotification({
          type: 'warning',
          title: 'Processing Uncertain ⚠️',
          message: 'Text extraction had low confidence. Admin review is required',
          persistent: true
        });
        break;

      case 'PROCESSING_FAILED':
        this.showNotification({
          type: 'error',
          title: 'Processing Failed ❌',
          message: message || 'Failed to process your image. Please try again or contact support',
          persistent: true,
          action: {
            label: 'Retry',
            callback: () => this.retryProcessing(contributionId)
          }
        });
        break;
    }
  }

  /**
   * Show approval status notifications
   */
  private showApprovalNotification(update: ProcessingUpdate): void {
    const { status, adminComments } = update;

    switch (status) {
      case 'APPROVED':
        this.showNotification({
          type: 'success',
          title: 'Contribution Approved! 🎉',
          message: `Your bus schedule contribution has been approved and is now live`,
          persistent: true,
          action: {
            label: 'Search Routes',
            callback: () => this.navigateToSearch()
          }
        });
        break;

      case 'REJECTED':
        this.showNotification({
          type: 'error',
          title: 'Contribution Rejected ❌',
          message: adminComments || 'Your contribution was rejected. Please check the details and try again',
          persistent: true,
          action: {
            label: 'View Details',
            callback: () => this.navigateToContributions()
          }
        });
        break;
    }
  }

  /**
   * Show general notifications using react-hot-toast
   */
  private showNotification(notification: Omit<NotificationData, 'id' | 'timestamp'>): void {
    const { type, title, message, action, persistent } = notification;

    const toastOptions = {
      duration: persistent ? Infinity : 4000,
      position: 'top-right' as const,
    };

    const combinedMessage = `${title}: ${message}`;

    switch (type) {
      case 'success':
        if (action) {
          toast.success(combinedMessage, {
            ...toastOptions,
            action: {
              label: action.label,
              onClick: action.callback,
            },
          } as any);
        } else {
          toast.success(combinedMessage, toastOptions);
        }
        break;

      case 'error':
        if (action) {
          toast.error(combinedMessage, {
            ...toastOptions,
            action: {
              label: action.label,
              onClick: action.callback,
            },
          } as any);
        } else {
          toast.error(combinedMessage, toastOptions);
        }
        break;

      case 'warning':
        if (action) {
          toast(combinedMessage, {
            ...toastOptions,
            icon: '⚠️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            },
            action: {
              label: action.label,
              onClick: action.callback,
            },
          } as any);
        } else {
          toast(combinedMessage, {
            ...toastOptions,
            icon: '⚠️',
            style: {
              background: '#fef3c7',
              color: '#92400e',
            },
          });
        }
        break;

      case 'info':
        if (action) {
          toast(combinedMessage, {
            ...toastOptions,
            icon: 'ℹ️',
            action: {
              label: action.label,
              onClick: action.callback,
            },
          } as any);
        } else {
          toast(combinedMessage, {
            ...toastOptions,
            icon: 'ℹ️',
          });
        }
        break;
    }
  }

  /**
   * Handle SSE connection errors
   */
  private handleSSEError(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.showNotification({
        type: 'error',
        title: 'Connection Lost',
        message: 'Unable to maintain real-time updates. Please refresh the page',
        persistent: true,
        action: {
          label: 'Refresh',
          callback: () => window.location.reload()
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Attempting to reconnect SSE (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.initializeSSEConnection();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  /**
   * Send subscription request to backend
   */
  private sendSubscriptionRequest(contributionIds: string[]): void {
    fetch('/api/v1/contributions/images/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contributionIds }),
    }).catch(error => {
      console.error('Failed to send subscription request:', error);
    });
  }

  /**
   * Retry processing for a failed contribution
   */
  private async retryProcessing(contributionId: string): Promise<void> {
    try {
      const response = await fetch(`/api/v1/contributions/images/${contributionId}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        this.showNotification({
          type: 'info',
          title: 'Processing Restarted',
          message: 'Your image is being processed again',
          persistent: false
        });
      } else {
        throw new Error('Retry request failed');
      }
    } catch (error) {
      this.showNotification({
        type: 'error',
        title: 'Retry Failed',
        message: 'Unable to restart processing. Please contact support',
        persistent: true
      });
    }
  }

  /**
   * Navigation helpers
   */
  private navigateToContributions(): void {
    // This would integrate with your routing system
    window.location.href = '/my-contributions';
  }

  private navigateToSearch(): void {
    // This would integrate with your routing system
    window.location.href = '/search';
  }

  /**
   * Show simple notifications for immediate feedback
   */
  showUploadProgress(fileName: string, progress: number): void {
    if (progress < 100) {
      toast.loading(`Uploading ${fileName}... ${progress}%`, {
        id: `upload-${fileName}`,
      });
    } else {
      toast.success(`${fileName} uploaded successfully!`, {
        id: `upload-${fileName}`,
      });
    }
  }

  showUploadError(fileName: string, error: string): void {
    toast.error(`Failed to upload ${fileName}: ${error}`, {
      duration: 6000,
    });
  }

  showProcessingStarted(contributionId: string): void {
    this.showNotification({
      type: 'info',
      title: 'Processing Started',
      message: `Your image is being analyzed by AI (ID: ${contributionId.slice(-8)})`,
      persistent: false
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.callbacks.clear();
  }
}

export default NotificationService.getInstance();