import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { CustomerForm } from '@/components/CustomerForm'
import { server } from '@/mocks/server'

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('CustomerForm', () => {
  it('renders all form fields and submit button', () => {
    renderWithQuery(<CustomerForm />)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm />)
    await user.click(screen.getByRole('button', { name: /add customer/i }))
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument()
  })

  it('submits successfully and resets form', async () => {
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm />)

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/date of birth/i), '1990-05-15')
    await user.click(screen.getByRole('button', { name: /add customer/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    })
  })

  it('shows pending state while submitting', async () => {
    server.use(
      http.post('/api/customers', async () => {
        await delay('infinite')
        return new HttpResponse(null)
      })
    )
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm />)

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/date of birth/i), '1990-05-15')
    await user.click(screen.getByRole('button', { name: /add customer/i }))

    expect(await screen.findByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('shows API validation errors on 400 response', async () => {
    server.use(
      http.post('/api/customers', () =>
        HttpResponse.json(
          { errors: [{ field: 'firstName', message: 'must not be blank' }] },
          { status: 400 }
        )
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<CustomerForm />)

    await user.type(screen.getByLabelText(/first name/i), 'J')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/date of birth/i), '1990-05-15')
    await user.click(screen.getByRole('button', { name: /add customer/i }))

    expect(await screen.findByText(/must not be blank/i)).toBeInTheDocument()
  })

  it('does not show API errors on non-400 server error', async () => {
    server.use(
      http.post('/api/customers', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
      )
    )
    const user = userEvent.setup()
    renderWithQuery(<CustomerForm />)

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/date of birth/i), '1990-05-15')
    await user.click(screen.getByRole('button', { name: /add customer/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/must not be blank/i)).not.toBeInTheDocument()
  })
})
