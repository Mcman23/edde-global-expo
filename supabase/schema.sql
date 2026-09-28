-- ==========================================
-- EDDE Global Expo - Supabase Database Schema
-- Run this script in the Supabase SQL Editor after creating your project.
-- ==========================================

-- 1. Enable pgcrypto Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. Create Trigger Function for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. Create Tables
-- ==========================================

-- Table: quiz_questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_key TEXT UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quiz_options
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL,
    option_text TEXT NOT NULL,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quiz_sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    source TEXT,
    campaign TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table: quiz_answers
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    option_key TEXT NOT NULL,
    question_text TEXT,
    option_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quiz_results
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    primary_destination TEXT NOT NULL,
    study_level TEXT,
    field TEXT,
    intake TEXT,
    budget_category TEXT,
    alternative_destination TEXT,
    reasons JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    campaign TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
    session_id TEXT,
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    preferred_destination TEXT,
    study_level TEXT,
    intended_intake TEXT,
    quiz_answers JSONB,
    recommendation JSONB,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    offer_title TEXT,
    campaign TEXT,
    source TEXT,
    lead_status TEXT DEFAULT 'New' CHECK (lead_status IN ('New', 'Contacted', 'Consultation', 'Application', 'Converted', 'Lost')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    session_id TEXT,
    source TEXT,
    campaign TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Triggers for updated_at
-- ==========================================
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. Helper Function: is_admin()
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- ==========================================
-- 6. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. RLS Policies
-- ==========================================

-- --- quiz_questions & quiz_options ---
-- Public anon read access to active questions & options
CREATE POLICY "Public read active questions" ON quiz_questions
    FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "Admin write questions" ON quiz_questions
    FOR ALL USING (is_admin());

CREATE POLICY "Public read active options" ON quiz_options
    FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "Admin write options" ON quiz_options
    FOR ALL USING (is_admin());

-- --- quiz_sessions ---
-- Anon can INSERT new quiz session
CREATE POLICY "Anon insert quiz_sessions" ON quiz_sessions
    FOR INSERT WITH CHECK (true);

-- Admin full access to quiz_sessions
CREATE POLICY "Admin access quiz_sessions" ON quiz_sessions
    FOR ALL USING (is_admin());

-- --- quiz_answers ---
-- Anon can INSERT quiz answers
CREATE POLICY "Anon insert quiz_answers" ON quiz_answers
    FOR INSERT WITH CHECK (true);

-- Admin full access to quiz_answers
CREATE POLICY "Admin access quiz_answers" ON quiz_answers
    FOR ALL USING (is_admin());

-- --- quiz_results ---
-- Anon can INSERT quiz results
CREATE POLICY "Anon insert quiz_results" ON quiz_results
    FOR INSERT WITH CHECK (true);

-- Admin full access to quiz_results
CREATE POLICY "Admin access quiz_results" ON quiz_results
    FOR ALL USING (is_admin());

-- --- offers ---
-- Public read access to active offers
CREATE POLICY "Public read active offers" ON offers
    FOR SELECT USING (active = true OR is_admin());

-- Admin write access to offers
CREATE POLICY "Admin write offers" ON offers
    FOR ALL USING (is_admin());

-- --- campaigns ---
-- Public read access to active campaigns
CREATE POLICY "Public read active campaigns" ON campaigns
    FOR SELECT USING (active = true OR is_admin());

-- Admin write access to campaigns
CREATE POLICY "Admin write campaigns" ON campaigns
    FOR ALL USING (is_admin());

-- --- leads ---
-- Anon INSERT-only on leads (WITH CHECK true, no SELECT/UPDATE/DELETE)
CREATE POLICY "Anon insert leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Admin full access (SELECT, UPDATE, DELETE) on leads
CREATE POLICY "Admin access leads" ON leads
    FOR ALL USING (is_admin());

-- --- analytics_events ---
-- Anon INSERT-only on analytics_events
CREATE POLICY "Anon insert analytics_events" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Admin full access on analytics_events
CREATE POLICY "Admin access analytics_events" ON analytics_events
    FOR ALL USING (is_admin());

-- --- admin_users ---
-- Users can read their own admin record, or admins can read all
CREATE POLICY "Read admin users" ON admin_users
    FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "Admin manage admin_users" ON admin_users
    FOR ALL USING (is_admin());

-- ==========================================
-- 8. Seed Initial Data
-- ==========================================

-- Seed Initial Offer
INSERT INTO offers (title, description, cta_text, active, campaign)
VALUES (
    'FREE UNIVERSITY SHORTLIST',
    'Receive a personalised shortlist of universities matched to your profile — exclusive for Expo visitors.',
    'UNLOCK MY EXPO BENEFIT',
    true,
    'edde_global_expo'
) ON CONFLICT DO NOTHING;

-- Seed Initial Campaign
INSERT INTO campaigns (name, description, active)
VALUES (
    'edde_global_expo',
    'Primary campaign for EDDE Global International Education Exhibition.',
    true
) ON CONFLICT (name) DO NOTHING;

-- Seed Quiz Questions & Options
DO $$
DECLARE
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
    q4_id UUID;
    q5_id UUID;
BEGIN
    -- Question 1: Study Level
    INSERT INTO quiz_questions (question_key, question_text, display_order)
    VALUES ('study_level', 'What level of study are you planning for?', 1)
    RETURNING id INTO q1_id;

    INSERT INTO quiz_options (question_id, option_key, option_text, display_order) VALUES
    (q1_id, 'undergraduate', 'Undergraduate / Bachelor''s Degree', 1),
    (q1_id, 'postgraduate', 'Postgraduate / Master''s Degree', 2),
    (q1_id, 'phd', 'Doctorate / PhD', 3),
    (q1_id, 'diploma', 'Diploma / Foundation / Language', 4);

    -- Question 2: Field of Study
    INSERT INTO quiz_questions (question_key, question_text, display_order)
    VALUES ('field', 'Which subject area interests you most?', 2)
    RETURNING id INTO q2_id;

    INSERT INTO quiz_options (question_id, option_key, option_text, display_order) VALUES
    (q2_id, 'business', 'Business, Management & Finance', 1),
    (q2_id, 'engineering', 'Engineering, IT & Computer Science', 2),
    (q2_id, 'health', 'Medicine, Healthcare & Sciences', 3),
    (q2_id, 'arts', 'Arts, Media, Humanities & Law', 4);

    -- Question 3: Preferred Destination
    INSERT INTO quiz_questions (question_key, question_text, display_order)
    VALUES ('destination_preference', 'What is your dream study destination?', 3)
    RETURNING id INTO q3_id;

    INSERT INTO quiz_options (question_id, option_key, option_text, display_order) VALUES
    (q3_id, 'uk', 'United Kingdom', 1),
    (q3_id, 'canada', 'Canada', 2),
    (q3_id, 'usa', 'United States', 3),
    (q3_id, 'australia', 'Australia', 4),
    (q3_id, 'open', 'Open to best recommendations', 5);

    -- Question 4: Intended Intake
    INSERT INTO quiz_questions (question_key, question_text, display_order)
    VALUES ('intake', 'When are you planning to start?', 4)
    RETURNING id INTO q4_id;

    INSERT INTO quiz_options (question_id, option_key, option_text, display_order) VALUES
    (q4_id, 'autumn_2026', 'September / October 2026', 1),
    (q4_id, 'spring_2027', 'January / February 2027', 2),
    (q4_id, 'autumn_2027', 'September / October 2027', 3),
    (q4_id, 'exploring', 'Just exploring options', 4);

    -- Question 5: Budget Range
    INSERT INTO quiz_questions (question_key, question_text, display_order)
    VALUES ('budget', 'What is your approximate annual tuition budget?', 5)
    RETURNING id INTO q5_id;

    INSERT INTO quiz_options (question_id, option_key, option_text, display_order) VALUES
    (q5_id, 'budget_flexible', 'Flexible / Seeking Scholarships', 1),
    (q5_id, 'budget_mid', '$15,000 - $25,000 / year', 2),
    (q5_id, 'budget_high', '$25,000 - $40,000 / year', 3),
    (q5_id, 'budget_premium', '$40,000+ / year', 4);
END $$;
