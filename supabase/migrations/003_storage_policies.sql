-- RLS is already enabled on storage.objects by default
-- skipping: altinsert into storage.buckets (id, name, public)
values ('business', 'business', true);

-- Policy for "business" bucket
create policy "Allow Public View business"
on storage.objects for select
using ( bucket_id = 'business' );

create policy "Allow authenticated uploads business"
on storage.objects for insert
with check ( bucket_id = 'business' AND auth.role() = 'authenticated' );

create policy "Allow owners to update business"
on storage.objects for update
using ( bucket_id = 'business' );

create policy "Allow owners to delete business"
on storage.objects for delete
using ( bucket_id = 'business' );

-- Portfolios Policies
create policy "Public Access to Portfolios"
on storage.objects for select
to public
using ( bucket_id = 'portfolios' );

create policy "Authenticated Users can upload Portfolios"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'portfolios' );

create policy "Authenticated Users can update Portfolios"
on storage.objects for update
to authenticated
using ( bucket_id = 'portfolios' );

create policy "Authenticated Users can delete Portfolios"
on storage.objects for delete
to authenticated
using ( bucket_id = 'portfolios' );

-- Avatars Policies
create policy "Public Access to Avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

create policy "Authenticated Users can upload Avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

create policy "Authenticated Users can update Avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );

-- Receipts Policies (Private read, Auth write)
create policy "Authenticated Users can upload Receipts"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'receipts' );

create policy "Users can view their own Receipts"
on storage.objects for select
to authenticated
using ( bucket_id = 'receipts' and auth.uid() = owner );
