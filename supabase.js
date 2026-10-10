/* ============================================================
   핑크홀릭 - Supabase 연결 (회원가입 / 로그인 / 로그아웃)

   회원 정보와 비밀번호는 Supabase에 저장됩니다.
   아래 키는 브라우저에 공개해도 되는 publishable 키입니다.
   (secret 키는 절대 이 파일에 넣지 마세요.)

   이 파일은 products.js 다음에 불러와야 합니다.
   ============================================================ */

var SUPABASE_URL = "https://pqjhxwtzjmyeuerstmzk.supabase.co";
var SUPABASE_KEY = "sb_publishable_le5X-s1XvSkuw5wfX3q1Cg_xgtn_3r6";

/* Supabase 도구를 불러오지 못해도 화면은 정상 동작하도록 null 로 둡니다. */
var sb = null;
try {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  sb = null;
}

/* Supabase 회원 정보를 화면에서 쓰기 좋은 모양으로 바꿉니다. */
function toLoginUser(user) {
  var info = user.user_metadata || {};
  return {
    email: user.email,
    name: info.name || "",
    phone: info.phone || "",
    joinedAt: new Date(user.created_at).toLocaleDateString("ko-KR")
  };
}

/* Supabase 오류를 한국어 문구로 바꿉니다.
   field 는 문구를 보여줄 칸입니다. ("email" 또는 "pw")
   모르는 오류도 영어 그대로 보여주지 않고 한국어 안내를 돌려줍니다. */
var NETWORK_ERROR = { text: "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.", field: "email" };

function koreanError(error) {
  var code = error.code || "";

  if (code === "user_already_exists" || code === "email_exists") {
    return { text: "이미 가입된 이메일입니다. 로그인해 주세요.", field: "email" };
  }
  if (code === "email_address_invalid") {
    return { text: "사용할 수 없는 이메일 주소입니다. 다른 이메일을 입력해 주세요.", field: "email" };
  }
  if (code === "weak_password") {
    return { text: "비밀번호가 너무 쉽습니다. 더 길고 다양한 글자로 만들어 주세요.", field: "pw" };
  }
  if (code === "invalid_credentials") {
    return { text: "이메일 또는 비밀번호가 맞지 않습니다.", field: "pw" };
  }
  if (code === "email_not_confirmed") {
    return { text: "이메일 인증이 아직 안 되었습니다. 메일함의 인증 링크를 눌러 주세요.", field: "pw" };
  }
  if (code === "over_email_send_rate_limit") {
    return { text: "가입 신청이 몰려 인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", field: "email" };
  }
  if (code === "over_request_rate_limit") {
    return { text: "시도가 너무 많았습니다. 잠시 후 다시 시도해 주세요.", field: "pw" };
  }
  if (code === "signup_disabled" || code === "email_provider_disabled") {
    return { text: "지금은 회원가입을 받지 않고 있습니다. 고객센터로 문의해 주세요.", field: "email" };
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return NETWORK_ERROR;
  }
  return { text: "처리 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.", field: "email" };
}

/* 회원가입 : 성공하면 done(결과), 실패하면 done(null, 오류 문구, 칸) */
function signUp(email, pw, name, phone, done) {
  if (!sb) {
    done(null, NETWORK_ERROR.text, NETWORK_ERROR.field);
    return;
  }

  // 인증 메일의 링크를 누르면 로그인 화면으로 돌아오게 합니다.
  var backTo = location.href.replace(/join\.html.*$/, "login.html");

  sb.auth.signUp({
    email: email,
    password: pw,
    options: {
      data: { name: name, phone: phone },
      emailRedirectTo: backTo
    }
  }).then(function (res) {
    if (res.error) {
      var err = koreanError(res.error);
      done(null, err.text, err.field);
      return;
    }
    // 이미 가입된 이메일이면 Supabase가 빈 회원 정보를 돌려줍니다.
    var user = res.data.user;
    if (user && user.identities && user.identities.length === 0) {
      done(null, "이미 가입된 이메일입니다. 로그인해 주세요.", "email");
      return;
    }
    // 메일 인증 없이 바로 가입되는 설정이면 곧바로 로그인 상태가 됩니다.
    // 로그인 전에 담아둔 장바구니와 찜도 회원 것으로 옮깁니다.
    if (res.data.session) {
      setLoginUser(toLoginUser(user));
      pullAll(true, function () {
        done({ needConfirm: false });
      });
      return;
    }
    done({ needConfirm: true });
  }, function () {
    done(null, NETWORK_ERROR.text, NETWORK_ERROR.field);
  });
}

/* 로그인 : 성공하면 done(회원), 실패하면 done(null, 오류 문구) */
function signIn(email, pw, done) {
  if (!sb) {
    done(null, NETWORK_ERROR.text);
    return;
  }

  sb.auth.signInWithPassword({ email: email, password: pw }).then(function (res) {
    if (res.error) {
      done(null, koreanError(res.error).text);
      return;
    }
    var user = toLoginUser(res.data.user);
    setLoginUser(user);

    // 로그인 전에 담아둔 장바구니와 찜을 회원 것에 합친 뒤 끝냅니다.
    pullAll(true, function () {
      done(user);
    });
  }, function () {
    done(null, NETWORK_ERROR.text);
  });
}

/* 로그아웃 */
function logout() {
  setLoginUser(null);

  // 회원 장바구니와 찜은 Supabase 에 남아 있으므로, 이 브라우저에서는 비웁니다.
  // (같은 컴퓨터를 쓰는 다음 사람에게 보이지 않게 합니다.)
  clearMemberData();

  function finish() {
    alert("로그아웃되었습니다.");
    location.href = "index.html";
  }

  if (sb) {
    sb.auth.signOut().then(finish, finish);
  } else {
    finish();
  }
}

/* 상품 목록을 Supabase 의 products 표에서 불러와 PRODUCTS 에 채웁니다.
   다 불러오면 done(true), 불러오지 못하면 done(false) 를 부릅니다. */
function loadProducts(done) {
  if (!sb) {
    done(false);
    return;
  }

  sb.from("products").select("*").order("sort_order").then(function (res) {
    if (res.error || !res.data) {
      done(false);
      return;
    }

    PRODUCTS = [];
    for (var i = 0; i < res.data.length; i++) {
      var row = res.data[i];
      PRODUCTS.push({
        id: row.id,
        name: row.name,
        category: row.category,
        oldPrice: row.old_price,
        price: row.price,
        img: row.img,
        badge: row.badge || "",
        big: row.big,
        hideOnAll: row.hide_on_all,
        desc: row.description,
        points: row.points || []
      });
    }
    done(true);
  }, function () {
    done(false);
  });
}

/* ===== 주문 =====
   주문은 Supabase 의 place_order 함수가 저장합니다.
   (금액은 함수가 상품 표의 가격으로 다시 계산합니다.) */

/* 이 시간 안에 Supabase 가 답하지 않으면 기다리기를 멈추고 다시 누르라고 안내합니다. */
var ORDER_TIMEOUT = 20000;   // 20초

/* 주문하기 : 장바구니로 주문을 저장합니다.
   ship 모양 : {name, phone, address, memo, requestId}
   requestId 는 중복 방지 번호입니다. 같은 번호로 다시 보내면 새로 저장하지 않고 그 주문 번호를 돌려받습니다.
   성공하면 done(주문번호), 실패하면 done(null, 오류 문구) — 무슨 일이 있어도 done 은 꼭 한 번 부릅니다. */
function placeOrder(ship, done) {
  if (!sb) {
    done(null, NETWORK_ERROR.text);
    return;
  }

  var finished = false;
  function finish(orderNo, errorText) {
    if (finished) {
      return;   // 시간이 지나 이미 안내한 뒤에 늦게 온 답은 무시합니다. (다시 누르면 같은 주문 번호를 받습니다)
    }
    finished = true;
    clearTimeout(timer);
    done(orderNo, errorText);
  }

  var timer = setTimeout(function () {
    finish(null, "응답이 늦어지고 있습니다. 잠시 후 주문하기를 다시 눌러 주세요.\n(다시 눌러도 같은 주문이 두 번 들어가지 않습니다.)");
  }, ORDER_TIMEOUT);

  try {
    sb.rpc("place_order", {
      items: orderableCart(),
      ship_name: ship.name,
      ship_phone: ship.phone,
      ship_address: ship.address,
      ship_memo: ship.memo,
      order_request: ship.requestId
    }).then(function (res) {
      if (res.error) {
        // place_order 가 알려준 이유(한국어)는 그대로, 그 밖의 오류는 한국어 안내로 바꿉니다.
        finish(null, res.error.code === "P0001" ? res.error.message : "주문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // Supabase 장바구니는 함수가 비웠으니 이 브라우저의 장바구니도 비웁니다.
      saveData(CART_KEY, []);
      saveData(SYNC.cart.dirtyKey, false);
      finish(res.data);
    }, function () {
      finish(null, NETWORK_ERROR.text);
    });
  } catch (e) {
    finish(null, "주문을 저장하지 못했습니다. 새로고침한 뒤 다시 시도해 주세요.");
  }
}

/* 주문 번호로 주문 하나를 불러옵니다. (본인 주문만 볼 수 있습니다)
   성공하면 done(주문), 없거나 실패하면 done(null) */
function loadOrder(orderNo, done) {
  if (!sb) {
    done(null);
    return;
  }

  sb.from("orders").select("*, order_items(*)").eq("order_no", orderNo).maybeSingle().then(function (res) {
    done(res.error ? null : res.data);
  }, function () {
    done(null);
  });
}

/* ===== 장바구니와 찜 (로그인한 회원은 Supabase 에 저장) =====
   화면에서는 지금처럼 브라우저에 저장된 장바구니와 찜을 씁니다.
   로그인한 회원이면 바뀔 때마다 Supabase 에도 저장하고,
   화면을 열 때 Supabase 에서 불러와 브라우저와 맞춥니다.

   dirtyKey : Supabase 에 아직 저장되지 않은 변경이 있는지.
   (담자마자 다른 화면으로 넘어가 저장이 끊긴 경우, 다음 화면에서 마저 저장합니다.) */
var SYNC = {
  // 장바구니 : [{id: 상품번호, count: 수량}]
  cart: {
    key: CART_KEY,
    dirtyKey: "pinkholic_cart_dirty",
    table: "cart_items",
    columns: "product_id, count",
    save: "set_cart",
    fromRows: function (rows) {
      var list = [];
      for (var i = 0; i < rows.length; i++) {
        list.push({ id: rows[i].product_id, count: rows[i].count });
      }
      return list;
    },
    // 같은 상품이 양쪽에 있으면 수량이 많은 쪽을 남깁니다.
    merge: function (first, second) {
      var result = first.slice();
      for (var i = 0; i < second.length; i++) {
        var found = false;
        for (var j = 0; j < result.length; j++) {
          if (result[j].id === second[i].id) {
            result[j] = { id: result[j].id, count: Math.max(result[j].count, second[i].count) };
            found = true;
          }
        }
        if (!found) {
          result.push(second[i]);
        }
      }
      return result;
    }
  },

  // 찜 : [상품번호, 상품번호, ...]
  wish: {
    key: WISH_KEY,
    dirtyKey: "pinkholic_wish_dirty",
    table: "wishes",
    columns: "product_id",
    save: "set_wish",
    fromRows: function (rows) {
      var list = [];
      for (var i = 0; i < rows.length; i++) {
        list.push(rows[i].product_id);
      }
      return list;
    },
    // 양쪽에 찜한 상품을 모두 남깁니다.
    merge: function (first, second) {
      var result = first.slice();
      for (var i = 0; i < second.length; i++) {
        if (result.indexOf(second[i]) === -1) {
          result.push(second[i]);
        }
      }
      return result;
    }
  }
};

/* 저장 요청은 한 번에 하나씩만 보냅니다.
   (빠르게 여러 번 누르면 요청이 뒤바뀌어 도착해 예전 상태가 남을 수 있기 때문입니다.)
   보내는 중에 또 바뀌면, 끝난 뒤 마지막 상태를 한 번 더 보냅니다. */
var saving = {};    // 지금 보내는 중인지
var waiting = {};   // 보내는 동안 또 바뀌었는지

/* products.js 의 setCart / setWish 가 바뀔 때마다 부릅니다. kind 는 "cart" 또는 "wish" */
function saveToServer(kind, list) {
  if (!sb || !getLoginUser()) {
    return;
  }
  var s = SYNC[kind];
  saveData(s.dirtyKey, true);

  if (saving[kind]) {
    waiting[kind] = true;
    return;
  }
  saving[kind] = true;

  function next(saved) {
    saving[kind] = false;
    if (waiting[kind]) {
      waiting[kind] = false;
      saveToServer(kind, loadData(s.key, []));
    } else if (saved) {
      saveData(s.dirtyKey, false);
    }
    // 저장하지 못했으면 dirty 로 남겨 두어 다음에 화면을 열 때 다시 저장합니다.
  }

  sb.rpc(s.save, { items: list }).then(function (res) {
    next(!res.error);
  }, function () {
    next(false);
  });
}

/* Supabase 에서 불러와 브라우저와 맞춥니다.
   merge 가 true 이면 (로그인할 때) 브라우저에 있던 것을 회원 것에 합칩니다.
   끝나면 done(바뀌었는지) 를 부릅니다. */
function pullFromServer(kind, merge, done) {
  var s = SYNC[kind];
  var local = loadData(s.key, []);

  // 저장이 끊긴 변경이 있으면 브라우저 쪽이 최신이므로 Supabase 에 마저 저장합니다.
  if (!merge && loadData(s.dirtyKey, false)) {
    saveToServer(kind, local);
    done(false);
    return;
  }

  sb.from(s.table).select(s.columns).order("position").then(function (res) {
    if (res.error || !res.data) {
      done(false);
      return;
    }

    var server = s.fromRows(res.data);
    var result = merge ? s.merge(server, local) : server;
    var changed = JSON.stringify(result) !== JSON.stringify(local);

    saveData(s.key, result);
    // 합쳤으면 합친 것을 Supabase 에 저장한 뒤 끝냅니다.
    if (merge && JSON.stringify(result) !== JSON.stringify(server)) {
      saveData(s.dirtyKey, true);
      sb.rpc(s.save, { items: result }).then(function (r) {
        if (!r.error) {
          saveData(s.dirtyKey, false);
        }
        done(changed);
      }, function () {
        done(changed);
      });
      return;
    }
    done(changed);
  }, function () {
    done(false);
  });
}

/* 장바구니와 찜을 모두 맞춘 뒤 done(하나라도 바뀌었는지) 를 부릅니다. */
function pullAll(merge, done) {
  pullFromServer("cart", merge, function (cartChanged) {
    pullFromServer("wish", merge, function (wishChanged) {
      done(cartChanged || wishChanged);
    });
  });
}

/* 이 브라우저에 남은 회원 장바구니와 찜을 비웁니다. */
function clearMemberData() {
  for (var kind in SYNC) {
    saveData(SYNC[kind].key, []);
    saveData(SYNC[kind].dirtyKey, false);
  }
}

/* 화면을 열 때 Supabase의 로그인 상태와 장바구니·찜을 맞춥니다.
   (다른 곳에서 로그아웃했거나, 다른 기기에서 바꾼 경우를 반영합니다.) */
function syncLogin() {
  if (!sb) {
    return;
  }

  sb.auth.getSession().then(function (res) {
    var session = res.data.session;
    var saved = getLoginUser();
    var now = session ? toLoginUser(session.user) : null;

    setLoginUser(now);

    // 로그인이 풀렸으면 회원 장바구니와 찜을 이 브라우저에서 비웁니다.
    if (saved && !now) {
      clearMemberData();
    }

    // 로그인 여부가 바뀌었으면 화면을 새로 그립니다.
    if ((saved ? true : false) !== (now ? true : false)) {
      location.reload();
      return;
    }

    // 로그인한 회원이면 Supabase 에서 불러오고, 달라졌으면 화면을 새로 그립니다.
    if (now) {
      pullAll(false, function (changed) {
        if (changed) {
          location.reload();
        }
      });
    }
  });
}

syncLogin();
