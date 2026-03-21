import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { CustomerList } from '@/components/CustomerList'
import { server } from '@/mocks/server'

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('CustomerList', () => {
  it('shows loading state initially', () => {
    renderWithQuery(<CustomerList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders customer rows after fetch', async () => {
    renderWithQuery(<CustomerList />)
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('1990-05-15')).toBeInTheDocument()
  })

  it('shows empty state when no customers', async () => {
    server.use(http.get('/api/customers', () => HttpResponse.json([])))
    renderWithQuery(<CustomerList />)
    expect(await screen.findByText(/no customers yet/i)).toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    server.use(http.get('/api/customers', () => HttpResponse.error()))
    renderWithQuery(<CustomerList />)
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
  })
})
