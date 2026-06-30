# Referral API — Frontend Integration Guide

## How the Referral System Works

1. **John shares his referral link** (contains his username)
2. **Peter signs up** using John's link → Peter gets **+1 point** immediately
3. **Peter completes his first puzzle** → Peter earns puzzle points AND John gets **+3 referral bonus points**
4. John's leaderboard total = `puzzlePoints + referralPoints`

All points (puzzle + referral) reset at the end of each month.

---

## Step 1 — Build the Referral Link

Each user's referral code is their **username**. Construct the link on the frontend:

```
https://yourapp.com/register?ref=<username>
```

Fetch the logged-in user's username from:
```http
GET /api/v1/me
Authorization: Bearer <token>
```

The current implementation reads `?ref=` from the URL and sends it as `referrerUsername` in the signup body — already wired up in `register/page.tsx`.

---

## Step 2 — Pass Referral Info at Signup

When Peter registers via the referral link, the frontend sends one of these fields:

```http
POST /api/v1/auth/register/gamer
Content-Type: application/json

{
  "firstName": "Peter",
  "lastName": "Smith",
  "email": "peter@example.com",
  "password": "secret123",
  "referrerUsername": "john_doe"
}
```

| Field | Value | Notes |
|-------|-------|-------|
| `referrerId` | John's MongoDB `_id` | Most reliable |
| `referrerUsername` | John's `username` | Used by this app via `?ref=` |
| `referralCode` | userId, username, or email | Generic fallback |

Same fields work for Google OAuth signup:
```http
POST /api/v1/auth/google
{
  "idToken": "firebase_id_token",
  "referralCode": "john_doe"
}
```

> Peter's points are incremented by **+1** immediately on successful signup with a valid referral code.

---

## Step 3 — Display the Referral Dashboard (Authenticated)

```http
GET /api/v1/referrals/my-stats?month=2026-06
Authorization: Bearer <token>
```

**Query params:**
| Param | Default | Description |
|-------|---------|-------------|
| `month` | current month | `YYYY-MM` format |

**Response:**
```json
{
  "success": true,
  "month": "2026-06",
  "stats": {
    "totalReferrals": 5,
    "pendingReferrals": 2,
    "successfulReferralsThisMonth": 3,
    "referralPointsThisMonth": 9,
    "totalReferralPointsAllTime": 15,
    "referredUsersThisMonth": [
      {
        "userId": "...",
        "fullName": "Peter Smith",
        "username": "peter_smith",
        "avatar": "https://...",
        "successfulAt": "2026-06-25T10:00:00Z",
        "pointsAwarded": 3
      }
    ]
  }
}
```

**What to display:**
| UI element | Field |
|------------|-------|
| Referrals this month | `stats.successfulReferralsThisMonth` |
| Referral points this month | `stats.referralPointsThisMonth` |
| Pending (signed up, haven't played) | `stats.pendingReferrals` |
| Referred users list | `stats.referredUsersThisMonth` |

---

## Step 4 — Monthly Leaderboard

```http
GET /api/v1/leaderboards/monthly
```

**Response:**
```json
{
  "success": true,
  "leaderboard": {
    "type": "monthly",
    "monthKey": "2026-06",
    "resetsAt": "End of 2026-06",
    "totalPlayers": 25,
    "entries": [
      {
        "position": 1,
        "userId": "...",
        "fullName": "John Doe",
        "username": "john_doe",
        "avatar": "https://...",
        "puzzlesSolved": 10,
        "puzzlePoints": 12,
        "referralPoints": 9,
        "referralCount": 3,
        "totalPoints": 21
      }
    ]
  }
}
```

**Per-row display:**
| Column | Field |
|--------|-------|
| Rank | `position` |
| Player | `fullName` / `username` / `avatar` |
| Puzzle Points | `puzzlePoints` |
| Referral Bonus | `referralPoints` |
| Total Points | `totalPoints` |

---

## Step 5 — Weekly Leaderboard

```http
GET /api/v1/leaderboards/weekly
```

Returns puzzle points only (no referral breakdown) for the current week (Mon–Sun).

---

## All Referral Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/referrals/my-stats?month=YYYY-MM` | Required | Authenticated user's own stats |
| `GET` | `/api/v1/referrals/summary?month=YYYY-MM&limit=20` | None | Top referrers leaderboard |
| `GET` | `/api/v1/referrals/events?month=YYYY-MM&eventType=signup` | None | Referral event log |

---

## Points Reference

| Action | Points | Who gets it |
|--------|--------|-------------|
| Solve any puzzle (first time per day) | +1 | Solver |
| Solve sliding puzzle (first time per day) | +2 | Solver |
| Sign up via referral link | +1 | New user |
| Referred friend completes first puzzle | +3 | Referrer |

`leaderboard totalPoints = puzzlePoints + referralPoints`  
Both reset to 0 at the end of each month.

---

## Testing the Flow

```bash
# 1. Register John
POST /api/v1/auth/register/gamer
{ "firstName":"John","lastName":"Doe","email":"john@test.com","password":"pass123" }
# Activate John → login → get john_token

# 2. Get John's username
GET /api/v1/me   (Authorization: Bearer john_token)
# username = "john_doe"

# 3. Register Peter with John's referral
POST /api/v1/auth/register/gamer
{ "firstName":"Peter","lastName":"Smith","email":"peter@test.com","password":"pass123","referrerUsername":"john_doe" }
# Peter gets +1 point at signup

# 4. Peter solves his first puzzle
POST /api/v1/campaigns/:campaignId/submit
Authorization: Bearer peter_token
{ "timeTaken":30000,"movesTaken":20,"solved":true,"answers":[0,1,2,1,3] }
# Peter gets +1 (or +2 for sliding_puzzle); John gets +3 referral bonus

# 5. Check John's referral stats
GET /api/v1/referrals/my-stats
Authorization: Bearer john_token
# stats.referralPointsThisMonth = 3, stats.successfulReferralsThisMonth = 1

# 6. Check monthly leaderboard
GET /api/v1/leaderboards/monthly
# John's entry shows puzzlePoints + referralPoints = totalPoints
```
