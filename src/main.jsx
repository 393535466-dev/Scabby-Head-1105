import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import RecordHomeWelcome from './components/record-home/RecordHomeWelcome.jsx';
import IdleSpinningPlus from './components/record-home/IdleSpinningPlus.jsx';
import './styles.css';
import './experience.css';
import './components/record-home/record-home.css';
import { installStableViewport } from './lib/stableViewport.js';

installStableViewport();
document.documentElement.classList.add('record-home-experience');
createRoot(document.getElementById('root')).render(<App WelcomeComponent={RecordHomeWelcome} RecordIcon={IdleSpinningPlus} />);
