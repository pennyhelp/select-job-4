-- Create table for tracking incomplete survey submissions
CREATE TABLE IF NOT EXISTS public.incomplete_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile_number text NOT NULL,
  panchayath_id uuid REFERENCES public.panchayaths(id),
  ward_number integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incomplete_surveys ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert incomplete surveys
CREATE POLICY "Anyone can insert incomplete surveys"
  ON public.incomplete_surveys
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own incomplete survey by mobile number
CREATE POLICY "Anyone can update incomplete surveys"
  ON public.incomplete_surveys
  FOR UPDATE
  USING (true);

-- Allow anyone to delete incomplete surveys
CREATE POLICY "Anyone can delete incomplete surveys"
  ON public.incomplete_surveys
  FOR DELETE
  USING (true);

-- Authenticated users can view incomplete surveys
CREATE POLICY "Authenticated users can view incomplete surveys"
  ON public.incomplete_surveys
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create index on mobile_number for faster lookups
CREATE INDEX idx_incomplete_surveys_mobile ON public.incomplete_surveys(mobile_number);