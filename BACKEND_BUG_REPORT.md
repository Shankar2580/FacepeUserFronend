# Backend Bug Report - PIN Verification Endpoint

## 🔴 Critical Issue: 500 Internal Server Error

**Date:** November 8, 2025  
**Reporter:** Frontend Developer  
**Severity:** HIGH - Blocks face update feature

---

## Issue Summary

The `/cb/auth/verify-current-pin` endpoint is returning a **500 Internal Server Error** when a user enters their **correct PIN**. This is preventing users from updating their face biometric data.

---

## Error Details

### Endpoint
- **URL:** `POST /cb/auth/verify-current-pin`
- **Method:** POST
- **Headers:** 
  - `Authorization: Bearer [valid_JWT_token]`
  - `Content-Type: application/json`

### Request Body
```json
{
  "pin": "1234"
}
```
*(User's actual correct PIN - verified working in other flows)*

### Expected Response (200 OK)
```json
{
  "success": true,
  "message": "PIN verified successfully"
}
```

### Actual Response (500 Internal Server Error)
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## Frontend Logs

```
LOG  🔐 PIN Verification Started
LOG  📍 PIN length: 4
LOG  📍 isVerifying: false
LOG  📍 isLocked: false
LOG  📡 Calling apiService.verifyCurrentPin...

ERROR  ❌ PIN Verification Error: {
  "data": {
    "error": "INTERNAL_SERVER_ERROR", 
    "message": "An unexpected error occurred"
  }, 
  "fullError": [AxiosError: Request failed with status code 500], 
  "message": "Request failed with status code 500", 
  "status": 500
}
```

---

## Context

This issue started happening after implementing the progressive PIN lockout system. The endpoint was working before the lockout feature was added.

### What Works:
✅ User can set PIN initially  
✅ Face registration works (doesn't require PIN)  
✅ Other authenticated endpoints work  
✅ JWT token is valid  

### What Doesn't Work:
❌ PIN verification for face update  
❌ `/cb/auth/verify-current-pin` endpoint crashes  

---

## Suspected Backend Issues

Based on the implementation guide, the backend should have:

1. **Progressive Lockout Tables** - Check if these exist:
   - `pin_attempts` or similar table
   - `lockout_status` or similar table
   - Required columns: `user_id`, `attempt_count`, `locked_until`, etc.

2. **PIN Verification Service** - Check `app/services/pin_attempt_service.py`:
   - Database connection
   - Query execution
   - Error handling
   - Timezone handling for `locked_until`

3. **API Route Handler** - Check the route that handles `/cb/auth/verify-current-pin`:
   - Request validation
   - Service method calls
   - Response formatting

---

## Debug Steps Needed

### 1. Check Backend Logs
Look for Python stack trace when the 500 error occurs. Should show:
- Database errors
- Missing table errors
- Query errors
- Timezone conversion errors

### 2. Verify Database Tables
```sql
-- Check if PIN attempt tracking table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'pin_attempts';

-- Check table structure
DESCRIBE pin_attempts;
```

### 3. Test Endpoint Directly
```bash
curl -X POST http://your-backend-url/cb/auth/verify-current-pin \
  -H "Authorization: Bearer YOUR_VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
```

### 4. Check Environment Variables
- Database connection string
- Timezone settings
- Redis/cache connection (if used for lockout tracking)

---

## Possible Root Causes

### Most Likely:
1. **Missing database table** for PIN attempt tracking
2. **Database migration not run** after adding lockout feature
3. **Missing database indexes** causing query failures

### Also Check:
4. **Timezone conversion error** in `locked_until` field
5. **Redis connection issue** if lockout uses cache
6. **Database user permissions** - can't write to new tables
7. **SQLAlchemy model mismatch** with actual database schema

---

## Expected Backend Implementation

Based on the implementation guide provided, the backend should:

### 1. Track Attempts
```python
# Check current lockout status
lockout = get_lockout_status(user_id)
if lockout.is_locked and lockout.locked_until > now():
    return 423, {
        "message": "PIN temporarily locked",
        "locked_until": lockout.locked_until.isoformat()
    }

# Verify PIN
if verify_pin(user_id, pin):
    clear_attempts(user_id)
    return 200, {"success": True, "message": "PIN verified"}
else:
    increment_attempts(user_id)
    attempts = get_attempts(user_id)
    
    # Check if lockout should trigger
    if should_trigger_lockout(attempts):
        locked_until = calculate_lockout_duration(attempts)
        return 401, {
            "message": "Invalid PIN",
            "locked_until": locked_until.isoformat()
        }
    else:
        return 401, {"message": "Invalid PIN"}
```

### 2. Database Schema (Expected)
```sql
CREATE TABLE pin_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    lockout_level INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Temporary Workaround

Frontend now shows a user-friendly error message:
> "Server error occurred. Please try again later or contact support."

But this doesn't fix the underlying backend issue.

---

## Priority

**🔴 HIGH PRIORITY** - This blocks a core security feature (face update).

Users cannot update their biometric data, which is needed when:
- Phone changes
- Face changes (glasses, beard, etc.)
- Previous face data becomes invalid

---

## Action Required

1. **Check backend server logs** for the actual Python error
2. **Verify database tables** for PIN attempt tracking exist
3. **Run any pending migrations** for the lockout feature
4. **Test the endpoint** with the correct database setup
5. **Share the actual error** from backend logs with frontend team

---

## Contact

If you need more information or frontend logs, contact the frontend developer.

**Status:** OPEN - Waiting for backend fix
