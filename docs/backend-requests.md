# Backend requests

What the frontend needs from the API that it does not have today, found by checking every
frontend call against the backend source (`pazzell-BE`, branch `pazzell-brain-training`) on
2026-10-07. Items 4 and 5 came from
clicking through the app against the running backend on 2026-10-08. Every path the frontend calls already exists; these are gaps in behaviour, missing
fields and one missing endpoint.

Each item says what the frontend does in the meantime.

## Must fix

### 1. Token refresh cannot work from the browser

`POST /refresh` reads the refresh token only from the `refresh_token` cookie. The API sends
`Access-Control-Allow-Origin: *`, and browsers refuse to send or accept cookies on a
cross-origin request under a wildcard origin. The frontend and the API are on different origins,
so the cookie never arrives.

Either of these fixes it:

- **Preferred:** accept the refresh token in the body, `POST /refresh { "refreshToken": "…" }`,
  and return `{ accessToken, refreshToken }`. The login response already returns
  `refreshToken` in its body and the frontend already stores it. This also avoids third-party
  cookie blocking in Safari and Chrome.
- Or: configure CORS with the frontend origin(s) and `credentials: true` instead of `*`.

**Meanwhile:** the frontend sends `{ refreshToken }` in the body. The API ignores it, the
refresh fails, and the user is sent to the login page when their access token expires.

### 2. An expired or invalid access token should be `401`, with a code

`isAuthenticated` answers `400` with the raw JWT message (`jwt expired`, `jwt malformed`,
`invalid signature`) or `User not found`, and `401` only when the header is missing. A `400` is
indistinguishable from a validation error.

Requested: `401` with `code: "TOKEN_EXPIRED"` (expired) or `code: "UNAUTHENTICATED"` (anything
else), in the standard `{ success, message, code }` shape.

**Meanwhile:** the frontend matches those exact message strings on a `400`. That is fragile.

### 3. `GET /payments/verify/:reference` shares the checkout rate limit

It uses `checkoutLimiter` (10 calls per 10 minutes). The contract says to poll it every few
seconds while a payment is `pending`, which exhausts the limit in about 30 seconds and also
blocks the same user from starting a new checkout.

Requested: its own, looser limiter (for example 60 per 10 minutes).

**Meanwhile:** the return page polls with stretching delays (3s up to 30s, six times) and then
asks the user to check again later.

### 4. Resolved: checkout currency

Checkouts failed on 2026-10-08 with `Currency not supported by merchant` while
`payments.currency` was USD. With the currency set to NGN (Pro 1,500, campaign 15,000), a Pro
purchase and a campaign payment both went through Paystack test mode on 2026-10-09.

One thing still worth doing: when a checkout does fail, the `502 CHECKOUT_FAILED` gives no
reason. Carrying the gateway's reason in `details` for admins would have made this quick to
diagnose.

### 5. A brand without a brand record cannot save its website or logo

Found in the click-through. `PUT /profile/brand` updates the brand record with
`findOneAndUpdate` and no upsert. The test brand account has no brand record
(`GET /profile/brand` returns `brandDetails: null`), so the website and logo are silently
dropped while the response still says "Profile updated successfully". The logo does reach
`user.avatar`.

Requested: create the brand record on brand registration, and upsert it in `PUT /profile/brand`.

**Meanwhile:** the settings page shows the avatar as the logo and warns when the website did
not stick; each campaign asks for its own website and logo.

## Missing endpoint

### 6. `GET /admin/users`

There is no way for an admin to list or look up users. Requested:

`GET /admin/users?role=&q=&page=&limit=` →
`{ page, limit, total, users: [ { id, email, role, name, username, isVerified, plan: { tier, isPro, proUntil }, createdAt } ] }`

where `q` matches email, name or username. The admin area has no user list until this exists.

## Missing fields

### 7. No way to remove a cover image

`PATCH /custom-quizzes/:id`, `PATCH /brand/campaigns/:id` and `PATCH /admin/trivia/topics/:id`
ignore `coverImageUrl: null` (and `""`), so once a cover is set it can only be replaced.

Requested: treat an explicit `coverImageUrl: null` as "remove the cover".

**Meanwhile:** the remove button is hidden for a cover that is already saved.

### 8. `GET /admin/campaigns` items have no `cardCount`

The brand's list has it; the admin's does not, so the admin list cannot show how many cards a
campaign has without opening it.

### 9. `GET /admin/payments` returns raw records

- Items carry `_id`, where every other endpoint (including `GET /payments/mine`) uses `id`.
- There is only `userId`, so the table cannot show who paid. Requested: a
  `user: { id, email, name }` block (and the campaign title for campaign payments).

### 10. `GET /settings/game` has no `campaign.minCardsToPublish`

`customQuiz.minCardsToPublish` is there; the campaign equivalent is only on the brand-only
`GET /brand/campaigns/pricing` and on a single campaign. Requested: add it to the public
settings so every screen reads limits from one place.

### 11. Reusing an image the user did not upload through `/uploads/images`

A `logoUrl` / `coverImageUrl` / `imageUrl` in a JSON body is accepted only if that same user
uploaded it through `POST /uploads/images`. Two cases fall outside that:

- The brand logo saved through `PUT /profile/brand` (file field `avatar`) is not recorded as an
  uploaded image, so it cannot be sent as a campaign's `logoUrl`.
- An admin editing a topic card whose image another admin uploaded cannot resend that card's
  existing `imageUrl`.

Requested: record profile logos as owned uploads, and let an admin reuse any image already
attached to the topic being edited.

**Meanwhile:** the frontend never sends back an image URL it did not just upload, and relies on
the API keeping the stored one.

## Contract document corrections

These are differences between `docs/frontend-integration.md` and what the API actually does.
No code change is needed if the document is updated.

| Where | Document says | API does |
| --- | --- | --- |
| `GET /custom-quizzes` | `plan` implied to be a tier string | `plan` is `{ tier, isPro, proUntil }` |
| `GET /custom-quizzes/:id`, `/preview` | quiz + cards | also `minCardsToPublish`, `cardCountBounds` |
| `GET /brand/campaigns/:id` | campaign + cards + pricing | also `minCardsToPublish`, `cardCountBounds` |
| `POST /brand/campaigns` | `brandName?`, `websiteUrl?`, logo optional | all three are required unless the brand profile supplies them; `websiteUrl` must also have a dot in its host (so `http://localhost` is rejected) |
| `PATCH /brand/campaigns/:id` | any create field | `brandName` and `websiteUrl` cannot be cleared |
| Quiz and campaign fields | no limits given | `title` 80, `description` 300, topic `name` 60, each tag 24, moderation `reason` 500 characters |
| Stats and dashboards | numbers | `averageScore` and `averageScorePercent` are `null` until there is a completed play |
| `GET /admin/config` | `{ config: { key: value } }` | matches; note `customQuiz.freeLimit` must be at least 1 and prices must be above 0 |
| `GET /admin/revenue?from=&to=` | a range | `to` is exclusive: `to=2026-10-07` leaves out the 7th |
| `GET /admin/campaigns`, `/admin/payments` | list only | also `page`, `limit`, `total` |
| `POST /brand/campaigns/:id/checkout` | `idempotencyKey?` | an open checkout from the last 30 minutes is reused only when **no** key is sent |
| `GET /match/levels` | levels | already in play order; items have no `order` field |
| Section 3, Google sign-in | `{ idToken }` | also accepts `{ email, googleId, name, avatar, givenName, familyName }`, which is what the frontend sends |

## Housekeeping (no frontend impact)

- The forum routes (`/forum/*`) are still mounted. The frontend no longer has a forum.
- The legacy auth routes `/registration`, `/activate-user`, `/login` and `/logout` (without the
  `/auth` prefix) are still mounted alongside the `/auth/*` ones the frontend uses.
