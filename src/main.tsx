import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ConfirmProvider } from './components/app/ConfirmDialog.tsx'

// A "data router" is needed for the unsaved-changes warning (useBlocker).
// The pages themselves are still defined in App.tsx with <Routes>.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </AuthProvider>
    ),
  },
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)