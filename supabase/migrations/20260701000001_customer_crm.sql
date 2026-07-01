alter table public.customers
  add column if not exists avatar_url text,
  add column if not exists tags text[] default '{}',
  add column if not exists addresses jsonb default '[]'::jsonb,
  add column if not exists phones jsonb default '[]'::jsonb;

-- Storage bucket for customer avatars
insert into storage.buckets (id, name, public)
values ('customer-avatars', 'customer-avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'customer-avatars');

-- Allow public read
create policy "Anyone can view avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'customer-avatars');

-- Allow owners to delete their avatars
create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'customer-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
