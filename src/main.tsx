// APP STYLES //
import './reset.css';
import './index.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Routes } from './Route'
import { AuthProvider } from './context/AuthContext';


const router = createBrowserRouter(Routes, {
  basename: import.meta.env.BASE_URL
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
