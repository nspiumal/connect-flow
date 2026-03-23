-- Add active-default support for interest rates
-- Rule: exactly one default among active rates

ALTER TABLE interest_rates
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- If there is no active default yet, promote one active rate (oldest by created_at)
UPDATE interest_rates r
SET is_default = TRUE
WHERE r.id = (
    SELECT x.id
    FROM (
        SELECT id
        FROM interest_rates
        WHERE is_active = TRUE
        ORDER BY created_at ASC
        LIMIT 1
    ) x
)
AND NOT EXISTS (
    SELECT 1
    FROM interest_rates d
    WHERE d.is_active = TRUE AND d.is_default = TRUE
);

-- If multiple active defaults exist, keep oldest active default and clear others
UPDATE interest_rates
SET is_default = FALSE
WHERE is_active = TRUE
  AND is_default = TRUE
  AND id NOT IN (
      SELECT y.id
      FROM (
          SELECT id
          FROM interest_rates
          WHERE is_active = TRUE AND is_default = TRUE
          ORDER BY created_at ASC
          LIMIT 1
      ) y
  );

-- Inactive rates cannot remain default
UPDATE interest_rates
SET is_default = FALSE
WHERE is_active = FALSE;

