-- Consolidate duplicate user rows per email into a canonical row so
-- authentication and subscription lookup always point to the same account.
WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    u.password,
    u.name,
    u.image,
    u."emailVerified",
    u.plan,
    u."planExpiresAt",
    u."createdAt",
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked_users
  WHERE id <> keeper_id
),
merged_keeper_values AS (
  SELECT
    keeper_id,
    MAX(
      CASE plan
        WHEN 'elite' THEN 4
        WHEN 'pro' THEN 3
        WHEN 'starter' THEN 2
        ELSE 1
      END
    ) AS max_plan_rank,
    MAX("planExpiresAt") AS max_plan_expires_at,
    BOOL_OR("emailVerified") AS any_email_verified,
    MAX(NULLIF(TRIM(name), '')) AS fallback_name,
    MAX(NULLIF(TRIM(image), '')) AS fallback_image
  FROM ranked_users
  GROUP BY keeper_id
)
UPDATE "Chat" c
SET "userId" = m.keeper_id
FROM duplicate_map m
WHERE c."userId" = m.duplicate_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked_users
  WHERE id <> keeper_id
)
UPDATE "Document" d
SET "userId" = m.keeper_id
FROM duplicate_map m
WHERE d."userId" = m.duplicate_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked_users
  WHERE id <> keeper_id
)
UPDATE "Suggestion" s
SET "userId" = m.keeper_id
FROM duplicate_map m
WHERE s."userId" = m.duplicate_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked_users
  WHERE id <> keeper_id
)
UPDATE "Payment" p
SET "userId" = m.keeper_id
FROM duplicate_map m
WHERE p."userId" = m.duplicate_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id, keeper_id
  FROM ranked_users
  WHERE id <> keeper_id
)
UPDATE "PasswordResetToken" prt
SET "userId" = m.keeper_id
FROM duplicate_map m
WHERE prt."userId" = m.duplicate_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    u.password,
    u.name,
    u.image,
    u."emailVerified",
    u.plan,
    u."planExpiresAt",
    u."createdAt",
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
merged_keeper_values AS (
  SELECT
    keeper_id,
    MAX(
      CASE plan
        WHEN 'elite' THEN 4
        WHEN 'pro' THEN 3
        WHEN 'starter' THEN 2
        ELSE 1
      END
    ) AS max_plan_rank,
    MAX("planExpiresAt") AS max_plan_expires_at,
    BOOL_OR("emailVerified") AS any_email_verified,
    MAX(NULLIF(TRIM(name), '')) AS fallback_name,
    MAX(NULLIF(TRIM(image), '')) AS fallback_image
  FROM ranked_users
  GROUP BY keeper_id
)
UPDATE "User" u
SET
  "plan" = CASE v.max_plan_rank
    WHEN 4 THEN 'elite'
    WHEN 3 THEN 'pro'
    WHEN 2 THEN 'starter'
    ELSE 'free'
  END,
  "planExpiresAt" = COALESCE(v.max_plan_expires_at, u."planExpiresAt"),
  "emailVerified" = (u."emailVerified" OR v.any_email_verified),
  "name" = COALESCE(NULLIF(TRIM(u.name), ''), v.fallback_name),
  "image" = COALESCE(NULLIF(TRIM(u.image), ''), v.fallback_image),
  "updatedAt" = NOW()
FROM merged_keeper_values v
WHERE u.id = v.keeper_id;

WITH ranked_users AS (
  SELECT
    u.id,
    u.email,
    FIRST_VALUE(u.id) OVER (
      PARTITION BY u.email
      ORDER BY
        CASE WHEN u.password IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE u.plan
          WHEN 'elite' THEN 4
          WHEN 'pro' THEN 3
          WHEN 'starter' THEN 2
          ELSE 1
        END DESC,
        u."planExpiresAt" DESC NULLS LAST,
        u."createdAt" ASC
    ) AS keeper_id
  FROM "User" u
),
duplicate_map AS (
  SELECT id AS duplicate_id
  FROM ranked_users
  WHERE id <> keeper_id
)
DELETE FROM "User" u
USING duplicate_map m
WHERE u.id = m.duplicate_id;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_unique" ON "User" ("email");
