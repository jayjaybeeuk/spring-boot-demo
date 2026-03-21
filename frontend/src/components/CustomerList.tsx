import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerRow } from './CustomerRow'

export function CustomerList() {
  const { data: customers, isLoading, isError } = useCustomers()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <p className="text-muted-foreground text-sm px-6 py-4">Loading…</p>
        )}
        {isError && (
          <p className="text-destructive text-sm px-6 py-4">Failed to load customers.</p>
        )}
        {!isLoading && !isError && customers?.length === 0 && (
          <p className="text-muted-foreground text-sm px-6 py-4">No customers yet.</p>
        )}
        {!isLoading && !isError && customers && customers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    ID
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date of Birth
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <CustomerRow key={c.id} customer={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
