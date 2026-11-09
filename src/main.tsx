import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { AppRoutes } from './app-routes'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './features/auth/auth-provider'
import { createPeopleApi } from './features/people/people-api'
import { PeopleApiProvider } from './features/people/people-api-provider'
import { supabase } from './lib/supabase'

const peopleApi = createPeopleApi(supabase)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider client={supabase.auth}>
        <PeopleApiProvider api={peopleApi}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PeopleApiProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
