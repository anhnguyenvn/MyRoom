import React, { useEffect } from 'react';  
  
interface NotificationProps {  
  message: string;  
  type: 'success' | 'error' | 'info';  
  onClose: () => void;  
  duration?: number;  
}  
  
const Notification: React.FC<NotificationProps> = ({   
  message,   
  type,   
  onClose,   
  duration = 3000   
}) => {  
  useEffect(() => {  
    const timer = setTimeout(() => {  
      onClose();  
    }, duration);  
      
    return () => clearTimeout(timer);  
  }, [duration, onClose]);  
    
  const getBackgroundColor = () => {  
    switch (type) {  
      case 'success': return '#4CAF50';  
      case 'error': return '#f44336';  
      case 'info': return '#2196F3';  
      default: return '#2196F3';  
    }  
  };  
    
  return (  
    <div style={{  
      position: 'fixed',  
      bottom: '20px',  
      right: '20px',  
      padding: '1rem',  
      backgroundColor: getBackgroundColor(),  
      color: 'white',  
      borderRadius: '4px',  
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',  
      zIndex: 1000,  
      maxWidth: '300px'  
    }}>  
      {message}  
    </div>  
  );  
};  
  
export default Notification;