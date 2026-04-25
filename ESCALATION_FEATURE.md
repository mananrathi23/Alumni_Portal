# AI Support Escalation Choice Feature

## Overview
Instead of automatically escalating to an admin when the AI cannot answer a question, users now have the option to either:
1. **Continue with AI** - Keep discussing with the AI assistant
2. **Talk to Admin** - Escalate the conversation to a human admin

## Changes Made

### Backend Changes

#### 1. **SupportTicketModel.js** - Updated Schema
Added new fields to track escalation workflow:
- `status`: Added new enum value `"Escalation_Offered"` (in addition to existing `"AI_Handling"`, `"Escalated"`, `"Resolved"`)
- `escalationOffered`: Boolean flag to mark if escalation option was offered
- `userChoice`: Stores user's decision - either `"continue_with_ai"` or `"escalate_to_admin"`

**File**: `backend/models/SupportTicketModel.js`

#### 2. **SupportController.js** - New Logic & Endpoint

**Modified `askSupportChat` function:**
- When AI responds with "ESCALATE", instead of automatically escalating:
  - Sets ticket status to `"Escalation_Offered"`
  - Sends user-friendly message asking for their preference
  - Returns `escalationOffered: true` flag to frontend

- Added check for `"Escalation_Offered"` status to prevent double-processing

**New `handleEscalationChoice` endpoint:**
- Accepts POST request with `choice` parameter
- Validates choice: `"continue_with_ai"` or `"escalate_to_admin"`
- If `continue_with_ai`: Sets status back to `"AI_Handling"`, allows conversation to continue
- If `escalate_to_admin`: Sets status to `"Escalated"`, notifies user admin will help

**File**: `backend/controllers/SupportController.js`

#### 3. **SupportRouter.js** - New Route
Added new route:
```javascript
router.post("/escalation-choice", isAuthenticated, handleEscalationChoice);
```

**File**: `backend/routes/SupportRouter.js`

### Frontend Changes

#### **ChatbotWidget.jsx** - Enhanced UI/UX

**New State Variables:**
- `ticketId`: Stores the current ticket ID
- `choosingEscalation`: Boolean to show/hide choice buttons

**New Function `handleEscalationChoice`:**
- Sends user's choice to the new backend endpoint
- Updates ticket status and messages
- Shows appropriate UI based on choice

**Updated `fetchTicket` function:**
- Sets ticket ID
- Detects if escalation is being offered and shows choice buttons

**Updated `handleSend` function:**
- Checks if `escalationOffered` is true in response
- Shows choice buttons instead of hiding them

**Updated UI Components:**
- **Header**: Shows appropriate status indicator (robot, headset, or loading icon)
- **Status text**: Updates to show "Choose assistance method..." when escalation is offered
- **Input area**: 
  - Shows two prominent buttons: "Continue with AI" and "Talk to Admin"
  - Buttons have appropriate icons and colors
  - Replaces the normal message input during escalation choice

**File**: `frontend/src/Components/ChatbotWidget.jsx`

## User Experience Flow

### Before (Old Flow)
```
User asks question 
    ↓
AI can't answer
    ↓
AUTOMATIC escalation to Admin
    ↓
User must wait for Admin
```

### After (New Flow)
```
User asks question
    ↓
AI can't answer
    ↓
AI offers choice to user:
├─ Continue with AI → User can ask different questions
└─ Talk to Admin → Escalates to human support
```

## API Changes

### New Endpoint
**POST** `/api/v1/support/escalation-choice`
- **Authentication**: Required
- **Body**: `{ choice: "continue_with_ai" | "escalate_to_admin" }`
- **Response**: Updated ticket with new status and messages

### Updated Endpoint Response
**POST** `/api/v1/support/ask`
- Now returns: `{ ticket, reply, escalationOffered }`
- `escalationOffered`: True when AI says "ESCALATE"

## Testing Checklist

- [ ] Test AI sending "ESCALATE" response shows choice buttons
- [ ] Test "Continue with AI" allows new questions
- [ ] Test "Talk to Admin" escalates ticket properly
- [ ] Test Admin can see escalated tickets with correct status
- [ ] Test ticket status updates correctly in both UI and database
- [ ] Test socket notifications work after escalation choice
- [ ] Test dark mode styling for new buttons
- [ ] Test mobile responsiveness of choice buttons

## Configuration Notes

- Uses environment variable `VITE_BACKEND_URL` for API base URL
- Falls back to `http://localhost:4000` if not set
- Requires valid authentication via withCredentials: true

## Future Enhancements

- Add reason/comment when escalating
- Add AI confidence score to trigger escalation suggestion
- Category-based routing (billing → billing team, technical → tech support, etc.)
- SLA tracking for Admin response time
- User satisfaction feedback after resolution
