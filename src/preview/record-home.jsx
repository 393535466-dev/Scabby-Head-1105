import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.jsx';
import RecordHomeWelcome from '../components/record-home/RecordHomeWelcome.jsx';
import AvatarMotionReview from './AvatarMotionReview.jsx';
import IdleSpinningPlus from '../components/record-home/IdleSpinningPlus.jsx';
import '../styles.css';
import '../experience.css';
import '../components/record-home/record-home.css';
import './record-home.css';

// 本地设计复核入口，与正式首页共用已确认的组件。
document.documentElement.classList.add('record-home-experience');
createRoot(document.getElementById('root')).render(
  new URLSearchParams(window.location.search).get('view') === 'avatars'
    ? <AvatarMotionReview />
    : <App WelcomeComponent={RecordHomeWelcome} RecordIcon={IdleSpinningPlus} skipLaunch />,
);
