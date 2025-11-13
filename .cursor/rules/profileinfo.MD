# EliteScore API — v1 (Extract: Profile)

Base URL
--------
All endpoints are prefixed with `/v1`.

Content Types
-------------
- Request: application/json
- Response: application/json

Response Envelope
-----------------
Schema: ApiResponse<T>  — fields: success (bool), message (string), data (T or null). :contentReference[oaicite:0]{index=0}

Data Model: ProfileInfo
-----------------------
Returned by the GET endpoints below. Fields: :contentReference[oaicite:1]{index=1}
{
"userId": integer,
"phoneNumber": string | null,
"firstName": string | null,
"lastName": string | null,
"bio": string | null,
"resume": object | null,            // arbitrary JSON (stored as JsonNode)
"followersCount": integer | null,
"followingCount": integer | null,
"visibility": "PUBLIC" | "PRIVATE", // string enum
"createdAt": string | null,         // ISO-8601
"updatedAt": string | null          // ISO-8601
}

==================================================
# Resource Path: /v1/users/profile  :contentReference[oaicite:2]{index=2}

## POST /v1/users/profile/add_profile
Summary: Create your profile for the first time.
Auth: required (JWT; uses `userId` from request attributes)
Consumes: application/json
Produces: application/json

Request Body:
{
"phoneNumber": string,          // required (else API returns 204 with message)
"firstName": string,            // required (else 204)
"lastName": string,             // required (else 204)
"bio": string | null,           // optional; defaults to "No bio added so far"
"resume": object | null,        // ignored at creation; set to null
"visibility": "PUBLIC"|"PRIVATE"|null // ignored; defaults to PUBLIC
}

Behavior:
- Initializes `createdAt` and `updatedAt` to now; `visibility` set to PUBLIC; `resume` forced to null. :contentReference[oaicite:3]{index=3}

Responses:
- 201 Created — "Profile created successfully"; data: null
- 204 No Content — if a required field is missing; message indicates which one (e.g., "Phone number not added"). Note: although a body is set in code, HTTP 204 typically has no body. :contentReference[oaicite:4]{index=4}
- 401 Unauthorized — "User does not exist" (acting user missing). :contentReference[oaicite:5]{index=5}

--------------------------------------------------
## PATCH /v1/users/profile/update_profile
Summary: Partially update your profile (only provided fields are changed).
Auth: required

Request Body (all fields optional; only provided ones are updated):
{
"phoneNumber": string,
"firstName": string,
"lastName": string,
"bio": string,
"resume": object,               // arbitrary JSON (JsonNode)
"visibility": "PUBLIC"|"PRIVATE"
}

Behavior:
- Only non-null fields overwrite existing values; updates `updatedAt` to now. :contentReference[oaicite:6]{index=6}

Responses:
- 200 OK — "Profile updated successfully"; data: null
- 401 Unauthorized — "User does not exist" (acting user missing). :contentReference[oaicite:7]{index=7}

--------------------------------------------------
## GET /v1/users/profile/get_profile/{userId}
Summary: Get a user’s profile by user ID, with visibility adjusted by block/follow relations.
Auth: required (reads acting `userId` from request)

Path Params:
- userId (int) — target user ID

Behavior:
- Loads target profile.
- If acting user has blocked target **or** is blocked by target, sets:
    - `bio` to "You have blocked this user"
    - `visibility` to PRIVATE
- If acting user follows target, forces `visibility` to PUBLIC (overrides). :contentReference[oaicite:8]{index=8}

Responses:
- 200 OK — "Profile retrieved"; data: ProfileInfo
- (Exceptions are thrown on handler errors; no explicit 404 path here.) :contentReference[oaicite:9]{index=9}

--------------------------------------------------
## GET /v1/users/profile/get_own_profile
Summary: Get your own profile.
Auth: required

Responses:
- 200 OK — "Profile retrieved"; data: ProfileInfo
- 401 Unauthorized — "User does not exist" (acting user missing). :contentReference[oaicite:10]{index=10}

==================================================

Examples — cURL
---------------

# Create profile
curl -X POST "$BASE/v1/users/profile/add_profile" \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
"phoneNumber":" +123456789",
"firstName":"Ada",
"lastName":"Lovelace",
"bio":"Computing pioneer"
}'

# Update profile (partial)
curl -X PATCH "$BASE/v1/users/profile/update_profile" \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
"bio":"New bio",
"visibility":"PRIVATE",
"resume":{"skills":["Java","SQL"],"years":3}
}'

# Get another user’s profile (visibility may be altered by block/follow)
curl -X GET "$BASE/v1/users/profile/get_profile/42" \
-H "Authorization: Bearer <token>"

# Get my profile
curl -X GET "$BASE/v1/users/profile/get_own_profile" \
-H "Authorization: Bearer <token>"