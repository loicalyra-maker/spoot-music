import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/pure-black.css';
import { useSpootStore } from './store/useSpootStore';
import { powerManager } from './services/PowerManager';

if (typeof window !== 'undefined') {
  (window as any).spootStore = useSpootStore;
  (window as any).powerManager = powerManager;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
