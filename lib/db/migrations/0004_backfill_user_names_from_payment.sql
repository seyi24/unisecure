-- Backfill User.name from the most recent successful payment (only when name is empty).
UPDATE "User" u
SET
  "name" = TRIM(CONCAT(latest."customerFirstName", ' ', latest."customerLastName")),
  "updatedAt" = NOW()
FROM (
  SELECT DISTINCT ON (p."userId")
    p."userId",
    p."customerFirstName",
    p."customerLastName"
  FROM "Payment" p
  WHERE p.status = 'success'
    AND p."customerFirstName" IS NOT NULL
    AND TRIM(p."customerFirstName") <> ''
  ORDER BY p."userId", p."createdAt" DESC
) AS latest
WHERE u.id = latest."userId"
  AND (u.name IS NULL OR TRIM(u.name) = '');
