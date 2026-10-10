/* ============================================================
   핑크홀릭 - 모든 페이지가 함께 쓰는 파일

   1) 상품 목록 (PRODUCTS)
   2) 저장 기능 (찜하기 / 장바구니 / 로그인 상태)
   3) 공통으로 쓰는 작은 도구들

   상품은 Supabase 의 products 표에 저장되어 있습니다.
   대시보드 Table Editor > products 에서 추가하거나 고치시면
   첫 화면, 상세 페이지, 장바구니에 모두 반영됩니다.
   ============================================================ */


/* ===== 1) 상품 목록 ===== */
/* 화면을 열 때 Supabase 에서 불러와 아래 모양으로 채웁니다.
   (괄호 안은 Supabase 표의 칸 이름입니다.)

   id       : 상품 번호 (겹치지 않게)
   name     : 상품 이름
   category : 가방 / 주얼리 / 패션소품
   oldPrice : 할인 전 가격 (old_price)
   price    : 판매 가격
   img      : 사진 주소
   badge    : 사진 위에 붙는 표시 (없으면 "")
   big      : 첫 화면에서 크게 보여줄지
   hideOnAll: 첫 화면 '전체'에서 숨길지 (hide_on_all)
   desc     : 상세 페이지에 나오는 설명 (description)
   points   : 상세 페이지 아래 요약 3줄
   보여주는 순서는 Supabase 의 sort_order 가 작은 것부터입니다.  */

var PRODUCTS = [];   // supabase.js 의 loadProducts() 가 채웁니다.

/* 상품을 불러오지 못했을 때 box 안에 안내를 보여줍니다. */
function showLoadError(box) {
  box.innerHTML =
    '<div class="empty">상품을 불러오지 못했습니다.<br>' +
    '잠시 후 새로고침해 주세요.</div>';
}


/* ===== 2) 저장 기능 ===== */
/* 브라우저에 값을 저장하는 이름표들 */
var WISH_KEY   = "pinkholic_wish";     // 찜한 상품
var CART_KEY   = "pinkholic_cart";     // 장바구니
var LOGIN_KEY  = "pinkholic_login";    // 지금 로그인한 사람

/* 저장된 값을 읽어옵니다. 없거나 읽지 못하면 기본값을 돌려줍니다. */
function loadData(key, defaultValue) {
  try {
    var saved = localStorage.getItem(key);
    if (saved === null) {
      return defaultValue;
    }
    return JSON.parse(saved);
  } catch (e) {
    return defaultValue;   // 저장을 막아둔 브라우저에서도 화면은 정상 동작합니다.
  }
}

/* 값을 저장합니다. */
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 저장이 안 되어도 화면은 정상 동작합니다.
  }
}

/* --- 찜하기 --- */
/* 찜은 [상품번호, ...] 모양으로 저장합니다.
   로그인한 회원은 Supabase 에도 함께 저장합니다. (supabase.js 의 saveToServer) */
function getWish()          { return loadData(WISH_KEY, []); }
function setWish(list) {
  saveData(WISH_KEY, list);
  if (typeof saveToServer === "function") {
    saveToServer("wish", list);
  }
}
function isWished(id) {
  var list = getWish();
  for (var i = 0; i < list.length; i++) {
    if (list[i] === id) { return true; }
  }
  return false;
}
function toggleWishId(id) {
  var list = getWish();
  var newList = [];
  var found = false;

  for (var i = 0; i < list.length; i++) {
    if (list[i] === id) { found = true; }
    else { newList.push(list[i]); }
  }
  if (!found) { newList.push(id); }

  setWish(newList);
  return !found;   // 지금 찜한 상태이면 true
}

/* --- 장바구니 --- */
/* 장바구니는 [{id: 상품번호, count: 수량}] 모양으로 저장합니다.
   로그인한 회원은 Supabase 에도 함께 저장합니다. (supabase.js 의 saveToServer) */
function getCart()     { return loadData(CART_KEY, []); }
function setCart(list) {
  saveData(CART_KEY, list);
  if (typeof saveToServer === "function") {
    saveToServer("cart", list);
  }
}

function addToCart(id, count) {
  var cart = getCart();
  var found = false;

  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      cart[i].count = cart[i].count + count;   // 이미 있으면 수량만 더합니다.
      found = true;
    }
  }
  if (!found) {
    cart.push({ id: id, count: count });
  }

  setCart(cart);
}

function cartTotalCount() {
  var cart = getCart();
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    total += cart[i].count;
  }
  return total;
}

/* --- 로그인 --- */
/* 지금 로그인한 회원을 기억해 둡니다. ({email, name, phone, joinedAt})
   가입·로그인·로그아웃은 supabase.js 가 맡습니다.                     */
function getLoginUser()   { return loadData(LOGIN_KEY, null); }
function setLoginUser(u)  { saveData(LOGIN_KEY, u); }


/* ===== 3) 공통으로 쓰는 작은 도구들 ===== */

/* 상품 번호로 상품을 찾습니다. */
function findProduct(id) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) {
      return PRODUCTS[i];
    }
  }
  return null;
}

/* 136000 -> "136,000원" */
function won(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
}

/* 할인율을 계산합니다. 168000 -> 136000 이면 19 */
function discountRate(oldPrice, price) {
  return Math.round((oldPrice - price) / oldPrice * 100);
}

/* 주소창의 ?id=3 같은 값을 읽어옵니다. */
function getParam(name) {
  var query = location.search.substring(1);   // "id=3"
  var parts = query.split("&");
  for (var i = 0; i < parts.length; i++) {
    var pair = parts[i].split("=");
    if (pair[0] === name) {
      return decodeURIComponent(pair[1] || "");
    }
  }
  return "";
}

/* 메뉴의 장바구니 개수와 로그인 상태를 새로 그립니다.
   모든 페이지에서 화면을 열 때 한 번씩 부릅니다.            */
function updateNav() {
  var countBox = document.getElementById("cartCount");
  if (countBox) {
    countBox.textContent = cartTotalCount();
  }

  var user = getLoginUser();
  var loginLink = document.getElementById("loginLink");
  var joinLink = document.getElementById("joinLink");

  if (user && loginLink) {
    loginLink.textContent = "로그아웃";
    loginLink.href = "#";
    loginLink.onclick = function () {
      logout();
      return false;
    };
    // 로그인 중에는 회원가입 자리에 회원 이름을 보여주고, 누르면 마이페이지로 갑니다.
    if (joinLink) {
      joinLink.textContent = shortName(user) + "님";
      joinLink.href = "mypage.html";
      joinLink.className = "me";
      joinLink.title = user.email;   // 마우스를 올리면 이메일이 보입니다.
    }
  }
}

/* 메뉴에 보여줄 이름입니다. 이름이 없으면 이메일 @ 앞부분을 씁니다.
   메뉴가 한 줄을 넘지 않도록 8글자까지만 보여줍니다.              */
function shortName(user) {
  var name = user.name || (user.email || "").split("@")[0];
  if (name.length > 8) {
    name = name.substring(0, 8) + "…";
  }
  return name;
}

function showAlert() {
  alert("준비 중입니다. 조금만 기다려 주세요.");
}
