import { describe, expect, it } from 'vitest'
import { createCustomer, getCustomerById, getCustomers } from '@/api/customerApi'

describe('customerApi', () => {
  it('getCustomers returns an array of customers', async () => {
    const customers = await getCustomers()
    expect(Array.isArray(customers)).toBe(true)
    expect(customers[0]).toMatchObject({ firstName: 'Jane', lastName: 'Smith' })
  })

  it('getCustomerById returns a single customer', async () => {
    const customer = await getCustomerById(1)
    expect(customer.id).toBe(1)
    expect(customer.firstName).toBe('Jane')
  })

  it('createCustomer posts and returns the new customer', async () => {
    const customer = await createCustomer({
      firstName: 'Bob',
      lastName: 'Jones',
      dateOfBirth: '1985-03-10',
    })
    expect(customer.firstName).toBe('Bob')
    expect(customer.lastName).toBe('Jones')
  })
})
