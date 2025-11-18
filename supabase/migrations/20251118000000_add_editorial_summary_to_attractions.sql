-- Add editorial_summary column to attractions table
-- This stores the Google Places editorial summary (description) for each attraction/restaurant

ALTER TABLE attractions 
ADD COLUMN editorial_summary TEXT;

-- Add comment
COMMENT ON COLUMN attractions.editorial_summary IS 'Google Places editorial summary/description of the attraction or restaurant';

