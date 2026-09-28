import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PrefsProvider } from './lib/prefs';
import { AuthProvider } from './lib/auth';
import { DataProvider } from './lib/DataContext';
import './index.css';
import './styles/ds.css';
import './styles/eadrs.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PrefsProvider>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </PrefsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
