-- =============================================================================
-- TELEHEALTH APPOINTMENT & AUTO-TRIAGE SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- CSCD 602 ADVANCED SOFTWARE ENGINEERING FINAL PROJECT
-- =============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    bio TEXT,
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    is_verified BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 4.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DOCTOR SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_mins INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. TRIAGE ASSESSMENTS TABLE (Rule Engine Output)
CREATE TABLE IF NOT EXISTS public.triage_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    primary_symptom TEXT NOT NULL,
    symptom_duration TEXT NOT NULL,
    pain_score INTEGER CHECK (pain_score BETWEEN 1 AND 10),
    red_flag_present BOOLEAN DEFAULT FALSE,
    red_flags JSONB DEFAULT '[]'::jsonb,
    severity_score INTEGER NOT NULL, -- 0 to 100
    urgency_level TEXT NOT NULL CHECK (urgency_level IN ('EMERGENCY', 'URGENT', 'SEMI_URGENT', 'ROUTINE')),
    recommended_specialty TEXT NOT NULL,
    triage_summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    triage_id UUID REFERENCES public.triage_assessments(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SIMULATED_SUCCESS', 'FAILED')),
    payment_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SIMULATED PAYMENT LOGS (Technical Debt Item #1)
CREATE TABLE IF NOT EXISTS public.simulated_payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_ref TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('MOBILE_MONEY', 'CREDIT_CARD', 'HEALTH_INSURANCE')),
    provider TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'DECLINED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. NOTIFICATIONS TABLE (Technical Debt Item #2 - Simplified In-App Queue)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('TRIAGE', 'APPOINTMENT', 'PAYMENT', 'SYSTEM')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulated_payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for doctors & profiles
CREATE POLICY "Public Profiles Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Doctors Read" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public Doctor Schedules Read" ON public.doctor_schedules FOR SELECT USING (true);

-- User-specific privacy policies
CREATE POLICY "Users view own triage" ON public.triage_assessments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view triage linked to appointments" ON public.triage_assessments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctors d ON a.doctor_id = d.id
        WHERE a.triage_id = public.triage_assessments.id AND d.profile_id = auth.uid()
    )
);

CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view assigned appointments" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = public.appointments.doctor_id AND d.profile_id = auth.uid())
);

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
