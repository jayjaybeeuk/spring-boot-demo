package com.example.customers.exception

data class FieldError(val field: String, val message: String)

data class ErrorResponse(val errors: List<FieldError>)
