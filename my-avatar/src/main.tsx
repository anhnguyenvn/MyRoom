// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // CSS toàn cục
// Import các file CSS khác nếu bạn muốn chúng là global
// import './App.css';
// import './AvatarControls.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Root element not found. Check your index.html.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);