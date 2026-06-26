import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';
import DemoAuthGate from './auth/DemoAuthGate.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoAuthGate>
      <App />
    </DemoAuthGate>
  </StrictMode>
);
