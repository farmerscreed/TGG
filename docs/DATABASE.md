# Database Reference

Supabase Postgres schema for the TGG Campus Eco-Challenge (project
`dffdiqddmqvrclocliin`). All tables live in `public` and have **Row Level
Security enabled**.

---

## Tables

### `user_roles`
One row per user assigning their role. **Keyed by the auth user id.**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `role` | text | `participant` \| `coordinator` \| `judge` \| `admin` |
| `university` | text | `RSU` \| `IAUE` \| `UNIPORT` (null for judge/admin) |
| `is_active` | bool | |
| `created_at` | timestamptz | |

### `profiles`
Extended profile per user. **Keyed by `user_id`** (its `id` is a separate PK).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | own id — **not** the auth id |
| `user_id` | uuid | → `auth.users.id` (the real link) |
| `first_name`, `last_name`, `phone`, `gender` | text | |
| `university`, `department`, `year_of_study` | text | |
| `participation_type` | text | individual / team |
| `profile_photo_url` | text | |
| `created_at`, `updated_at` | timestamptz | `updated_at` via trigger |

### `submissions`
One entry per participant.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `reference_code` | text | auto-set by `set_reference_code` trigger |
| `user_id` | uuid | → `auth.users.id`; also FK → `profiles.user_id` |
| `team_id` | uuid | → `teams.id` |
| `title`, `category`, `custom_category` | text | |
| `problem_statement`, `proposed_solution`, `innovation_approach`, `expected_impact` | text | |
| `video_link` | text | |
| `status` | text | default `draft` |
| `winner_position` | | |
| `is_locked` | bool | default false |
| `current_step` | int | default 1 |
| `created_at`, `updated_at` | timestamptz | |

### `submission_files`
One row per uploaded file. **`file_url` stores the storage path**, not a public
URL — the bucket is private, so links are signed on read.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `submission_id` | uuid | → `submissions.id` |
| `file_url` | text | storage path `userId/submissionId/timestamp_name` |
| `file_type` | text | `document` \| `image` |
| `file_name` | text | |
| `file_size_bytes` | bigint | |
| `uploaded_at` | timestamptz | |

### `teams` / `team_members`
`teams`: `id`, `name`, **`lead_user_id`** (→ auth.users), `university`.
`team_members`: `id`, `team_id`, `user_id`, `invited_email`, `status`
(`invited`/`accepted`), `invite_token` (**auto-generated** default), `joined_at`.

### `judging_criteria`
Weighted criteria. Columns: `id`, `name`, `description`, **`max_points`**,
`weight`, **`display_order`**, `is_active`. (5 active criteria.)

### `judge_scores`
**Normalized — one row per (judge, submission, criterion).**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `judge_id` | uuid | → auth.users |
| `submission_id` | uuid | → submissions |
| `criterion_id` | uuid | → judging_criteria |
| `score` | numeric | |
| `comments` | text | |
| `created_at`, `updated_at` | timestamptz | |

Unique constraint `(judge_id, submission_id, criterion_id)` — used for upserts.
A judge's total is derived (there is no `total_score` column): see
`lib/scoring.ts` → `Σ (score / max_points) * weight`.

### `judge_assignments`
`id`, `judge_id`, `submission_id` — which judge reviews which submission.

### `challenge_settings`
Single-row config: `registration_open/close`, `submission_open`,
`submission_deadline`, `judging_start/end`, `results_date`, `judging_locked`.

### `challenge_categories`
`id`, `name`, `description`, `is_custom` (def false), `display_order` (def 0),
`is_active` (def true).

### `notifications`
`id`, `user_id`, `title`, `message`, `is_read` (def false), `created_at`.

### `submission_notes`
`id`, `submission_id`, `author_id`, `note`, `created_at`.

---

## Relationships & gotchas

- **`profiles` links via `user_id`, not `id`.** Query/upsert profiles by
  `user_id` (`onConflict: 'user_id'`). `.eq('id', authId)` is a bug.
- **`user_roles.id` *is* the auth id** — query it with `.eq('id', authId)`.
- **No direct FK between `user_roles` and `profiles`** (both reference
  `auth.users`). You cannot PostgREST-embed one into the other — fetch both and
  merge by id in code.
- **Embedding `profiles` from `submissions`:** use FK
  **`submissions_profile_user_fkey`** (`submissions.user_id → profiles.user_id`),
  add `!inner` when filtering on profile columns. The similarly-named
  `submissions_user_id_fkey` points at `auth.users` and won't embed profiles.

---

## Storage

| Bucket | Public | Limit | Notes |
|---|---|---|---|
| `submission-files` | **private** | 10 MB | PDF/Word/PPT + JPG/PNG. Serve via **signed URLs**. Path: `userId/submissionId/timestamp_name`. RLS: owner + admin/judge/coordinator can read; owner can write/delete their folder. |
| `profile-photos` | public | 5 MB | JPG/PNG/WebP |

---

## Triggers & functions

- `handle_new_user` (on `auth.users` insert) — creates the `user_roles` and
  `profiles` rows from signup metadata.
- `set_reference_code` (on `submissions`) — generates `reference_code`.
- `update_*_updated_at` — maintain `updated_at` on profiles, submissions,
  judge_scores, challenge_settings.
- RPCs: `get_admin_participants()`, `get_participant_detail(p_user_id)` — join
  `user_roles` + `profiles` (+ submission/team) for admin views.

---

## Migrations applied in this repo's history (server-side)

| Migration | Purpose |
|---|---|
| `backfill_submission_files_from_storage` | Recovered 206 storage objects into `submission_files` |
| `add_description_to_challenge_categories` | Added nullable `description` column |

See [`AUDIT-2026-07.md`](AUDIT-2026-07.md) for the findings behind these.
