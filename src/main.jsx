import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import { RouterProvider } from './router.jsx';
import { ThemeProvider } from './theme.jsx';
import { ConfirmProvider, ToastProvider } from './components/ui.jsx';
import './design/tokens.css';
import './design/base.css';
import './design/screens.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreProvider>
        <RouterProvider>
          <ToastProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </ToastProvider>
        </RouterProvider>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
