import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Informer } from '@consta/uikit/Informer';

export type NotificationStatus = 'success' | 'warning' | 'alert' | 'system';
export type NotificationSize = 'm' | 's';
export type NotificationView = 'filled' | 'bordered' | 'outline';

export interface Notification {
  id: string;
  title?: string;
  label?: string;
  status: NotificationStatus;
  size?: NotificationSize;
  view?: NotificationView;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = 'top-right',
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    
    const newNotification: Notification = {
      ...notification,
      id,
      autoClose: notification.autoClose !== false,
      autoCloseDelay: notification.autoCloseDelay || 5000
    };

    setNotifications(prev => {
      const newNotifications = [newNotification, ...prev];
      return newNotifications.slice(0, maxNotifications);
    });

    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.autoCloseDelay);
    }
  }, [maxNotifications, removeNotification]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification({
      label: message,
      title,
      status: 'success',
      view: 'filled'
    });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    showNotification({
      label: message,
      title,
      status: 'alert',
      view: 'filled'
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification({
      label: message,
      title,
      status: 'warning',
      view: 'filled'
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification({
      label: message,
      title,
      status: 'system',
      view: 'filled'
    });
  }, [showNotification]);

  const hideNotification = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px',
      minWidth: '280px'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-center':
        return { ...baseStyles, top: '20px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideNotification
    }}>
      {children}
      <div style={getPositionStyles()}>
        {notifications.map(notification => (
          <Informer
            key={notification.id}
            title={notification.title}
            label={notification.label}
            status={notification.status}
            size={notification.size || 'm'}
            view={notification.view || 'filled'}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};