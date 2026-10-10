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
    if (res.data.session) {
      setLoginUser(toLoginUser(user));
    }
    done({ needConfirm: !res.data.session });
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
    done(user);
  }, function () {
    done(null, NETWORK_ERROR.text);
  });
}

/* 로그아웃 */
function logout() {
  setLoginUser(null);

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

/* 화면을 열 때 Supabase의 로그인 상태와 맞춥니다.
   (다른 곳에서 로그아웃했거나 로그인이 만료된 경우를 반영합니다.) */
function syncLogin() {
  if (!sb) {
    return;
  }

  sb.auth.getSession().then(function (res) {
    var session = res.data.session;
    var saved = getLoginUser();
    var now = session ? toLoginUser(session.user) : null;

    setLoginUser(now);

    // 로그인 여부가 바뀌었으면 화면을 새로 그립니다.
    if ((saved ? true : false) !== (now ? true : false)) {
      location.reload();
    }
  });
}

syncLogin();
