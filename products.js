/* ============================================================
   핑크홀릭 - 모든 페이지가 함께 쓰는 파일

   1) 상품 목록 (PRODUCTS)
   2) 저장 기능 (찜하기 / 장바구니 / 회원 / 로그인)
   3) 공통으로 쓰는 작은 도구들

   상품을 추가하거나 고치실 때는 아래 PRODUCTS 목록만 바꾸시면
   첫 화면, 상세 페이지, 장바구니에 모두 반영됩니다.
   ============================================================ */


/* ===== 1) 상품 목록 ===== */
/* id       : 상품 번호 (겹치지 않게)
   name     : 상품 이름
   category : 가방 / 주얼리 / 패션소품
   oldPrice : 할인 전 가격 (숫자만)
   price    : 판매 가격 (숫자만)
   img      : 사진 주소
   badge    : 사진 위에 붙는 표시 (없으면 "")
   big      : 첫 화면에서 크게 보여줄지 (true / false)
   hideOnAll: 첫 화면 '전체'에서 숨길지 (true / false)
   desc     : 상세 페이지에 나오는 설명
   points   : 상세 페이지 아래 요약 3줄                        */

var PRODUCTS = [
  {
    id: 1,
    name: "플리츠 레더 토트백",
    category: "가방",
    oldPrice: 168000,
    price: 136000,
    img: "https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=900",
    badge: "BEST 1",
    big: true,
    hideOnAll: false,
    desc: "주름을 하나하나 잡아 만든 토트백입니다. 어깨에 걸치면 주름이 자연스럽게 퍼지고, 물건을 넣을수록 모양이 잡힙니다. 서류와 노트북이 함께 들어가는 크기라 출근용으로 많이 찾으십니다.",
    points: ["가로 38 x 세로 28 x 폭 14 cm", "소가죽 / 무게 720g", "탈착식 파우치 포함"]
  },
  {
    id: 2,
    name: "골드 트위스트 이어링",
    category: "주얼리",
    oldPrice: 79000,
    price: 63900,
    img: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900",
    badge: "BEST 2",
    big: false,
    hideOnAll: false,
    desc: "꼬임을 넣은 후프 이어링입니다. 빛을 받는 각도마다 다르게 반짝여서, 단정한 옷차림에도 얼굴이 환해 보입니다. 귀에 부담이 적도록 속을 비워 가볍게 만들었습니다.",
    points: ["지름 3.2 cm / 한 쪽 4g", "은침 / 알레르기 완화 도금", "보관용 파우치 동봉"]
  },
  {
    id: 3,
    name: "담수진주 펜던트 네크리스",
    category: "주얼리",
    oldPrice: 92000,
    price: 74500,
    img: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=900",
    badge: "BEST 3",
    big: false,
    hideOnAll: false,
    desc: "담수진주 한 알을 매단 목걸이입니다. 진주는 하나하나 모양이 조금씩 달라, 같은 상품이라도 받으시는 것이 세상에 하나뿐입니다. 셔츠 위에 그대로 걸치기 좋은 길이입니다.",
    points: ["체인 42 cm + 연장 5 cm", "담수진주 9~10 mm", "14K 골드필드 체인"]
  },
  {
    id: 4,
    name: "라운드 골드 선글라스",
    category: "패션소품",
    oldPrice: 145000,
    price: 117400,
    img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "얇은 금속테의 동그란 선글라스입니다. 테가 가늘어 얼굴을 덮지 않고, 렌즈 색이 진하지 않아 실내에 들어가서도 바로 벗지 않아도 됩니다.",
    points: ["렌즈 지름 4.9 cm / 무게 21g", "자외선 99% 차단", "전용 케이스와 안경닦이 포함"]
  },
  {
    id: 5,
    name: "젬스톤 링 세트 (3종)",
    category: "주얼리",
    oldPrice: 88000,
    price: 71200,
    img: "https://images.unsplash.com/photo-1608042314453-ae338d80c427?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "굵기가 다른 반지 세 개를 한 세트로 묶었습니다. 셋을 한 손에 겹쳐 끼거나, 하나만 골라 끼셔도 됩니다. 색이 있는 원석을 하나씩 물려 손이 심심해 보이지 않습니다.",
    points: ["12호 / 13호 / 14호 (한 세트)", "황동에 골드 도금", "천연석 (색과 무늬가 조금씩 다릅니다)"]
  },
  {
    id: 6,
    name: "골드 뱅글 팔찌 세트",
    category: "주얼리",
    oldPrice: 76000,
    price: 61500,
    img: "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "가느다란 뱅글 여러 개를 한 번에 착용하는 세트입니다. 팔을 움직일 때마다 서로 부딪히며 소리가 나고, 소매를 걷었을 때 손목이 예뻐 보입니다.",
    points: ["안지름 6.2 cm (평균 손목)", "황동에 골드 도금", "4개 한 세트"]
  },
  {
    id: 7,
    name: "베이지 체크 울 머플러",
    category: "패션소품",
    oldPrice: 98000,
    price: 79300,
    img: "https://images.unsplash.com/photo-1760551938129-01da7f950fe1?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "울을 섞어 짠 두꺼운 머플러입니다. 목에 두 번 감아도 부피가 답답하지 않고, 코트 위에 걸치면 어깨선이 정리됩니다. 베이지라 검정·회색 외투에 모두 어울립니다.",
    points: ["가로 65 x 세로 190 cm (술 포함)", "울 70% / 아크릴 30%", "드라이클리닝 권장"]
  },
  {
    id: 8,
    name: "골드 집게핀 헤어 클립",
    category: "패션소품",
    oldPrice: 38000,
    price: 30700,
    img: "https://images.unsplash.com/photo-1744177762258-c98418b7a4eb?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "머리를 한 번에 올려 고정하는 집게핀입니다. 이가 촘촘해 잔머리까지 잡히고, 스프링이 단단해 오래 두어도 흘러내리지 않습니다.",
    points: ["길이 10.5 cm", "황동에 골드 도금", "긴 머리·중간 길이 모두 사용 가능"]
  },
  {
    id: 9,
    name: "브라스 참 백 키링",
    category: "패션소품",
    oldPrice: 42000,
    price: 34000,
    img: "https://images.unsplash.com/photo-1678271248004-957a9d32197a?w=900",
    badge: "",
    big: false,
    hideOnAll: false,
    desc: "가방에 다는 황동 장식입니다. 무늬를 하나하나 새겨 넣어 두께감이 있고, 쓸수록 색이 깊어집니다. 열쇠고리로도 쓰실 수 있습니다.",
    points: ["장식 길이 7 cm / 무게 34g", "황동 (사용할수록 색이 변합니다)", "고리 포함"]
  },
  {
    id: 10,
    name: "소프트 레더 미니 숄더백",
    category: "가방",
    oldPrice: 138000,
    price: 111700,
    img: "https://images.unsplash.com/photo-1786872814428-1f0d8d685217?w=900",
    badge: "",
    big: false,
    hideOnAll: true,
    desc: "부드러운 가죽으로 만든 작은 숄더백입니다. 힘을 주지 않은 형태라 몸에 붙어 걸리적거리지 않습니다. 지갑과 휴대폰, 파우치 하나가 들어갑니다.",
    points: ["가로 24 x 세로 16 x 폭 8 cm", "소가죽 / 무게 380g", "스트랩 길이 조절 가능"]
  },
  {
    id: 11,
    name: "크로커다일 패턴 숄더백",
    category: "가방",
    oldPrice: 152000,
    price: 123100,
    img: "https://images.unsplash.com/photo-1713425886143-6ea8c776bf2d?w=900",
    badge: "",
    big: false,
    hideOnAll: true,
    desc: "악어 무늬를 눌러 넣은 숄더백입니다. 무늬가 있어 단순한 형태인데도 밋밋해 보이지 않고, 각이 잡혀 있어 세워두어도 무너지지 않습니다.",
    points: ["가로 26 x 세로 28 x 폭 11 cm", "소가죽 (크로커다일 엠보싱)", "어깨끈·손잡이 두 가지"]
  },
  {
    id: 12,
    name: "핑크 진주 목걸이 세트",
    category: "주얼리",
    oldPrice: 118000,
    price: 95500,
    img: "https://images.unsplash.com/photo-1654699991494-892326ee8171?w=900",
    badge: "",
    big: false,
    hideOnAll: true,
    desc: "분홍빛이 도는 진주로 만든 목걸이와 귀걸이 세트입니다. 흰 진주보다 얼굴빛이 밝아 보여, 나이가 들수록 더 잘 어울립니다.",
    points: ["목걸이 45 cm + 귀걸이 한 쌍", "담수진주 7~8 mm", "선물 상자 포장"]
  },
  {
    id: 13,
    name: "진주 스터드 귀걸이",
    category: "주얼리",
    oldPrice: 62000,
    price: 50200,
    img: "https://images.unsplash.com/photo-1623303179820-de8ec58b03dc?w=900",
    badge: "",
    big: false,
    hideOnAll: true,
    desc: "귀에 붙는 알 진주 귀걸이입니다. 매일 착용해도 부담이 없고, 어떤 옷에도 어울려 처음 사는 진주로 많이 고르십니다.",
    points: ["진주 8 mm", "은침 (알레르기 완화)", "한 쌍"]
  }
];


/* ===== 2) 저장 기능 ===== */
/* 브라우저에 값을 저장하는 이름표들 */
var WISH_KEY   = "pinkholic_wish";     // 찜한 상품
var CART_KEY   = "pinkholic_cart";     // 장바구니
var MEMBER_KEY = "pinkholic_member";   // 가입한 회원 정보
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
function getWish()          { return loadData(WISH_KEY, []); }   // 찜한 상품 번호 목록
function setWish(list)      { saveData(WISH_KEY, list); }
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
/* 장바구니는 [{id: 상품번호, count: 수량}] 모양으로 저장합니다. */
function getCart()     { return loadData(CART_KEY, []); }
function setCart(list) { saveData(CART_KEY, list); }

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

/* --- 회원 / 로그인 --- */
function getMember()      { return loadData(MEMBER_KEY, null); }
function setMember(m)     { saveData(MEMBER_KEY, m); }
function getLoginUser()   { return loadData(LOGIN_KEY, null); }
function setLoginUser(u)  { saveData(LOGIN_KEY, u); }
function logout() {
  saveData(LOGIN_KEY, null);
  alert("로그아웃되었습니다.");
  location.href = "index.html";
}

/* 비밀번호를 그대로 저장하지 않기 위해 숫자로 바꿔 둡니다.
   ※ 연습용입니다. 브라우저 안에서만 확인하므로 실제 보안 수단이 아닙니다.
      실제 서비스는 서버에서 검사해야 합니다.                        */
function hashPassword(text) {
  var number = 5381;
  for (var i = 0; i < text.length; i++) {
    number = ((number * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return number.toString(16);
}


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
    if (joinLink) {
      joinLink.style.display = "none";   // 로그인 중에는 회원가입을 숨깁니다.
    }
  }
}

function showAlert() {
  alert("준비 중입니다. 조금만 기다려 주세요.");
}
