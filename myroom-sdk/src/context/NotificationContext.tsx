import React, { createContext, useState, useContext, ReactNode } from 'react';  
import Notification from '../components/Notification';  
  
type NotificationType = 'success' | 'error' | 'info';  
  
interface NotificationContextType {  
  showNotification: (message: string, type: NotificationType) => void;  
}  
  
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);  
  
export const useNotification = () => {  
  const context = useContext(NotificationContext);  
  if (!context) {  
    throw new Error('useNotification must be used within a NotificationProvider');  
  }  
  return context;  
};  
  
interface NotificationProviderProps {  
  children: ReactNode;  
}  
  
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {  
  const [notification, setNotification] = useState<{  
    message: string;  
    type: NotificationType;  
  } | null>(null);  
    
  const showNotification = (message: string, type: NotificationType) => {  
    setNotification({ message, type });  
  };  
    
  const handleClose = () => {  
    setNotification(null);  
  };  
    
  return (  
    <NotificationContext.Provider value={{ showNotification }}>  
      {children}  
      {notification && (  
        <Notification  
          message={notification.message}  
          type={notification.type}  
          onClose={handleClose}  
        />  
      )}  
    </NotificationContext.Provider>  
  );  
};