package com.example.customers

import com.fasterxml.jackson.databind.ObjectMapper
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

    @Autowired
    lateinit var objectMapper: ObjectMapper

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

    @Test
    fun `GET customers by id returns 200 with customer`() {
        val createResult =
            mockMvc
                .post("/api/customers") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        """
                        {
                          "firstName": "Alice",
                          "lastName": "Jones",
                          "dateOfBirth": "1985-03-10"
                        }
                        """.trimIndent()
                }.andReturn()

        val id = objectMapper.readTree(createResult.response.contentAsString).get("id").asLong()

        mockMvc
            .get("/api/customers/$id")
            .andExpect {
                status { isOk() }
                jsonPath("$.id") { value(id) }
                jsonPath("$.firstName") { value("Alice") }
                jsonPath("$.lastName") { value("Jones") }
                jsonPath("$.dateOfBirth") { value("1985-03-10") }
            }
    }

    @Test
    fun `GET customers returns newest customer first`() {
        val olderResult =
            mockMvc
                .post("/api/customers") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{"firstName":"Older","lastName":"Customer","dateOfBirth":"1980-01-01"}"""
                }.andReturn()
        val olderId = objectMapper.readTree(olderResult.response.contentAsString).get("id").asLong()

        val newerResult =
            mockMvc
                .post("/api/customers") {
                    contentType = MediaType.APPLICATION_JSON
                    content = """{"firstName":"Newer","lastName":"Customer","dateOfBirth":"1990-06-15"}"""
                }.andReturn()
        val newerId = objectMapper.readTree(newerResult.response.contentAsString).get("id").asLong()

        val listResult = mockMvc.get("/api/customers").andReturn()
        val customers = objectMapper.readTree(listResult.response.contentAsString)
        val ids = (0 until customers.size()).map { customers[it].get("id").asLong() }

        assert(ids.indexOf(newerId) < ids.indexOf(olderId)) {
            "Expected newer customer (id=$newerId) to appear before older customer (id=$olderId) in list"
        }
    }
}
