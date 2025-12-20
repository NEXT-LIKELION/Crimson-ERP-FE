inventory - Variant CRUD


POST
/inventory/variants/
상품 상세 정보 생성
inventory_variants_create

상품 상세(SKU) 생성 API

product_id 기준으로 상품(InventoryItem)을 조회/생성
Product 필드와 Variant 필드를 동시에 입력 가능
옵션/상세옵션 기반으로 variant_code(SKU)는 자동 생성됨
Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
product_id*	string
example: P00000YC
상품 식별자 (Product ID)

name*	string
example: 방패 필통
오프라인 상품명

online_name	string
example: 방패 필통 온라인
온라인 상품명

category	string
example: 문구
카테고리

big_category	string
example: STORE
대분류

middle_category	string
example: FASHION
중분류

option	string
example: 화이트
옵션 (예: 색상)

detail_option	string
example: M
상세 옵션 (예: 사이즈)

stock	integer
example: 100
초기 재고 (기말 재고)

price	integer
example: 5900
판매가

min_stock	integer
example: 5
최소 재고 알림 기준

description	string
example: 튼튼한 방패 필통
상품 설명

memo	string
example: 23FW 신상품
메모

channels	[
example: List [ "online", "offline" ]
판매 채널

string]
 
}
example: OrderedMap { "product_id": "P00000YC", "name": "방패 필통", "online_name": "방패 필통 온라인", "big_category": "STORE", "middle_category": "FASHION", "category": "문구", "option": "화이트", "detail_option": "M", "stock": 100, "price": 5900, "min_stock": 5, "description": "튼튼한 방패 필통", "memo": "23FW 신상품", "channels": List [ "online", "offline" ] }
Responses
Response content type

application/json
Code	Description
201	
Example Value
Model
ProductVariant{
product_id	string
title: Product id
readOnly: true
minLength: 1
offline_name	string
title: Offline name
readOnly: true
minLength: 1
online_name	string
title: Online name
readOnly: true
minLength: 1
big_category	string
title: Big category
readOnly: true
minLength: 1
middle_category	string
title: Middle category
readOnly: true
minLength: 1
category	string
title: Category
readOnly: true
minLength: 1
variant_code*	string
title: Variant code
maxLength: 50
minLength: 1
option*	string
title: Option
maxLength: 255
minLength: 1
stock	integer
title: Stock
readOnly: true
price	integer
title: Price
maximum: 2147483647
minimum: 0
min_stock	integer
title: Min stock
maximum: 2147483647
minimum: 0
description	string
title: Description
readOnly: true
minLength: 1
memo	string
title: Memo
channels	[
readOnly: true
string
minLength: 1]
 
}
400	
Bad Request


PATCH
/inventory/variants/{variant_code}/
세부 품목 정보 수정 (방패필통 크림슨)
inventory_variants_partial_update

GET / PATCH / DELETE: 특정 상품의 상세 정보 접근

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
product_id*	string
example: P00000YC
name*	string
example: 방패 필통
option*	string
example: 색상 : 크림슨
price*	integer
example: 5000
min_stock	integer
example: 4
description	string
example:
memo	string
example:
 
}
variant_code *
string
(path)
수정할 variant_code (예: P00000YC000A)

variant_code
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
ProductVariant{
product_id	string
title: Product id
readOnly: true
minLength: 1
offline_name	string
title: Offline name
readOnly: true
minLength: 1
online_name	string
title: Online name
readOnly: true
minLength: 1
big_category	string
title: Big category
readOnly: true
minLength: 1
middle_category	string
title: Middle category
readOnly: true
minLength: 1
category	string
title: Category
readOnly: true
minLength: 1
variant_code*	string
title: Variant code
maxLength: 50
minLength: 1
option*	string
title: Option
maxLength: 255
minLength: 1
stock	integer
title: Stock
readOnly: true
price	integer
title: Price
maximum: 2147483647
minimum: 0
min_stock	integer
title: Min stock
maximum: 2147483647
minimum: 0
description	string
title: Description
readOnly: true
minLength: 1
memo	string
title: Memo
channels	[
readOnly: true
string
minLength: 1]
 
}
400	
Bad Request

404	
Not Found


DELETE
/inventory/variants/{variant_code}/
세부 품목 정보 삭제 (방패필통 크림슨)
inventory_variants_delete

GET / PATCH / DELETE: 특정 상품의 상세 정보 접근

Parameters
Try it out
Name	Description
variant_code *
string
(path)
삭제할 variant_code (예: P00000XN000A)

variant_code
Responses
Response content type

application/json
Code	Description
204	
삭제 완료

404	
Not Found