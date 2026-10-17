import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

// Signal VIP preloader to smoothly fade out once React mounts
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('eventrye-ready'));
    }, 150);
  });
}
