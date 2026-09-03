-- Fix: "infinite recursion detected in policy for relation group_members"
--
-- Root cause: prior RLS policies on group_members referenced group_members
-- itself inside their USING/WITH CHECK expressions (e.g. "user is member of
-- the same group"). PostgreSQL re-enters the policy for the sub-query,
-- causing infinite recursion.
--
-- Fix: use a SECURITY DEFINER helper function so the membership lookup runs
-- with the function owner's privileges (bypassing RLS on the inner call).
-- Then rewrite policies to call the helper instead of self-querying.
--
-- Run this in Supabase Dashboard → SQL Editor (or via `supabase db push`
-- if you use the CLI). Idempotent: safe to re-run.

-- 1) Helper function ---------------------------------------------------------

create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
      from public.group_members
     where group_id = _group_id
       and user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to anon, authenticated;

-- 2) Drop any existing recursive policies (best-effort) ---------------------
-- We drop by name only if they exist. Adjust the list if your project uses
-- different policy names.

do $$
declare
  policy_name text;
begin
  for policy_name in
    select polname
      from pg_policy
     where polrelid = 'public.group_members'::regclass
  loop
    execute format('drop policy if exists %I on public.group_members', policy_name);
  end loop;
end $$;

-- 3) Re-create clean, non-recursive policies --------------------------------

alter table public.group_members enable row level security;

-- SELECT: user can see rows for any group they belong to (via helper).
create policy "group_members_select_shared_group"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id));

-- INSERT: user can insert only their own membership row. This covers:
--   - creator adding themselves on group creation
--   - invited user joining via /join/[code]
create policy "group_members_insert_self"
on public.group_members for insert
to authenticated
with check (user_id = auth.uid());

-- DELETE: user can remove their own membership (leave group) OR admin
-- (group creator) can remove others. Uses groups.created_by directly to
-- avoid another self-reference.
create policy "group_members_delete_self_or_admin"
on public.group_members for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

-- (No UPDATE policy on purpose — this table is insert/delete only in the app.)
