inventory - Variant CRUD


GET
/inventory/variants/
상품 상세 목록 조회
inventory_variants_list

POST : 상품 상세 추가
GET : 쿼리 파라미터 기반 Product Variant 조회

Parameters
Try it out
Name	Description
ordering
string
(query)
정렬 필드 (-price, stock 등)

ordering
stock_lt
integer
(query)
재고 수량 미만

stock_lt
stock_gt
integer
(query)
재고 수량 초과

stock_gt
sales_min
integer
(query)
최소 매출

sales_min
sales_max
integer
(query)
최대 매출

sales_max
page
integer
(query)
페이지 번호 (default = 1)

page
product_name
string
(query)
상품명 검색 (부분일치)

product_name
category
string
(query)
상품 카테고리 (부분일치)

category
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[ProductVariant{
product_id	Product idstring
title: Product id
readOnly: true
minLength: 1
name	Namestring
title: Name
readOnly: true
category	Categorystring
title: Category
readOnly: true
variant_code*	Variant codestring
title: Variant code
maxLength: 50
minLength: 1
option*	Optionstring
title: Option
maxLength: 255
minLength: 1
stock	Stockinteger
title: Stock
readOnly: true
price	Priceinteger
title: Price
maximum: 2147483647
minimum: 0
min_stock	Min stockinteger
title: Min stock
maximum: 2147483647
minimum: 0
description	Descriptionstring
title: Description
memo	Memostring
title: Memo
cost_price	Cost pricestring
title: Cost price
readOnly: true
order_count	Order countinteger
title: Order count
maximum: 2147483647
minimum: 0
return_count	Return countinteger
title: Return count
maximum: 2147483647
minimum: 0
sales	Salesstring
title: Sales
readOnly: true
suppliers	Suppliersstring
title: Suppliers
readOnly: true
 
}]

POST
/inventory/variants/
상품 상세 정보 생성 (방패 필통 크림슨)
inventory_variants_create

기존 product_id가 있으면 연결하고, 없으면 새로 생성한 뒤 variant_code 자동 생성

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
상품 식별자

name*	string
example: 방패 필통
상품명

category	string
example: 문구
상품 카테고리

option	string
example: 색상 : 크림슨
옵션

stock	integer
example: 100
초기 재고

price	integer
example: 5900
판매가

min_stock	integer
example: 5
최소 재고

description	string
example: 튼튼한 크림슨 컬러 방패 필통
설명

memo	string
example: 23FW 신상품
메모

suppliers	[
공급자 매핑 목록

{
name*	[...]
cost_price*	[...]
is_primary*	[...]
 
}]
 
}
example: OrderedMap { "product_id": "P00000YC", "name": "방패 필통", "category": "문구", "option": "색상 : 크림슨", "stock": 100, "price": 5900, "min_stock": 5, "description": "튼튼한 크림슨 컬러 방패 필통", "memo": "23FW 신상품", "suppliers": List [ OrderedMap { "name": "넥스트물류", "cost_price": 3016, "is_primary": true } ] }
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
name	string
title: Name
readOnly: true
category	string
title: Category
readOnly: true
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
memo	string
title: Memo
cost_price	string
title: Cost price
readOnly: true
order_count	integer
title: Order count
maximum: 2147483647
minimum: 0
return_count	integer
title: Return count
maximum: 2147483647
minimum: 0
sales	string
title: Sales
readOnly: true
suppliers	string
title: Suppliers
readOnly: true
 
}
400	
Bad Request


GET
/inventory/variants/export/
전체 상품 상세 정보 Export (엑셀용)
inventory_variants_export_list

Parameters
Try it out
Name	Description
ordering
string
(query)
ordering
stock_lt
integer
(query)
stock_lt
stock_gt
integer
(query)
stock_gt
sales_min
integer
(query)
sales_min
sales_max
integer
(query)
sales_max
product_name
string
(query)
product_name
category
string
(query)
category
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[ProductVariant{
product_id	Product idstring
title: Product id
readOnly: true
minLength: 1
name	Namestring
title: Name
readOnly: true
category	Categorystring
title: Category
readOnly: true
variant_code*	Variant codestring
title: Variant code
maxLength: 50
minLength: 1
option*	Optionstring
title: Option
maxLength: 255
minLength: 1
stock	Stockinteger
title: Stock
readOnly: true
price	Priceinteger
title: Price
maximum: 2147483647
minimum: 0
min_stock	Min stockinteger
title: Min stock
maximum: 2147483647
minimum: 0
description	Descriptionstring
title: Description
memo	Memostring
title: Memo
cost_price	Cost pricestring
title: Cost price
readOnly: true
order_count	Order countinteger
title: Order count
maximum: 2147483647
minimum: 0
return_count	Return countinteger
title: Return count
maximum: 2147483647
minimum: 0
sales	Salesstring
title: Sales
readOnly: true
suppliers	Suppliersstring
title: Suppliers
readOnly: true
 
}]

GET
/inventory/variants/{variant_code}/
세부 품목 정보 조회 (방패필통 크림슨)
inventory_variants_read

GET / PATCH / DELETE: 특정 상품의 상세 정보 접근

Parameters
Try it out
Name	Description
variant_code *
string
(path)
조회할 variant_code (예: P00000XN000A)

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
name	string
title: Name
readOnly: true
category	string
title: Category
readOnly: true
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
memo	string
title: Memo
cost_price	string
title: Cost price
readOnly: true
order_count	integer
title: Order count
maximum: 2147483647
minimum: 0
return_count	integer
title: Return count
maximum: 2147483647
minimum: 0
sales	string
title: Sales
readOnly: true
suppliers	string
title: Suppliers
readOnly: true
 
}
404	
Not Found


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
suppliers	[{
name	[...]
cost_price	[...]
is_primary	[...]
 
}]
 
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
name	string
title: Name
readOnly: true
category	string
title: Category
readOnly: true
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
memo	string
title: Memo
cost_price	string
title: Cost price
readOnly: true
order_count	integer
title: Order count
maximum: 2147483647
minimum: 0
return_count	integer
title: Return count
maximum: 2147483647
minimum: 0
sales	string
title: Sales
readOnly: true
suppliers	string
title: Suppliers
readOnly: true
 
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