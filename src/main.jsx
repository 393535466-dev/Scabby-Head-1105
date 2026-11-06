import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './experience.css';
import { installStableViewport } from './lib/stableViewport.js';

installStableViewport();
createRoot(document.getElementById('root')).render(<App />);
