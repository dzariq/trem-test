
create or replace function public.get_my_family_student_visa()
returns setof public.student_visa_records
language sql stable security definer set search_path = public as $$
  select r.* from public.student_visa_records r
  where r.student_id in (select id from public.get_my_family_students());
$$;

create or replace function public.get_my_family_student_visa_periods()
returns setof public.student_visa_periods
language sql stable security definer set search_path = public as $$
  select p.* from public.student_visa_periods p
  where p.student_id in (select id from public.get_my_family_students())
  order by p.issue_date desc nulls last;
$$;

create or replace function public.get_my_family_parent_visa()
returns setof public.parent_visa_records
language sql stable security definer set search_path = public as $$
  select r.* from public.parent_visa_records r
  where r.parent_id in (select id from public.get_my_family_parents());
$$;

create or replace function public.get_my_family_parent_visa_periods()
returns setof public.parent_visa_periods
language sql stable security definer set search_path = public as $$
  select p.* from public.parent_visa_periods p
  where p.parent_id in (select id from public.get_my_family_parents())
  order by p.issue_date desc nulls last;
$$;

grant execute on function public.get_my_family_student_visa() to authenticated;
grant execute on function public.get_my_family_student_visa_periods() to authenticated;
grant execute on function public.get_my_family_parent_visa() to authenticated;
grant execute on function public.get_my_family_parent_visa_periods() to authenticated;
