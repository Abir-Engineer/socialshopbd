-- 1) Backfill owner_id for orgs where it's NULL
update public.organizations o
set owner_id = m.user_id
from public.organization_members m
where m.organization_id = o.id
  and m.role = 'owner'
  and o.owner_id is null;

-- 2) For users with multiple org memberships, keep only the latest one
--    and delete the rest (keeps the first created one)
delete from public.organization_members
where id in (
  select id from (
    select id, row_number() over (
      partition by user_id
      order by created_at asc
    ) as rn
    from public.organization_members
  ) t
  where t.rn > 1
);

-- 3) Delete orphaned organizations that no longer have any members
delete from public.organizations o
where not exists (
  select 1 from public.organization_members m
  where m.organization_id = o.id
);
