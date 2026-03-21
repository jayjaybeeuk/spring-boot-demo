import { CustomerForm } from '@/components/CustomerForm'
import { CustomerList } from '@/components/CustomerList'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Customer Management</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
        <CustomerForm />
        <CustomerList />
      </main>
    </div>
  )
}

export default App
