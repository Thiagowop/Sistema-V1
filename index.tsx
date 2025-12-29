/**
 * @id INDEX-001
 * @name Index
 * @description React root entry point
 * @version 2.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
