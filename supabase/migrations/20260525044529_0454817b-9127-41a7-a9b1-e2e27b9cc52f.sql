
create or replace function public.get_my_family_parents()
returns table (
  id uuid,
  name text,
  nationality text,
  passport_number text,
  passport_expiry_date date,
  parent_user_id uuid,
  family_id uuid,
  is_primary_contact boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with my_families as (
    select distinct p.family_id
    from public.parents p
    where p.parent_user_id = auth.uid()
      and p.family_id is not null
  )
  select p.id, p.name, p.nationality, p.passport_number, p.passport_expiry_date,
         p.parent_user_id, p.family_id, p.is_primary_contact
  from public.parents p
  where p.parent_user_id = auth.uid()
     or p.family_id in (select family_id from my_families);
$$;

create or replace function public.get_my_family_students()
returns table (
  id uuid,
  name text,
  nationality text,
  passport_number text,
  passport_expiry_date date,
  family_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with my_families as (
    select distinct p.family_id
    from public.parents p
    where p.parent_user_id = auth.uid()
      and p.family_id is not null
  )
  select distinct s.id, s.name, s.nationality, s.passport_number, s.passport_expiry_date, s.family_id
  from public.students s
  where s.family_id in (select family_id from my_families)
     or exists (
       select 1 from public.student_guardians sg
       where sg.student_id = s.id and sg.guardian_user_id = auth.uid()
     );
$$;

grant execute on function public.get_my_family_parents() to authenticated;
grant execute on function public.get_my_family_students() to authenticated;
