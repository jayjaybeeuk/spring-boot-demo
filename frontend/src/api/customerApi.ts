import type { CreateCustomerRequest, Customer } from '@/types/customer'
import { apiClient } from './axios'

export const getCustomers = () => apiClient.get<Customer[]>('/api/customers').then((r) => r.data)

export const getCustomerById = (id: number) =>
  apiClient.get<Customer>(`/api/customers/${id}`).then((r) => r.data)

export const createCustomer = (data: CreateCustomerRequest) =>
  apiClient.post<Customer>('/api/customers', data).then((r) => r.data)
