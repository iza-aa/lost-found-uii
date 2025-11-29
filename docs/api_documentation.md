# API Documentation

## Authentication

### Register
**Endpoint**: `POST /auth/register`

**Description**: Register a new user.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@students.uii.ac.id",
  "password": "password123",
  "phone": "08123456789",
  "role": "MAHASISWA",
  "faculty": "Fakultas Teknologi Industri"
}
```
*   `role`: One of `PUBLIK`, `MAHASISWA`, `STAFF_DOSEN`.
*   `faculty`: Required if role is `MAHASISWA` (or `PUBLIK` if applicable). Must be `null` or omitted if role is `STAFF_DOSEN`.

**Responses**:
*   `200 OK`: Registration successful.
*   `400 Bad Request`: Validation error (e.g., invalid email, short password).
*   `500 Internal Server Error`: Server error.

### Login
**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and get tokens.

**Request Body**:
```json
{
  "email": "john@students.uii.ac.id",
  "password": "password123"
}
```

**Responses**:
*   `200 OK`: Login successful.
    ```json
    {
      "token": "eyJhbG...",
      "refresh_token": "...",
      "user": { ... }
    }
    ```
*   `400 Bad Request`: Missing email or password.
    *   `{"error": "email and password are required"}`

### Submit Claim
**Endpoint**: `POST /items/{id}/claim`

**Description**: Submit a claim for a found item.

**Request Body**:
```json
{
  "answer_input": "My ID Card name is John"
}
```

**Responses**:
*   `200 OK`: Claim submitted.

### Decide Claim
**Endpoint**: `PUT /claims/{id}/decide`

**Description**: Approve or reject a claim (Finder only).

**Request Body**:
```json
{
  "status": "APPROVED"
}
```
*   `status`: `APPROVED` or `REJECTED`.

**Responses**:
*   `200 OK`: Claim status updated.

## Security & Validation Notes
*   **Input Validation**: All endpoints validate required fields and formats (e.g., email).
*   **SQL Injection**: Using GORM (ORM) prevents SQL injection by automatically escaping queries.
*   **XSS**: API returns JSON, so XSS risk is low unless frontend renders raw HTML. Ensure frontend escapes output.
*   **Browser Back Button**: The API is stateless (REST). Browser back button behavior depends on the frontend implementation. After logout, the frontend should clear tokens and redirect to login; pressing back should not allow access to protected pages if the frontend checks auth state correctly.
