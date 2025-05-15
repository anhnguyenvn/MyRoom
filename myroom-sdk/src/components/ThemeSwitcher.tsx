import React from 'react';  
  
interface ThemeSwitcherProps {  
  isDarkMode: boolean;  
  onToggle: () => void;  
}  
  
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ isDarkMode, onToggle }) => {  
  return (  
    <div style={{ padding: '0.5rem 1rem' }}>  
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>  
        <span style={{ marginRight: '0.5rem' }}>  
          {isDarkMode ? '🌙 Dark' : '☀️ Light'}  
        </span>  
        <div  
          style={{  
            position: 'relative',  
            width: '40px',  
            height: '20px',  
            backgroundColor: isDarkMode ? '#2196F3' : '#ccc',  
            borderRadius: '10px',  
            transition: 'background-color 0.3s'  
          }}  
          onClick={onToggle}  
        >  
          <div  
            style={{  
              position: 'absolute',  
              top: '2px',  
              left: isDarkMode ? '22px' : '2px',  
              width: '16px',  
              height: '16px',  
              backgroundColor: 'white',  
              borderRadius: '50%',  
              transition: 'left 0.3s'  
            }}  
          />  
        </div>  
      </label>  
    </div>  
  );  
};  
  
export default ThemeSwitcher;