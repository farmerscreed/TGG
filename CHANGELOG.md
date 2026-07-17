# Changelog

Notable changes to the TGG Campus Eco-Challenge platform.

## 2026-07-09 — Pipeline audit & fixes

Full audit of the participant → judging → admin/coordinator/team flows, cross-
referencing every database call against the live schema. See
[`docs/AUDIT-2026-07.md`](docs/AUDIT-2026-07.md) for the complete findings.

### Fixed — submission file uploads
- Files were uploaded to storage but **never recorded** in `submission_files`,
  so they vanished on reload and were invisible to judges/admins. Uploads now
  insert a DB row (with rollback on failure) and delete row + object on remove.
- Judge and admin pages now serve files via **signed URLs** (the bucket is
  private).
- **Backfill:** recovered 206 orphaned storage objects into `submission_files`
  (35 submissions, 106 images + 100 documents).

### Fixed — judging & leaderboard
- Code read/wrote a non-existent `judging_scores` table (real table:
  `judge_scores`) and used `max_score`/`order_index` (actual:
  `max_points`/`display_order`) — no score could save or display.
- Reworked to the normalized `judge_scores` table (one row per criterion, upsert
  on the unique key) with a shared `lib/scoring.ts` weighted-total helper used by
  the judge UI, admin submission detail, and leaderboard.

### Fixed — admin / coordinator / team flows
- **Coordinator participants** and **admin judges**: replaced invalid
  `profiles!user_roles_id_fkey` embeds with a two-query merge by id.
- **Coordinator submissions** and **coordinator dashboard count**: embed
  profiles via `submissions_profile_user_fkey!inner` filtered by university.
- **Team join**: select `teams.lead_user_id` (was the non-existent
  `team_lead_id`).
- **Email notifications**: look up `profiles` by `user_id` (was `id`) so emails
  use the real recipient name.
- **Create judge / coordinator**: upsert `profiles` on `user_id` (was writing the
  auth id into the profiles primary key and leaving `user_id` null).
- `.single()` → `.maybeSingle()` on optional submission/team/membership lookups.

### Database migrations
- `backfill_submission_files_from_storage`
- `add_description_to_challenge_categories` (admin "Add category" collected a
  description for a column that did not exist)

### Documentation
- Rewrote `README.md`; added `.env.example`, `docs/CONFIGURATION.md`,
  `docs/DATABASE.md`, `docs/AUDIT-2026-07.md`, and this changelog.
