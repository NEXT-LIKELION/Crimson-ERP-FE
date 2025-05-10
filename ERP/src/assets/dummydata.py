"""
generate_fixture.py  ── ERD v2용 더미(Fixture) 생성 스크립트
실행 :  python generate_fixture.py
결과 : fixtures/initial_data.json  생성
불러오기 : python manage.py loaddata fixtures/initial_data.json
"""
from __future__ import annotations
import json, random, pathlib
from datetime import datetime, timedelta
from faker import Faker
from hashlib import sha256

fake = Faker("ko_KR")
BASE_DIR  = pathlib.Path(__file__).resolve().parent
FIX_PATH  = BASE_DIR / "initial_data.json"
FIX_PATH.parent.mkdir(exist_ok=True)

fixture: list[dict] = []
seq = {k: 1 for k in
       ("sup", "prod", "var", "order", "sale", "alert", "user")}

def add(model: str, fields: dict, key: str):
    pk = seq[key];  seq[key] += 1
    fixture.append({"model": model, "pk": pk, "fields": fields})
    return pk

# ──────────────────────────────────────────────────────────────
# 1) auth_user  (ADMIN & MANAGER 2명 더미)
pwd_hash = lambda plain: f"sha256${sha256(plain.encode()).hexdigest()}"
users = [
    ("admin01", "ADMIN",   "010-1111-2222", "active"),
    ("manager1","MANAGER", "010-3333-4444", "inactive"),
]
for uname, role, phone, status in users:
    add(
        "auth.user",          # 기본 User 모델 커스텀이라면 앱라벨 수정
        {
            "username": uname,
            "password": pwd_hash("pass1234"),   # 실제 로그인용 비번 X
            "email": f"{uname}@test.com",
            "role": role,
            "contact": phone,
            "status": status,
            "is_superuser": role == "ADMIN",
            "is_staff": True,
            "is_active": True,
            "last_login": datetime.utcnow().isoformat(),
            "date_joined": datetime.utcnow().isoformat(),
        },
        "user",
    )

# 2) suppliers
supplier_ids = []
for _ in range(3):
    supplier_ids.append(
        add(
            "inventory.suppliers",
            {
                "name": fake.company(),
                "contact": fake.phone_number(),
                "address": fake.address()[:100],
                "email": fake.company_email(),
            },
            "sup",
        )
    )

# 3) products  & product_variants
product_ids, variant_ids = [], []
for i in range(8):
    pid = add(
        "inventory.products",
        {
            "product_code": f"P{1000+i}",
            "name": f"{fake.word().title()} 상품",
            "created_at": datetime.utcnow().isoformat(),
        },
        "prod",
    )
    product_ids.append(pid)

    for opt in ["A", "B"]:
        vid = add(
            "inventory.product_variants",
            {
                "product": pid,
                "variant_code": f"P{1000+i}-{opt}",
                "option": f"옵션-{opt}",
                "stock": random.randint(15, 120),
                "price": random.randint(5_000, 20_000),
                "created_at": datetime.utcnow().isoformat(),
            },
            "var",
        )
        variant_ids.append(vid)

# 4) orders  (status: PENDING / APPROVED / CANCELLED)
status_choices = ["PENDING", "APPROVED", "CANCELLED"]
for _ in range(20):
    add(
        "inventory.orders",
        {
            "variant": random.choice(variant_ids),
            "supplier": random.choice(supplier_ids),
            "quantity": random.randint(5, 60),
            "status": random.choice(status_choices),
            "order_date": (datetime.utcnow() -
                           timedelta(days=random.randint(0, 30))).isoformat(),
        },
        "order",
    )

# 5) sales
for _ in range(40):
    qty = random.randint(1, 6)
    vid = random.choice(variant_ids)
    v_price = next(
        row["fields"]["price"]
        for row in fixture
        if row["model"] == "inventory.product_variants" and row["pk"] == vid
    )
    add(
        "inventory.sales",
        {
            "variant": vid,
            "quantity": qty,
            "total_price": v_price * qty,
            "sale_date": (datetime.utcnow() -
                          timedelta(days=random.randint(0, 15))).isoformat(),
        },
        "sale",
    )

# 6) alerts (low-stock)
for vid in random.sample(variant_ids, 6):
    add(
        "inventory.alerts",
        {
            "variant": vid,
            "threshold": 10,
            "alert_date": datetime.utcnow().isoformat(),
            "resolved": False,
        },
        "alert",
    )

# ──────────────────────────────────────────────────────────────
FIX_PATH.write_text(json.dumps(fixture, indent=2, ensure_ascii=False))
print(f"✅  {len(fixture):,}개의 객체 → {FIX_PATH.relative_to(BASE_DIR)} 저장 완료")
