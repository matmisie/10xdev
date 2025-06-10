# REST API Plan

This document outlines the REST API design for the "Inteligentne Fiszki" application, based on the product requirements, database schema, and technical stack.

## 1. Resources

The API is built around two primary resources:

- **Flashcards**: Represents the user's collection of flashcards.
  - Database Table: `public.flashcards`
- **AI Suggestions**: Represents the AI-generated flashcard suggestions pending user review.
  - Database Table: `public.ai_suggestions`

## 2. Endpoints

All endpoints are prefixed with `/api`.

### 2.1. Flashcards

#### Get All Flashcards

- **Method**: `GET`
- **URL**: `/flashcards`
- **Description**: Retrieves a paginated list of all flashcards for the authenticated user.
- **Query Parameters**:
  - `page` (optional, integer, default: 1): The page number for pagination.
  - `pageSize` (optional, integer, default: 20): The number of items per page.
  - `sortBy` (optional, string, default: 'created_at'): Field to sort by.
  - `order` (optional, string, default: 'desc'): Sort order ('asc' or 'desc').
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "front": "What is REST?",
          "back": "Representational State Transfer.",
          "source": "manual",
          "leitner_box": 1,
          "next_review_at": "2023-10-27T10:00:00Z",
          "created_at": "2023-10-26T10:00:00Z",
          "updated_at": "2023-10-26T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 1,
        "totalPages": 1
      }
    }
    ```
- **Error Response**:
  - **Code**: `401 Unauthorized`

---

#### Create a Flashcard (Manual)

- **Method**: `POST`
- **URL**: `/flashcards`
- **Description**: Creates a new flashcard manually.
- **Request Body**:
  ```json
  {
    "front": "What is the capital of Poland?",
    "back": "Warsaw"
  }
  ```
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**: The newly created flashcard object.
    ```json
    {
      "id": "new-uuid",
      "front": "What is the capital of Poland?",
      "back": "Warsaw",
      "source": "manual",
      "leitner_box": 1,
      "next_review_at": "2023-10-27T10:00:00Z",
      "created_at": "2023-10-27T10:00:00Z",
      "updated_at": "2023-10-27T10:00:00Z"
    }
    ```
- **Error Response**:
  - **Code**: `400 Bad Request` (e.g., validation error)
  - **Code**: `401 Unauthorized`
  - **Code**: `409 Conflict` (if a flashcard with the same front already exists for the user)

---

#### Get a Single Flashcard

- **Method**: `GET`
- **URL**: `/flashcards/{id}`
- **Description**: Retrieves a single flashcard by its ID.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The requested flashcard object.
- **Error Response**:
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`

---

#### Update a Flashcard

- **Method**: `PATCH`
- **URL**: `/flashcards/{id}`
- **Description**: Updates the front or back of a flashcard.
- **Request Body**:
  ```json
  {
    "front": "An updated question?",
    "back": "An updated answer."
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The updated flashcard object.
- **Error Response**:
  - **Code**: `400 Bad Request`
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`
  - **Code**: `409 Conflict` (if updating the front creates a duplicate)

---

#### Delete a Flashcard

- **Method**: `DELETE`
- **URL**: `/flashcards/{id}`
- **Description**: Deletes a flashcard by its ID.
- **Success Response**:
  - **Code**: `204 No Content`
- **Error Response**:
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`

---

### 2.2. Study Session

#### Get Cards for Review

- **Method**: `GET`
- **URL**: `/flashcards/review`
- **Description**: Retrieves all flashcards that are due for review today for the authenticated user.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: An array of flashcard objects due for review.
    ```json
    [
      {
        "id": "uuid",
        "front": "Question to review",
        "back": "Answer to review",
        ...
      }
    ]
    ```
- **Error Response**:
  - **Code**: `401 Unauthorized`

---

#### Grade a Reviewed Card

- **Method**: `POST`
- **URL**: `/flashcards/{id}/review`
- **Description**: Submits the result of a review for a single flashcard. The server handles the Leitner system logic.
- **Request Body**:
  ```json
  {
    "outcome": "correct"
  }
  ```
  or
  ```json
  {
    "outcome": "incorrect"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The flashcard object with its updated `leitner_box` and `next_review_at` date.
- **Error Response**:
  - **Code**: `400 Bad Request` (invalid outcome)
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`

---

### 2.3. AI Suggestions

#### Generate AI Suggestions

- **Method**: `POST`
- **URL**: `/ai-suggestions`
- **Description**: Takes a block of text and generates flashcard suggestions using an LLM. It persists the suggestions in the database with a 'pending' status.
- **Request Body**:
  ```json
  {
    "text": "The mitochondria is the powerhouse of the cell. It generates most of the cell's supply of adenosine triphosphate (ATP)."
  }
  ```
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**: An array of the created `ai_suggestion` objects.
    ```json
    [
      {
        "id": "suggestion-uuid-1",
        "user_id": "user-uuid",
        "batch_id": "batch-uuid",
        "front_suggestion": "What is the powerhouse of the cell?",
        "back_suggestion": "The mitochondria",
        "status": "pending",
        "created_at": "2023-10-27T12:00:00Z"
      }
    ]
    ```
- **Error Response**:
  - **Code**: `400 Bad Request` (e.g., empty text)
  - **Code**: `401 Unauthorized`
  - **Code**: `429 Too Many Requests` (if rate limit is exceeded)
  - **Code**: `503 Service Unavailable` (if the external LLM service fails)

---

#### Get Pending AI Suggestions

- **Method**: `GET`
- **URL**: `/ai-suggestions`
- **Description**: Retrieves all AI-generated suggestions with a `pending` status for the user to review.
- **Query Parameters**:
  - `status` (optional, string, default: 'pending'): Filter suggestions by status.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: An array of `ai_suggestion` objects.
- **Error Response**:
  - **Code**: `401 Unauthorized`

---

#### Accept an AI Suggestion

- **Method**: `POST`
- **URL**: `/ai-suggestions/{id}/accept`
- **Description**: Accepts an AI suggestion. This is a transactional operation that:
  1.  Creates a new `flashcard` with `source: 'ai'`.
  2.  Updates the `ai_suggestion` status to `accepted`.
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**: The newly created flashcard object.
- **Error Response**:
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found` (suggestion does not exist or does not belong to the user)
  - **Code**: `409 Conflict` (The suggestion has already been processed, or accepting it would create a duplicate flashcard).

---

#### Update an AI Suggestion (Reject)

- **Method**: `PATCH`
- **URL**: `/ai-suggestions/{id}`
- **Description**: Updates the status of an AI suggestion. The primary use case is for rejecting it.
- **Request Body**:
  ```json
  {
    "status": "rejected"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The updated `ai_suggestion` object.
- **Error Response**:
  - **Code**: `400 Bad Request`
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`

## 3. Authentication and Authorization

- **Mechanism**: The API will use JSON Web Tokens (JWT) provided by Supabase Auth.
- **Implementation**:
  1.  The client application will send the Supabase JWT in the `Authorization` header of every request: `Authorization: Bearer <SUPABASE_JWT>`.
  2.  On the server (in the Astro API route), the Supabase client library will be used to validate the token and identify the user (`auth.uid()`).
  3.  All database queries will be performed by the authenticated user, and the Row-Level Security (RLS) policies defined in the database schema will automatically enforce data isolation, ensuring users can only access their own data.

## 4. Validation and Business Logic

- **Input Validation**: All incoming request bodies and parameters will be validated for type, presence, and format (e.g., string length).
  - `flashcards.front`: required, string, max 200 chars.
  - `flashcards.back`: required, string, max 500 chars.
  - `ai-suggestions.text`: required, non-empty string.
- **Business Logic Implementation**:
  - **Leitner System**: The logic for calculating `leitner_box` progression and `next_review_at` is encapsulated entirely within the `POST /flashcards/{id}/review` endpoint on the server. The client only reports `'correct'` or `'incorrect'`.
  - **AI Suggestion Flow**: The process of generating suggestions (`POST /ai-suggestions`), creating a flashcard from a suggestion (`POST /ai-suggestions/{id}/accept`), and tracking its status is handled by the API to ensure data integrity and support for success metrics.
  - **Uniqueness**: The API will catch unique constraint violations from the database (`UNIQUE (user_id, lower(front))` on `flashcards`) and translate them into a user-friendly `409 Conflict` error.
- **Rate Limiting**: The `POST /api/ai-suggestions` endpoint will be rate-limited on a per-user basis to prevent abuse and control costs associated with the external LLM API. A suggested limit is 10 requests per user per minute.
