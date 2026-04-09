-- Supabase Database Schema for IT Center Exam System
-- Run this SQL in your Supabase SQL Editor

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id SERIAL PRIMARY KEY,
  identity TEXT UNIQUE NOT NULL,
  name TEXT,
  surname TEXT,
  phone TEXT,
  status TEXT DEFAULT 'login',
  score INTEGER,
  total_questions INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can restrict this later)
CREATE POLICY "Allow all operations on exam_sessions" ON exam_sessions
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_sessions_identity ON exam_sessions(identity);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_created_at ON exam_sessions(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_exam_sessions_updated_at
  BEFORE UPDATE ON exam_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();