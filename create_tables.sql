-- SQL to create the required tables in Supabase
-- Run this in your Supabase SQL editor

-- Table for eligible students
CREATE TABLE IF NOT EXISTS eligible_students (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  age INTEGER,
  email TEXT,
  contact TEXT,
  whatsapp TEXT,
  student_contact TEXT,
  class TEXT,
  prev_percent REAL,
  present_percent REAL,
  scholarship TEXT,
  has_scholarship BOOLEAN,
  does_work BOOLEAN,
  earning_members TEXT,
  camp_name TEXT,
  educationcategory TEXT,
  volunteer_email TEXT,
  fee_structure TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for not eligible students
CREATE TABLE IF NOT EXISTS not_eligible_students (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  age INTEGER,
  email TEXT,
  contact TEXT,
  whatsapp TEXT,
  student_contact TEXT,
  class TEXT,
  prev_percent REAL,
  present_percent REAL,
  scholarship TEXT,
  has_scholarship BOOLEAN,
  does_work BOOLEAN,
  earning_members TEXT,
  camp_name TEXT,
  educationcategory TEXT,
  volunteer_email TEXT,
  fee_structure TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE eligible_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE not_eligible_students ENABLE ROW LEVEL SECURITY;

-- Create policies to allow insert (adjust based on your auth setup)
CREATE POLICY "Allow insert for authenticated users" ON eligible_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated users" ON not_eligible_students FOR INSERT WITH CHECK (true);
