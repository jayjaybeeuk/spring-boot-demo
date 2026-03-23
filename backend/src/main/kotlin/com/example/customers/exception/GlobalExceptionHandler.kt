package com.example.customers.exception

import com.fasterxml.jackson.databind.exc.InvalidFormatException
import com.fasterxml.jackson.module.kotlin.MissingKotlinParameterException
import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import java.time.LocalDate

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(ex: MethodArgumentNotValidException): ErrorResponse =
        ErrorResponse(
            errors =
                ex.bindingResult.fieldErrors.map {
                    FieldError(it.field, it.defaultMessage ?: "invalid")
                },
        )

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(ex: NoSuchElementException): ErrorResponse =
        ErrorResponse(errors = listOf(FieldError("id", ex.message ?: "not found")))

    @ExceptionHandler(HttpMessageNotReadableException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleNotReadable(ex: HttpMessageNotReadableException): ErrorResponse {
        val cause = ex.cause

        return when (cause) {
            is MissingKotlinParameterException ->
                ErrorResponse(
                    errors =
                        listOf(
                            FieldError(
                                cause.path.lastOrNull()?.fieldName ?: "body",
                                "is required",
                            ),
                        ),
                )

            is InvalidFormatException ->
                ErrorResponse(
                    errors =
                        listOf(
                            FieldError(
                                cause.path.lastOrNull()?.fieldName ?: "body",
                                invalidFormatMessage(cause),
                            ),
                        ),
                )

            else ->
                ErrorResponse(errors = listOf(FieldError("body", "malformed request body")))
        }
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleTypeMismatch(ex: MethodArgumentTypeMismatchException): ErrorResponse =
        ErrorResponse(
            errors =
                listOf(
                    FieldError(
                        ex.name,
                        "must be a valid ${ex.requiredType?.simpleName?.replaceFirstChar { it.uppercaseChar() } ?: "value"}",
                    ),
                ),
        )

    @ExceptionHandler(MissingServletRequestParameterException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleMissingParameter(ex: MissingServletRequestParameterException): ErrorResponse =
        ErrorResponse(errors = listOf(FieldError(ex.parameterName, "is required")))

    private fun invalidFormatMessage(ex: InvalidFormatException): String =
        when (ex.targetType) {
            LocalDate::class.java -> "must be a valid date"
            else -> "has an invalid value"
        }
}
