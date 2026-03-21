import { http, HttpResponse } from 'msw'
import type { Customer } from '@/types/customer'

const customers: Customer[] = [
  {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1990-05-15',
    createdAt: '2026-03-20T10:00:00Z',
  },
]

export const handlers = [
  http.get('/api/customers', () => HttpResponse.json(customers)),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = customers.find((c) => c.id === Number(params.id))
    if (!customer) {
      return HttpResponse.json(
        { errors: [{ field: 'id', message: 'not found' }] },
        { status: 404 }
      )
    }
    return HttpResponse.json(customer)
  }),

  http.post('/api/customers', async ({ request }) => {
    const body = (await request.json()) as Partial<Customer>

    if (!body.firstName || !body.lastName || !body.dateOfBirth) {
      return HttpResponse.json(
        { errors: [{ field: 'firstName', message: 'must not be blank' }] },
        { status: 400 }
      )
    }

    const newCustomer: Customer = {
      id: customers.length + 1,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      createdAt: new Date().toISOString(),
    }
    customers.push(newCustomer)
    return HttpResponse.json(newCustomer, { status: 201 })
  }),
]
