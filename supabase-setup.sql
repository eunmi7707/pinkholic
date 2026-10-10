-- ============================================================
-- 핑크홀릭 - 회원 정보 테이블 (profiles)
--
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전합니다.
--
-- 회원가입을 하면 이메일·이름·휴대폰이 자동으로 이 표에 한 줄씩 들어갑니다.
-- (Table Editor > profiles 에서 보실 수 있습니다.)
-- ============================================================

-- 1) 회원 정보 표
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  name       text,
  phone      text,
  created_at timestamptz not null default now()
);

-- 2) 보안 : 회원은 자기 정보만 보고 고칠 수 있습니다.
alter table public.profiles enable row level security;

drop policy if exists "본인 정보 보기" on public.profiles;
create policy "본인 정보 보기" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "본인 정보 수정" on public.profiles;
create policy "본인 정보 수정" on public.profiles
  for update using (auth.uid() = id);

-- 3) 회원가입하면 자동으로 표에 한 줄을 넣습니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) 이미 가입한 회원도 표에 채워 넣습니다.
insert into public.profiles (id, email, name, phone, created_at)
select id, email, raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'phone', created_at
from auth.users
on conflict (id) do nothing;


-- ============================================================
-- 상품 목록 표 (products)
--
-- 사이트의 모든 화면이 이 표에서 상품을 불러옵니다.
-- Table Editor > products 에서 고치면 사이트에 바로 반영됩니다.
--   old_price   : 할인 전 가격      price       : 판매 가격
--   badge       : 사진 위 표시 (없으면 빈칸)
--   big         : 첫 화면에서 크게 보여줄지
--   hide_on_all : 첫 화면 '전체'에서 숨길지
--   points      : 상세 페이지 아래 요약 3줄
--   sort_order  : 보여주는 순서 (작은 숫자가 먼저)
-- ============================================================

create table if not exists public.products (
  id          integer primary key,
  name        text    not null,
  category    text    not null,
  old_price   integer not null,
  price       integer not null,
  img         text    not null,
  badge       text    not null default '',
  big         boolean not null default false,
  hide_on_all boolean not null default false,
  description text    not null default '',
  points      text[]  not null default '{}',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 보안 : 누구나 상품을 볼 수는 있지만, 사이트에서 고칠 수는 없습니다.
-- (상품 수정은 대시보드에서만 합니다.)
alter table public.products enable row level security;

drop policy if exists "누구나 상품 보기" on public.products;
create policy "누구나 상품 보기" on public.products
  for select to anon, authenticated using (true);

grant select on public.products to anon, authenticated;
