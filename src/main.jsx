// Starts the app and turns on page navigation.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { LibraryProvider } from './context/LibraryContext.jsx';
import './styles/style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LibraryProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LibraryProvider>
  </React.StrictMode>,
);
