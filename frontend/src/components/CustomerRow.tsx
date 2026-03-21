import type { Customer } from '@/types/customer'

interface Props {
  customer: Customer
}

export function CustomerRow({ customer }: Props) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4 text-sm">{customer.id}</td>
      <td className="py-3 px-4 text-sm font-medium">
        {customer.firstName} {customer.lastName}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{customer.dateOfBirth}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground">
        {new Date(customer.createdAt).toLocaleString()}
      </td>
    </tr>
  )
}
