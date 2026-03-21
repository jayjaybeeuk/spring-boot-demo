package com.example.customers.controller

import com.example.customers.dto.CreateCustomerRequest
import com.example.customers.dto.CustomerResponse
import com.example.customers.service.CustomerService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/customers")
class CustomerController(private val customerService: CustomerService) {
    @PostMapping
    fun create(
        @Valid @RequestBody request: CreateCustomerRequest,
    ): ResponseEntity<CustomerResponse> = ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request))

    @GetMapping
    fun getAll(): ResponseEntity<List<CustomerResponse>> = ResponseEntity.ok(customerService.getAll())

    @GetMapping("/{id}")
    fun getById(
        @PathVariable id: Long,
    ): ResponseEntity<CustomerResponse> = ResponseEntity.ok(customerService.getById(id))
}
