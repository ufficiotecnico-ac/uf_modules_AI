import { Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-provider'

export function AppShell() {
  const { signOut } = useAuth()

  return (
    <>
      <header className="flex justify-end p-2">
        <Button variant="ghost" onClick={signOut}>
          Esci
        </Button>
      </header>
      <Outlet />
    </>
  )
}
