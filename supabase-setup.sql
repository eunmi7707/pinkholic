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


-- ============================================================
-- 장바구니 표 (cart_items)
--
-- 로그인한 회원의 장바구니를 상품마다 한 줄씩 저장합니다.
-- 로그인하지 않은 손님의 장바구니는 브라우저에만 저장됩니다.
-- ============================================================

create table if not exists public.cart_items (
  user_id    uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  product_id integer not null references public.products(id) on delete cascade,
  count      integer not null check (count between 1 and 99),
  position   integer not null default 0,   -- 장바구니에 보여주는 순서
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 보안 : 회원은 자기 장바구니만 보고 고칠 수 있습니다.
alter table public.cart_items enable row level security;

drop policy if exists "본인 장바구니 보기" on public.cart_items;
create policy "본인 장바구니 보기" on public.cart_items
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "본인 장바구니 담기" on public.cart_items;
create policy "본인 장바구니 담기" on public.cart_items
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "본인 장바구니 수정" on public.cart_items;
create policy "본인 장바구니 수정" on public.cart_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "본인 장바구니 빼기" on public.cart_items;
create policy "본인 장바구니 빼기" on public.cart_items
  for delete to authenticated using (auth.uid() = user_id);

-- 이미 표가 있던 경우를 위해 순서 칸을 추가합니다.
alter table public.cart_items add column if not exists position integer not null default 0;

grant select, insert, update, delete on public.cart_items to authenticated;

-- 장바구니 전체를 한 번에 바꿉니다. (사이트에서 부릅니다)
-- items 모양 : [{"id": 상품번호, "count": 수량}, ...]
create or replace function public.set_cart(items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  delete from public.cart_items where user_id = auth.uid();

  insert into public.cart_items (user_id, product_id, count, position)
  select auth.uid(), (e ->> 'id')::integer, least((e ->> 'count')::integer, 99), n::integer
  from jsonb_array_elements(items) with ordinality as t(e, n)
  where (e ->> 'count')::integer > 0
    and exists (select 1 from public.products p where p.id = (e ->> 'id')::integer);
end;
$$;

revoke execute on function public.set_cart(jsonb) from public, anon;
grant execute on function public.set_cart(jsonb) to authenticated;


-- ============================================================
-- 찜 표 (wishes)
--
-- 로그인한 회원이 하트를 누른 상품을 한 줄씩 저장합니다.
-- 로그인하지 않은 손님의 찜은 브라우저에만 저장됩니다.
-- ============================================================

create table if not exists public.wishes (
  user_id    uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  product_id integer not null references public.products(id) on delete cascade,
  position   integer not null default 0,   -- 찜한 순서
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 보안 : 회원은 자기 찜만 보고 고칠 수 있습니다.
alter table public.wishes enable row level security;

drop policy if exists "본인 찜 보기" on public.wishes;
create policy "본인 찜 보기" on public.wishes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "본인 찜 추가" on public.wishes;
create policy "본인 찜 추가" on public.wishes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "본인 찜 빼기" on public.wishes;
create policy "본인 찜 빼기" on public.wishes
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, delete on public.wishes to authenticated;

-- 찜 목록 전체를 한 번에 바꿉니다. (사이트에서 부릅니다)
-- items 모양 : [상품번호, 상품번호, ...]
create or replace function public.set_wish(items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  delete from public.wishes where user_id = auth.uid();

  insert into public.wishes (user_id, product_id, position)
  select auth.uid(), id, min(n)::integer
  from (
    select (e #>> '{}')::integer as id, n
    from jsonb_array_elements(items) with ordinality as t(e, n)
  ) as list
  where exists (select 1 from public.products p where p.id = list.id)
  group by id;
end;
$$;

revoke execute on function public.set_wish(jsonb) from public, anon;
grant execute on function public.set_wish(jsonb) to authenticated;


-- ============================================================
-- 주문 표 (orders, order_items)
--
-- 주문서에서 결제하기를 누르면 place_order 함수가 주문을 저장합니다.
-- 금액은 사이트가 보낸 값을 믿지 않고 이 함수가 상품 표의 가격으로 다시 계산합니다.
-- (아직 결제 서비스가 연결되지 않아 상태는 '결제 대기'로 저장합니다.)
-- ============================================================

create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  order_no        text    unique,                     -- 주문 번호 (예: PH261010-00001)
  user_id         uuid    not null references auth.users(id) on delete cascade,
  status          text    not null default '결제 대기',
  ship_name       text    not null,                   -- 받는 분
  ship_phone      text    not null,
  ship_address    text    not null,
  ship_memo       text    not null default '',
  pay_method      text    not null check (pay_method in ('card', 'bank', 'kakao')),
  old_total       integer not null,                   -- 할인 전 상품 금액
  sale_discount   integer not null,                   -- 기획전 할인
  member_discount integer not null,                   -- 회원 할인
  ship_fee        integer not null,
  pay_total       integer not null,                   -- 결제 금액
  save_point      integer not null,                   -- 적립 예정
  created_at      timestamptz not null default now()
);

-- 주문한 상품 (주문할 때의 이름·가격을 그대로 남겨 둡니다)
create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint  not null references public.orders(id) on delete cascade,
  product_id integer not null,
  name       text    not null,
  img        text    not null,
  old_price  integer not null,
  price      integer not null,
  count      integer not null check (count between 1 and 99)
);

-- 보안 : 회원은 자기 주문만 볼 수 있고, 주문은 place_order 함수로만 만듭니다.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "본인 주문 보기" on public.orders;
create policy "본인 주문 보기" on public.orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "본인 주문 상품 보기" on public.order_items;
create policy "본인 주문 상품 보기" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

grant select on public.orders, public.order_items to authenticated;

-- 주문하기 : 주문을 저장하고 회원 장바구니를 비운 뒤 주문 번호를 돌려줍니다.
-- items 모양 : [{"id": 상품번호, "count": 수량}, ...]
create or replace function public.place_order(
  items jsonb, ship_name text, ship_phone text, ship_address text, ship_memo text, pay_method text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  lines jsonb;
  old_sum integer;
  goods_sum integer;
  member_cut integer;
  fee integer;
  new_id bigint;
  new_no text;
begin
  if uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if coalesce(trim(ship_name), '') = '' or coalesce(trim(ship_phone), '') = '' or coalesce(trim(ship_address), '') = '' then
    raise exception '배송지를 모두 입력해 주세요.';
  end if;
  if pay_method not in ('card', 'bank', 'kakao') then
    raise exception '결제 수단을 골라 주세요.';
  end if;

  -- 주문할 상품 : 판매 중인 상품만, 같은 상품은 합치고, 수량은 1~99개
  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) into lines
  from (
    select p.id, p.name, p.img, p.old_price, p.price, least(sum((e ->> 'count')::integer), 99)::integer as count
    from jsonb_array_elements(items) as e
    join public.products p on p.id = (e ->> 'id')::integer
    where (e ->> 'count')::integer > 0
    group by p.id, p.name, p.img, p.old_price, p.price
  ) as l;

  select coalesce(sum(old_price * count), 0), coalesce(sum(price * count), 0)
    into old_sum, goods_sum
  from jsonb_to_recordset(lines) as x(old_price integer, price integer, count integer);

  if goods_sum = 0 then
    raise exception '장바구니가 비어 있어 주문할 수 없습니다.';
  end if;

  -- 금액 계산 (사이트의 calcTotals 와 같은 규칙)
  member_cut := floor(goods_sum * 3 / 100.0 / 10) * 10;          -- 회원 할인 3%, 10원 단위 버림
  fee := case when goods_sum >= 30000 then 0 else 3000 end;       -- 3만원 이상 무료배송

  insert into public.orders (user_id, ship_name, ship_phone, ship_address, ship_memo, pay_method,
                             old_total, sale_discount, member_discount, ship_fee, pay_total, save_point)
  values (uid, trim(ship_name), trim(ship_phone), trim(ship_address), coalesce(trim(ship_memo), ''), pay_method,
          old_sum, old_sum - goods_sum, member_cut, fee, goods_sum - member_cut + fee,
          floor((goods_sum - member_cut) * 1 / 100.0 / 10) * 10)       -- 적립 1%, 10원 단위 버림
  returning id into new_id;

  new_no := 'PH' || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || lpad(new_id::text, 5, '0');
  update public.orders set order_no = new_no where id = new_id;

  insert into public.order_items (order_id, product_id, name, img, old_price, price, count)
  select new_id, x.id, x.name, x.img, x.old_price, x.price, x.count
  from jsonb_to_recordset(lines) as x(id integer, name text, img text, old_price integer, price integer, count integer);

  -- 주문한 회원의 장바구니를 비웁니다.
  delete from public.cart_items where user_id = uid;

  return new_no;
end;
$$;

revoke execute on function public.place_order(jsonb, text, text, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to authenticated;
