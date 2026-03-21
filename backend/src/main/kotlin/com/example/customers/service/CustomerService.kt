package com.example.customers.service

import com.example.customers.domain.Customer
import com.example.customers.dto.CreateCustomerRequest
import com.example.customers.dto.CustomerResponse
import com.example.customers.repository.CustomerRepository
import org.springframework.stereotype.Service

@Service
class CustomerService(private val customerRepository: CustomerRepository) {
    fun create(request: CreateCustomerRequest): CustomerResponse {
        val customer =
            Customer(
                firstName = request.firstName,
                lastName = request.lastName,
                dateOfBirth = request.dateOfBirth,
            )
        return customerRepository.save(customer).toResponse()
    }

    fun getAll(): List<CustomerResponse> = customerRepository.findAll().map { it.toResponse() }

    fun getById(id: Long): CustomerResponse =
        customerRepository
            .findById(id)
            .orElseThrow { NoSuchElementException("Customer with id $id not found") }
            .toResponse()

    private fun Customer.toResponse() =
        CustomerResponse(
            id = id,
            firstName = firstName,
            lastName = lastName,
            dateOfBirth = dateOfBirth,
            createdAt = createdAt,
        )
}
