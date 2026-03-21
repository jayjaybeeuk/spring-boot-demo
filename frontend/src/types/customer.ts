export interface Customer {
  id: number
  firstName: string
  lastName: string
  dateOfBirth: string
  createdAt: string
}

export interface CreateCustomerRequest {
  firstName: string
  lastName: string
  dateOfBirth: string
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiError {
  errors: FieldError[]
}
