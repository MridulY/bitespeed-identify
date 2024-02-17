# Contact Identification API

## Overview

This API provides functionality to identify a contact by their email or phone number. It supports creating a new contact if one does not exist or updating the linkage for existing contacts based on the provided information.

## Endpoint

### Identify Contact

- **Method and Path**: `POST /identify`
- **Content-Type**: `application/json`
- **Description**: Identifies a contact based on the provided email or phone number. Creates a new primary contact if none exists, or updates existing contact information accordingly.

#### Request Body

```
{
  "email": "optional@example.com",
  "phoneNumber": "1234567890"
}
```

#### Successful Response
##### Status Code: 200 OK

```
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["optional@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}

```
