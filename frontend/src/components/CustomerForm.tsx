import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCustomer } from '@/hooks/useCustomers'
import type { ApiError, CreateCustomerRequest } from '@/types/customer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((v) => new Date(v) < new Date(), { message: 'Date of birth must be in the past' }),
})

type FormValues = z.infer<typeof schema>

export function CustomerForm() {
  const { mutate, isPending } = useCreateCustomer()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormValues) => {
    const request: CreateCustomerRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
    }

    mutate(request, {
      onSuccess: () => reset(),
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          const apiError = error.response.data as ApiError
          apiError.errors.forEach((e) =>
            setError(e.field as keyof FormValues, { message: e.message })
          )
        }
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="Jane"
              aria-invalid={!!errors.firstName}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-destructive text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Smith"
              aria-invalid={!!errors.lastName}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-destructive text-sm">{errors.lastName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              aria-invalid={!!errors.dateOfBirth}
              {...register('dateOfBirth')}
            />
            {errors.dateOfBirth && (
              <p className="text-destructive text-sm">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Add customer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
