import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { PlatformProvider } from './context/PlatformContext.tsx'
import { ConfirmProvider } from './components/app/ConfirmDialog.tsx'

// Pages load on demand. After a new deploy an open tab may ask for a page file that no longer exists:
// reload once to get the new version (the flag stops a reload loop if the server is really down).
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('evx_reloaded_for_update')) return
  sessionStorage.setItem('evx_reloaded_for_update', '1')
  event.preventDefault()
  window.location.reload()
})
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('evx_reloaded_for_update'), 10_000))

// A "data router" is needed for the unsaved-changes warning (useBlocker).
// The pages themselves are still defined in App.tsx with <Routes>.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <PlatformProvider>
        <AuthProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </AuthProvider>
      </PlatformProvider>
    ),
  },
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)