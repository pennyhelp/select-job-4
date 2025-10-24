-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create districts enum
CREATE TYPE public.district_type AS ENUM ('Malappuram', 'Kozhikode', 'Palakkad');

-- Create panchayaths table
CREATE TABLE public.panchayaths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  district district_type NOT NULL DEFAULT 'Malappuram',
  ward_count INTEGER NOT NULL CHECK (ward_count > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sub_categories table
CREATE TABLE public.sub_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sub_category_id, name)
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panchayath_id UUID REFERENCES public.panchayaths(id) ON DELETE CASCADE NOT NULL,
  ward_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  custom_program TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.panchayaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Public read access for panchayaths (needed for survey form)
CREATE POLICY "Anyone can view panchayaths" ON public.panchayaths
  FOR SELECT USING (true);

-- Public read access for categories (needed for survey form)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

-- Public read access for sub_categories (needed for survey form)
CREATE POLICY "Anyone can view sub_categories" ON public.sub_categories
  FOR SELECT USING (true);

-- Public read access for programs (needed for survey form)
CREATE POLICY "Anyone can view programs" ON public.programs
  FOR SELECT USING (true);

-- Public insert access for survey_responses (anyone can submit survey)
CREATE POLICY "Anyone can submit survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

-- Authenticated users can manage panchayaths
CREATE POLICY "Authenticated users can insert panchayaths" ON public.panchayaths
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update panchayaths" ON public.panchayaths
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete panchayaths" ON public.panchayaths
  FOR DELETE TO authenticated USING (true);

-- Authenticated users can manage categories
CREATE POLICY "Authenticated users can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (true);

-- Authenticated users can manage sub_categories
CREATE POLICY "Authenticated users can insert sub_categories" ON public.sub_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sub_categories" ON public.sub_categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete sub_categories" ON public.sub_categories
  FOR DELETE TO authenticated USING (true);

-- Authenticated users can manage programs
CREATE POLICY "Authenticated users can insert programs" ON public.programs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update programs" ON public.programs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete programs" ON public.programs
  FOR DELETE TO authenticated USING (true);

-- Authenticated users can view survey responses
CREATE POLICY "Authenticated users can view survey responses" ON public.survey_responses
  FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_sub_categories_category_id ON public.sub_categories(category_id);
CREATE INDEX idx_programs_category_id ON public.programs(category_id);
CREATE INDEX idx_programs_sub_category_id ON public.programs(sub_category_id);
CREATE INDEX idx_survey_responses_panchayath_id ON public.survey_responses(panchayath_id);
CREATE INDEX idx_survey_responses_category_id ON public.survey_responses(category_id);
CREATE INDEX idx_survey_responses_created_at ON public.survey_responses(created_at DESC);