-- Current state check
select u.email, m.role, o.name as org_name, o.owner_id, m.organization_id
from auth.users u
join public.organization_members m on m.user_id = u.id
join public.organizations o on o.id = m.organization_id;
