-- ============================================================================
-- Migration: Disable RLS for Development
-- Created: 2025-11-09 14:00:01 UTC
-- ============================================================================
--
-- PURPOSE:
--   Temporarily disables Row Level Security on all tables to ease development.
--   RLS policies remain defined but inactive. Normal table access works without
--   restrictions while RLS is disabled.
--
-- IMPORTANT:
--   This is for DEVELOPMENT ONLY. Before production deployment, either:
--   1. Do not apply this migration in production, OR
--   2. Create a follow-up migration to re-enable RLS
--
-- TO RE-ENABLE RLS:
--   Run: ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
--   All policies will automatically become active again.
--
-- ============================================================================

-- disable rls on all tables
alter table user_personas disable row level security;
alter table conversations disable row level security;
alter table trips disable row level security;
alter table places disable row level security;
alter table attractions disable row level security;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- RLS disabled for development:
--   ✓ Disabled RLS on 5 tables
--   ✓ Policies remain defined but inactive
--   ✓ Tables accessible without security restrictions
--
-- Note: Re-enable RLS before production deployment!
-- ============================================================================

