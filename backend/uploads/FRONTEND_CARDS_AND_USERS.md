# Frontend API: Card & User Lifecycle

Short reference for endpoints introduced in the `task-m-11-freeze-cards` branch.
All endpoints are under `{{base_url}}/api/v2`. Auth via `Authorization: Bearer <token>`.

Two token kinds appear below:
- `user_token` — logged-in user (buyer / teamlead / admin).
- `system_token` — superadmin.

Common response shape:
```json
{ "data": { ... }, "responseTime": 123 }
```
On error:
```json
{ "error": { "code": <number>, "message": "<string>", "details": "<string>", "httpStatus": <number> } }
```

---

## Cards

### POST `/cards/freeze`
Freeze a card at the provider. Reversible.

- Auth: `user_token` (buyer self / admin / teamlead).
- Body: `{ "card_uid": "<uid>" }`
- Pre: card must be `active`. Returns error otherwise.
- Effect: provider freeze + local `status='frozen'`, `frozen_reason='manual'`.

### POST `/cards/unfreeze`
Unfreeze a card.

- Auth: `user_token`.
- Body: `{ "card_uid": "<uid>" }`
- Pre: card must be `frozen`.
- Effect: provider unfreeze + local `status='active'`, freeze metadata cleared.

### POST `/cards/block`
Terminal block. Async pipeline: unfreeze (if needed) → withdraw `balance - $5` to buyer/company → block at provider. Leaves a `$5` residual on the card (cardspro minimum).

- Auth: `user_token`. `buyer` can only block own card and only to `buyer` destination. `admin` / `teamlead` may pick destination.
- Body:
  ```json
  { "card_uid": "<uid>", "type": "buyer" | "company" }
  ```
- Response: `{ "operation_uid": "<uid>" }` — store and poll `/cards/block/status`.
- Irreversible once completed (provider block + money withdrawn).

### POST `/cards/block/status`
Poll a card-block operation.

- Auth: `user_token`.
- Body: `{ "operation_uid": "<uid>" }`
- Response:
  ```json
  {
    "id": 12,
    "operation_uid": "...",
    "card_uid": "...",
    "type": "buyer" | "company",
    "status": "pending" | "completed" | "failed",
    "stage": "unfreeze" | "withdraw" | "block" | null,
    "withdrawal_id": 45,
    "error_message": "<string|null>",
    "created_at": "...",
    "updated_at": "..."
  }
  ```
- Terminal when `status in (completed, failed)`. Poll every ~5–10s while `pending`.

---

## Users

### POST `/users/block`
Block a user in the caller's company. Cascades to all the user's cards in that company.

- Auth: `user_token`. `admin` may block buyers / teamleads. `teamlead` may block only buyers. Never self. Never admins.
- Body:
  ```json
  { "user_uid": "<target_uid>", "mode": "freeze" | "block" }
  ```
- Modes:
  - `freeze` — each `active` card is frozen at the provider. Reversible via `/users/unblock`.
  - `block` — each card goes through the full block pipeline with `destination='company'`. Card balances move to the company TRX account. Irreversible at the provider.
- Up-front side effects (synchronous):
  1. `user_company.status = 'disabled'` — login closed.
  2. All active sessions of the user are invalidated.
- Returns `{ "operation_uid": "<uid>" }` — poll `/users/block/status` for per-card progress.
- On failed finalize the upfront disable is rolled back (`user_company.status` → `active`) so the user is not stranded.

### POST `/users/block/status`
Poll a user-block operation. Includes per-card progress.

- Auth: `user_token`.
- Body: `{ "operation_uid": "<uid>" }`
- Response:
  ```json
  {
    "id": 4,
    "operation_uid": "...",
    "user_uid": "...",
    "company_uid": "...",
    "initiator_user_uid": "...",
    "mode": "freeze" | "block",
    "status": "pending" | "completed" | "failed",
    "error_message": "<string|null>",
    "created_at": "...",
    "updated_at": "...",
    "cards": [
      {
        "id": 7,
        "card_uid": "...",
        "card_block_operation_id": 12,   // only for mode=block
        "status": "pending" | "completed" | "failed" | "skipped",
        "error_message": "<string|null>"
      }
    ]
  }
  ```
- `skipped` means the card was already in a terminal state (`blocked`/`closed`/`declined`/`error`) or still `created` (issuance pending) — no action taken.
- `card_block_operation_id` references `/cards/block/status` for that individual card.

### POST `/users/unblock`
Restore login. Optionally unfreeze the user's cards.

- Auth: `user_token`. Same role rules as `/users/block`.
- Body:
  ```json
  {
    "user_uid": "<target_uid>",
    "unfreeze_cards": "true" | "false"   // string, optional, default false
  }
  ```
- Effect:
  - `user_company.status = 'active'` (login open again).
  - If `unfreeze_cards="true"`: every `frozen` card is unfrozen at the provider.
  - Cards that were `blocked` via `mode='block'` cannot be restored — that is provider-terminal.
- Response:
  ```json
  { "status": true, "unfrozen_card_uids": ["..."], "failed_card_uids": ["..."] }
  ```

---

## Auth: blocked user attempting to log in

`POST /users/login` for a user whose `user_company.status='disabled'` returns:

```json
{
  "error": {
    "code": 2802,
    "message": "Account is blocked. Contact your admin.",
    "httpStatus": 403
  }
}
```

Show this message verbatim on the login screen when `error.code === 2802`.

---

## Card model — new fields visible in `/cards/get`

- `balance_threshold` (int, cents) — minimum balance to maintain on the card. Cron auto-tops up from buyer when balance drops below.
- `limit_daily` / `limit_monthly` (int, cents) — spending limits. `0` disables the check. Cron auto-freezes when exceeded and auto-unfreezes when the period rolls over.
- `frozen_reason` (`"manual" | "daily_limit" | "monthly_limit" | null`) — why the card is currently frozen. Use to show context badges (e.g. "Auto-frozen: daily limit reached"). `null` when not frozen.
- `frozen_at` (timestamp | null) — when the current freeze happened.

For blocked cards `/cards/get` may return empty `pan`, `cvv`, `expiryMonth`, `expiryYear`, `mask` — cardspro stops returning those for terminal cards. The endpoint no longer 500s.

---

## Topup validation

`POST /cards/topup` now rejects amounts below `$20` upfront (cardspro minimum recharge — was previously failing silently after ~1.5 min of polling):

```json
{
  "error": {
    "code": 1,
    "message": "Wrong incoming params",
    "details": "Minimum topup amount is $20 (got $12)."
  }
}
```

---

## Superadmin endpoints

Same flows under `system_token`, no company restriction.

- `POST /system/cards/get` — full TCard for any card, includes `providerData.raw` (raw cardspro response).
- `POST /system/cards/issue-status` — query cardspro issuance status of a card. Body accepts one of `{ card_uid }`, `{ docid }`, or `{ request_id }`. Useful when card creation is stuck.
- `POST /system/users/block` — same payload as `/users/block`.
- `POST /system/users/block/status` — same as `/users/block/status`.
- `POST /system/users/unblock` — same as `/users/unblock`.

---

## Polling tips for Postman

Both `*/block/status` endpoints are also wired in Postman with `event.test` scripts that save `operation_uid` to collection variables (`card_block_operation_uid`, `user_block_operation_uid`). After hitting `/cards/block` or `/users/block`, open the matching `*/status` request — the body already has `{{...}}` substituted. Just press Send repeatedly until `status` becomes `completed` or `failed`.

---

## Quick reference

| Endpoint | Sync/Async | Idempotent | Reversible |
|---|---|---|---|
| `/cards/freeze` | sync | no (state-checked) | yes via `/cards/unfreeze` |
| `/cards/unfreeze` | sync | no (state-checked) | n/a |
| `/cards/block` | async (poll) | yes (per card_uid) | no |
| `/users/block` | async (poll) | yes (per user_uid) | partial via `/users/unblock` |
| `/users/unblock` | sync | yes | n/a |
