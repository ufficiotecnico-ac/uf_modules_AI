import { Route, Routes, useParams } from 'react-router'
import { AppShell } from '@/app-shell'
import { LoginPage } from '@/features/auth/login-page'
import { RequireAuth } from '@/features/auth/require-auth'

function ModulePage() {
  const { slug } = useParams()
  return <p>Modulo: {slug}</p>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Moduli</p>} />
          <Route path="/modulo/:slug" element={<ModulePage />} />
        </Route>
      </Route>
    </Routes>
  )
}
