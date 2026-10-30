import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useSpootStore } from './store/useSpootStore';

if (typeof window !== 'undefined') {
  (window as any).spootStore = useSpootStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
