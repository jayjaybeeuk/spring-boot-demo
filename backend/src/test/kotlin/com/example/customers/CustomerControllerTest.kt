package com.example.customers

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class CustomerControllerTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Test
    fun `POST customers returns 201 with created customer`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "firstName": "Jane",
                      "lastName": "Smith",
                      "dateOfBirth": "1990-05-15"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isCreated() }
                jsonPath("$.id") { exists() }
                jsonPath("$.firstName") { value("Jane") }
                jsonPath("$.lastName") { value("Smith") }
                jsonPath("$.dateOfBirth") { value("1990-05-15") }
                jsonPath("$.createdAt") { exists() }
            }
    }

    @Test
    fun `POST customers returns 400 when firstName is blank`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "firstName": "",
                      "lastName": "Smith",
                      "dateOfBirth": "1990-05-15"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("firstName") }
            }
    }

    @Test
    fun `POST customers returns 400 when dateOfBirth is in the future`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "firstName": "Jane",
                      "lastName": "Smith",
                      "dateOfBirth": "2099-01-01"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("dateOfBirth") }
            }
    }

    @Test
    fun `POST customers returns 400 with standard envelope for invalid date format`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "firstName": "Jane",
                      "lastName": "Smith",
                      "dateOfBirth": "not-a-date"
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("dateOfBirth") }
                jsonPath("$.errors[0].message") { value("must be a valid date") }
            }
    }

    @Test
    fun `POST customers returns 400 with standard envelope for malformed JSON`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
                content =
                    """
                    {
                      "firstName": "Jane",
                      "lastName": "Smith",
                      "dateOfBirth": "1990-05-15",
                    }
                    """.trimIndent()
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("body") }
                jsonPath("$.errors[0].message") { value("malformed request body") }
            }
    }

    @Test
    fun `POST customers returns 400 with standard envelope when request body is missing`() {
        mockMvc
            .post("/api/customers") {
                contentType = MediaType.APPLICATION_JSON
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("body") }
                jsonPath("$.errors[0].message") { value("malformed request body") }
            }
    }

    @Test
    fun `GET customers returns 200 with list`() {
        mockMvc
            .get("/api/customers")
            .andExpect {
                status { isOk() }
                jsonPath("$") { isArray() }
            }
    }

    @Test
    fun `GET customers by id returns 404 when not found`() {
        mockMvc
            .get("/api/customers/99999")
            .andExpect {
                status { isNotFound() }
                jsonPath("$.errors[0].field") { value("id") }
            }
    }

    @Test
    fun `GET customers by id returns 400 with standard envelope for invalid path variable`() {
        mockMvc
            .get("/api/customers/not-a-number")
            .andExpect {
                status { isBadRequest() }
                jsonPath("$.errors[0].field") { value("id") }
                jsonPath("$.errors[0].message") { value("must be a valid Long") }
            }
    }
}
