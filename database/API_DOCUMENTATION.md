# EventoraX API Documentation

**Base URL:** `http://localhost:3000/api`  
**Version:** 1.0.0  
**Database:** MySQL  

---

## Authentication

All protected routes require JWT token in header:
Authorization: Bearer <token>
---

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}

Error
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}

HTTP Status Codes
Code	Meaning
200	    Success
201	    Created
400	    Bad Request
401	    Unauthorized
403	    Forbidden
404	    Not Found
500	    Server Error

