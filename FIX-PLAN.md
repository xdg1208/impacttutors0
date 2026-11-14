# Impact Tutors — Audit Fix Plan

Working document for fixing **all 41+ findings** from the deep code audit (Sep 2026).
Steps are executed strictly in order, one after the other. Audit item numbers (`#n`)
refer to the audit report. Status is updated as work completes.

Legend: ☐ todo · ◐ in progress · ✔ done

---

## User actions required (cannot be fixed from code)

Do these in parallel with the phases — they concern **external services**:

- [ ] **Rotate the Gmail app password** exposed in `backend/test_smtp.py` (Google Account → Security → App passwords).
- [ ] **Rotate the Telegram bot token** (BotFather → /revoke). The real token lived in `backend/.env.example` (local-only, never committed — no history purge needed for it).
- [ ] **Generate a new `SECRET_KEY`** and set it in the hosting env for backend + all deployments.
- [ ] **Purge git history** of `backend/db.sqlite3` and `backend/test_smtp.py` (both committed):
      `git filter-repo --path backend/db.sqlite3 --path backend/test_smtp.py --invert-paths`
      then force-push and re-clone. Until then, treat all data in the old sqlite file as public.
- [ ] **Consider rotating the Supabase DB password** — the DB identifier leaked in error output; credentials themselves were never committed.
- [ ] Because `db.sqlite3` (with user emails + password hashes + children's PII) was public in the repo: **force a password reset for all users** once history is purged.

---

## Phase 1 — Secrets & repo hygiene ✔ DONE (audit #1, #36, #37-partial, #42-new)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P1.1 | ✔ Remove committed Gmail credentials: delete `test_smtp.py` | #1 | `backend/test_smtp.py` |
| P1.2 | ✔ Delete stray one-off codemod scripts from the frontend | #36 | `frontend/dedupe.py`, `frontend/fix_api.py` |
| P1.3 | ✔ Untrack the production database; keep local copy | #1 | `backend/db.sqlite3` |
| P1.4 | ✔ Fix `.gitignore`: track `.env.example`, ignore real env files, ignore `*.sqlite3`, staticfiles | #42 | `.gitignore` |
| P1.5 | ✔ Rewrite `backend/.env.example` — placeholders only, `DEBUG=False`, no real tokens; make it tracked | #1, #6 | `backend/.env.example` |
| P1.6 | ✔ Fix `frontend/.env.example` (local-first default) and make it tracked | #42 | `frontend/.env.example` |
| P1.7 | ✔ Harden `SECRET_KEY`: production without it refuses to boot; dev-only fallback under `DEBUG=True` | #1 | `core/settings.py` |
| P1.8 | ✔ Rename package `temp_app` → `impact-tutors-frontend` | #37 | `frontend/package.json` |
| P1.9 | ✔ Pin `requirements.txt` to exact installed versions | #37 | `backend/requirements.txt` |

---

## Phase 2 — Backend access control & auth hardening ✔ DONE (audit #2, #4, #5, #6, #7, #9, #11, #12, #18, #23, #25)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P2.1 | `SessionViewSet`: `get_permissions` — writes (create/update/destroy/bulk-delete) admin-only; attendance actions keep per-role ownership checks | #2 | `api/views.py` |
| P2.2 | `bulk_delete` filters via `self.get_queryset()` in both Session & Course viewsets | #2 | `api/views.py` |
| P2.3 | `SessionSerializer`: explicit writable fields; `status` + attendance flags read-only | #2, #18 | `api/serializers.py` |
| P2.4 | `ProfileSerializer`: `role` & `is_onboarded` read-only; `toggle_onboarding` action becomes admin-only | #7 | `api/serializers.py`, `api/views.py` |
| P2.5 | Profile DELETE no longer bricks accounts: deleting a profile deletes its User (self-service account deletion / admin user removal) | #25 | `api/views.py` |
| P2.6 | Split `GlobalSettingSerializer`: public read excludes `telegram_chat_id` | #9 | `api/serializers.py`, `api/views.py` |
| P2.7 | Run `validate_password()` on register / change / reset paths | #5 | `api/views.py` |
| P2.8 | Registration via a proper `RegisterSerializer` (email format, lengths, role choices); map username IntegrityError → 400 | #5, #12 | `api/serializers.py`, `api/views.py` |
| P2.9 | Invite-code redemption under `select_for_update` (kills the double-use race); same for code generation | #12 | `api/views.py`, `api/models.py` |
| P2.10 | OTP + invite codes generated with `secrets` (not `random`) | #4 | `api/views.py`, `api/models.py` |
| P2.11 | `PasswordResetThrottle`: identity from `REMOTE_ADDR` only — drop client-controlled `X-Forwarded-For` trust | #4 | `api/throttles.py` |
| P2.12 | OTP hardening: per-OTP failed-attempt counter (max 5 → invalidated), DB index, old-OTP cleanup job | #4, #24 | `api/models.py`, migration, `api/views.py` |
| P2.13 | OTP email sent in background thread → uniform response timing (removes enumeration side channel) | #23 | `api/views.py` |
| P2.14 | Password change/reset blacklists all of the user's refresh tokens; add `token_blacklist` app; `ROTATE_REFRESH_TOKENS=True` (fixes inert `BLACKLIST_AFTER_ROTATION`) | #4, #10 | `core/settings.py`, `api/views.py`, migration |
| P2.15 | Production settings: `ALLOWED_HOSTS` from env, `SECURE_SSL_REDIRECT`/HSTS/cookie flags when `DEBUG=False` | #6 | `core/settings.py` |
| P2.16 | `seed_db.py`: fix broken `student=` kwarg (`students` M2M), passwords from env (random fallback, printed), refuses to run unless `DEBUG=True` | #11 | `backend/seed_db.py` |
| P2.17 | Application/Contact/Invite serializers: explicit fields; `status`, timestamps read-only to submitters | #18 | `api/serializers.py` |
| P2.18 | Add throttles to registration + contact/applications (spam guard) | #4-adj | `api/views.py`, `core/settings.py` |

---

## Phase 3 — Frontend critical breakage ✔ DONE (audit #3, #29, #30)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P3.1 | `await params` in the course detail page (Next 16 Promise params) | #3 | `app/courses/[slug]/page.tsx` |
| P3.2 | Create single source of truth `src/lib/courses.ts` catalog: canonical slugs + full detail data + alias map (`nigerian-languages`, `coding-for-kids`, `k12-math`, `music-languages`, `foreign-curriculum`, `languages`, `coding-tech` → canonical) so no indexed URL breaks | #3 | `src/lib/courses.ts` |
| P3.3 | Rewire courses page, home links, footer, detail page, sitemap to the catalog | #3 | 5 files |
| P3.4 | Fix signup flow: honor auto-login `redirectPath`, remove the false "Check your email to confirm your account" message | #29 | `app/(auth)/signup/page.tsx`, `actions/auth.ts` |
| P3.5 | Shared `slugify()` util; use for course creation + activate&enroll (valid slugs, single dashes) | #30 | `src/lib/slugify.ts`, `actions/admin.ts` |

---

## Phase 4 — Token lifetime & session reliability ✔ DONE (audit #8, #10, #41, #4-copy)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P4.1 | Implement JWT refresh flow in `proxy.ts`: decode access-token `exp`; when expired + refresh cookie present → call `/api/token/refresh/`, set rotated cookies, continue; on failure clear cookies → login redirect (also covers 401 flash from #41) | #10, #41 | `src/proxy.ts` |
| P4.2 | Same retry/refresh logic inside the `/api/[...path]` route for client-side fetches | #10 | `app/api/[...path]/route.ts` |
| P4.3 | Cookie lifetimes aligned with backend (`REFRESH_TOKEN_LIFETIME` → 7 days w/ rotation; cookies updated) | #10 | `core/settings.py`, `actions/auth.ts` |
| P4.4 | Stop passing the access token as a client prop — admin dashboard fetches via the `/api` proxy | #8 | `dashboard/admin/page.tsx`, `AdminDashboardContent.tsx` |
| P4.5 | Update post-password-change/reset UX copy (refresh tokens now revoked; access expires ≤60 min) | #4 | `ChangePasswordForm.tsx` |

---

## Phase 5 — Backend performance & correctness ✔ DONE (audit #13–#17, #19–#22, #24)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P5.1 | `UniqueConstraint(course, student, start_time)` on Session (migration) | #15 | `api/models.py`, migration |
| P5.2 | Rewrite `sync_course_sessions`: collect candidates → single `__in` existence check → `bulk_create`; fix lying docstring ("course-wide" → per-student) | #13, #14 | `api/views.py` |
| P5.3 | Remove duplicate sync triggers — keep signals only; drop explicit calls from `CourseSerializer` + `CourseScheduleViewSet` | #13 | `api/serializers.py`, `api/views.py` |
| P5.4 | `get_student_names` iterates the prefetch cache (no `values_list`) | #17 | `api/serializers.py` |
| P5.5 | Paginate `SessionViewSet` (page size 500 — bounds the one endpoint that explodes without breaking the admin UI); document tradeoff | #16 | `api/views.py`, `core/settings.py` |
| P5.6 | SendPulse: token cache TTL + retry-once-on-401 (fixes silent OTP email death) | #19 | `api/sendpulse.py` |
| P5.7 | Notification recipient from `NOTIFICATION_EMAIL` (fallback `EMAIL_HOST_USER`, graceful skip) | #20 | `core/settings.py`, `api/views.py` |
| P5.8 | `sync_telegram`: safe update parsing (no `KeyError` 500), no raw exception text to clients | #21 | `api/views.py` |
| P5.9 | Attendance: null-student guard (400), tutor-marks-absent → `NO_SHOW` (finally uses the enum), tutor window stays open (documented) | #22 | `api/views.py` |
| P5.10 | `GlobalSetting` singleton via `get_or_create` everywhere | #24 | `api/views.py`, `telegram_utils.py` |

---

## Phase 6 — Frontend correctness & UX ✔ DONE (audit #26–#28, #31–#34)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P6.1 | Replace phantom fields with real API fields (`course_name`, `duration_minutes`, `category`, `student_names`) in student/tutor/admin dashboards | #26 | `student/page.tsx`, `tutor/page.tsx`, admin components |
| P6.2 | Course create/update send `category` (subject edits actually save) | #27 | `actions/admin.ts` |
| P6.3 | Real error handling in course/session modals + deletes (no silent failures, no unhandled rejections) | #28 | `CourseDataManager.tsx`, `SessionDataManager`*, attendance buttons |
| P6.4 | Rewrite `/api/[...path]`: all methods (GET/POST/PUT/PATCH/DELETE), safe 204 handling (no false 500), omit auth header when no cookie | #31 | `app/api/[...path]/route.ts` |
| P6.5 | `getBaseUrl` via `new URL()` parsing (fixes `api.*` subdomain false positive) | #32 | `lib/api.ts` |
| P6.6 | Onboarding polling capped (stops after ~5 min, shows "contact support") | #33 | `dashboard/onboarding/page.tsx` |
| P6.7 | Admin dashboard surfaces fetch errors instead of `.catch(() => [])` swallowing; per-section retry | #34 | `AdminDashboardContent.tsx` |

---

## Phase 7 — Dead code, docs, tests, polish ✔ DONE (audit #35, #37, #38, #39, #40)

| # | Step | Audit | Files |
|---|------|-------|-------|
| P7.1 | Delete unused components: `SessionDataManager.tsx`, `CreateSessionForm.tsx` (+ their now-dead server actions stay until P7.3 decides) | #35 | components |
| P7.2 | `JsonLd`: escape `<`/U+2028/U+2029 in serialized JSON (fix latent XSS) and actually use it — Organization schema on home page | #35 | `components/seo/JsonLd.tsx`, `app/page.tsx` |
| P7.3 | ~~Remove dead features~~ → **BUILD UI for kept API features**: admin "Assignments" tab (StudentTutorAssignment manager), course `is_published`/`seo_*` fields in admin forms + public published-courses endpoint + public "Live Programs" section, profile `school_level`/`country`/`tutor_bio` in signup + dashboards/admin | #35 (revised) | backend + frontend |
| P7.4 | README truth pass: real deployment steps, create working `render.yaml`, remove duplicated line, remove "sqlite in repo" instructions | #37 | `README.md`, `render.yaml` |
| P7.5 | Code-quality sweep: unused imports, `console.log`s, pointless destructure, `setGeneratedCode` ordering, fake search/bell UI, "Get Dashboard" label, `user={id}` pattern, hardcoded WhatsApp default link, "Experience: Expert" stat, `DashboardNav` default export, `Session.__str__` guard, phone max_length 20→50 (migration) | #39 | many |
| P7.6 | Role settings pages get a real profile card (view/edit full name + phone via `/profiles/me/`) | #40 | settings pages, new component |
| P7.7 | Backend test suite: auth flow, invite-code redemption + races, OTP expiry/attempts/throttle, attendance windows & permissions, registration validation, role-escalation prevention | #38 | `api/tests.py` |
| P7.8 | Frontend unit tests for pure utils (slugify, getBaseUrl, error mapping) — pending user decision | #38 | vitest setup |
| P7.9 | Full verification pass: `tsc`, `next build`, `manage.py check` + tests, live `next start` + `runserver` curl smoke tests of auth/attendance/admin-guard routes | all | — |

\* `SessionDataManager` is removed in P7.1 — P6.3 fixes apply to surviving code only.

---

## Decisions logged (user-confirmed)

1. **Git workflow**: NO commits — all changes stay uncommitted in the working tree for user review.
2. **Dead features (P7.3, revised)**: nothing is deleted from the API. Instead, missing UI gets built:
   - `StudentTutorAssignment` → new admin "Assignments" tab + manager UI on the existing `/assignments/` API.
   - `Course.is_published / seo_title / seo_description` → fields in admin course forms + public read-only `published` endpoint + "Live Programs" section on the public courses page.
   - `Profile.school_level / country / tutor_bio` → signup form fields + display in dashboards and admin profile modals.
3. **Tests (P7.7-7.8)**: Django backend suite + vitest for frontend utils.
4. **Slugs**: canonical set = `k12-adult`, `nigerian-languages`, `coding-for-kids`, `music`, `exam-prep`; all old slugs resolve via alias map (SEO-safe).
2. **Sessions stay per-student** (attendance is per-student) — the "course-wide" comments were the bug, not the code.
3. **Password change keeps the current access token** (≤60 min residual, documented in UI); refresh tokens are revoked immediately.
4. **Registration email-exists message stays** (standard UX tradeoff); the OTP timing side channel is removed via async send.
5. **Tutors may confirm attendance any time** (business need); students keep the 6-hour window.
6. **Session list pagination at 500/page** — bounds the exploding endpoint without truncating the admin UI at business scale.
