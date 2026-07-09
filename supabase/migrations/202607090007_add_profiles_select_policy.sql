-- Allow authenticated users to view profiles of other users to display names in shared contexts
create policy "Authenticated users can select profiles"
  on public.profiles for select to authenticated
  using (true);
