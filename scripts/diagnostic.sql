-- Run this in Supabase SQL Editor to diagnose the issue

-- 1) Your current auth user ID (from your session)
select 'Your auth user info:' as info;
select id, email, created_at from auth.users order by created_at desc;

-- 2) How many organization_members records exist?
select 'Org members count:' as info;
select count(*) from public.organization_members;

-- 3) All org members with their org details
select 'All org members with orgs:' as info;
select m.user_id, m.role, o.id as org_id, o.name, o.slug, o.owner_id
from public.organization_members m
join public.organizations o on o.id = m.organization_id;

-- 4) Users without any org member entry (the problem users)
select 'Users WITHOUT org membership:' as info;
select u.id, u.email
from auth.users u
where u.id not in (select user_id from public.organization_members);

-- 5) Test get_user_org_id() for the current session user
select 'get_user_org_id() test (run as authenticated user):' as info;
-- Note: returns null if no org member for current session user
select public.get_user_org_id() as your_org_id;
