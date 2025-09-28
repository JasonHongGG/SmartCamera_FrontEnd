import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// import App from './App';
import App from './App-refactored';

// 等待 DOM 載入完成後再執行 React 渲染
function initializeApp() {
  const container = document.getElementById('root');
  console.log('Looking for root element...', container);
  
  if (container) {
    console.log('Root element found, initializing React...');
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } else {
    console.error('Root element not found');
    // 重試機制
    setTimeout(() => {
      console.log('Retrying to find root element...');
      initializeApp();
    }, 100);
  }
}

// 確保 DOM 完全載入後再執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM 已經載入完成
  initializeApp();
}