package com.example.customers.dto

import java.time.Instant
import java.time.LocalDate

data class CustomerResponse(
    val id: Long,
    val firstName: String,
    val lastName: String,
    val dateOfBirth: LocalDate,
    val createdAt: Instant,
)
