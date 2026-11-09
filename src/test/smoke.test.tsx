import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('infrastruttura di test', () => {
  it('rende un componente shadcn nel DOM e risponde ai click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Invia</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Invia' }))

    expect(screen.getByRole('button', { name: 'Invia' })).toBeInTheDocument()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
