create policy "cases: require 2FA (aal2)" on public.cases
  as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2')
  with check ((auth.jwt() ->> 'aal') = 'aal2');

create policy "documents: require 2FA (aal2)" on public.documents
  as restrictive for all to authenticated
  using ((auth.jwt() ->> 'aal') = 'aal2')
  with check ((auth.jwt() ->> 'aal') = 'aal2');
