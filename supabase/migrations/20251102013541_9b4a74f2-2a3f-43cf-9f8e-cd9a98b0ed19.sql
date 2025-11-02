
-- Drop the existing constraint if it exists
ALTER TABLE survey_responses 
DROP CONSTRAINT IF EXISTS survey_responses_mobile_number_unique;

-- Remove duplicate survey responses, keeping only the most recent one for each mobile number
DELETE FROM survey_responses
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY mobile_number ORDER BY created_at DESC) as rn
    FROM survey_responses
  ) t
  WHERE rn > 1
);

-- Add unique constraint on mobile_number to prevent future duplicates
ALTER TABLE survey_responses 
ADD CONSTRAINT survey_responses_mobile_number_unique UNIQUE (mobile_number);
