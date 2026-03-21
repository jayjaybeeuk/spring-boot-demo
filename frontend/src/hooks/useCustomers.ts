import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCustomer, getCustomers } from '@/api/customerApi'
import type { CreateCustomerRequest } from '@/types/customer'

export const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: getCustomers,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomer(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}
