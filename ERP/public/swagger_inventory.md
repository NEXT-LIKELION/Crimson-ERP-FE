inventory


GET
/inventory/
상품 옵션 리스트 조회
inventory_list

상품 드롭다운용으로 product_id와 name만 간단히 반환합니다.

Parameters
Try it out
No parameters

Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[InventoryItemSummary{
id	IDinteger
title: ID
readOnly: true
product_id	Product idstring
title: Product id
maxLength: 50
minLength: 1
name	Namestring
title: Name
maxLength: 255
 
}]

GET
/inventory/category/
카테고리 목록 조회
inventory_category_list

InventoryItem에 등록된 카테고리 문자열의 고유 목록을 반환합니다.

Parameters
Try it out
No parameters

Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[
example: List [ "문구", "도서", "의류" ]
카테고리 이름 리스트

string]

GET
/inventory/variant-status/
inventory_variant-status_list

Parameters
Try it out
Name	Description
ordering
string
(query)
Which field to use when ordering the results.

ordering
page
integer
(query)
A page number within the paginated result set.

page
year *
integer
(query)
조회 연도 (예: 2025)

year
month *
integer
(query)
조회 월 (1~12)

month
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
{
count*	integer
next	string($uri)
x-nullable: true
previous	string($uri)
x-nullable: true
results*	[ProductVariantStatus{
year*	Year[...]
month*	Month[...]
big_category	Big category[...]
middle_category	Middle category[...]
category	Category[...]
description	Description[...]
online_name	Online name[...]
offline_name	Offline name[...]
option	Option[...]
detail_option	Detail option[...]
product_code	Product code[...]
variant_code	Variant code[...]
warehouse_stock_start	Warehouse stock start[...]
store_stock_start	Store stock start[...]
initial_stock	Initial stock[...]
inbound_quantity	Inbound quantity[...]
store_sales	Store sales[...]
online_sales	Online sales[...]
total_sales	Total sales[...]
stock_adjustment	Stock adjustment[...]
stock_adjustment_reason	Stock adjustment reason[...]
ending_stock	Ending stock[...]
 
}]
 
}

GET
/inventory/{product_id}/
특정 상품 상세 정보 조회 (방패필통)
inventory_read

product_id에 해당하는 상품의 기본 정보와 연결된 상세 상품 목록까지 함께 조회합니다.

Parameters
Try it out
Name	Description
product_id *
string
(path)
조회할 상품의 product_id (예: P00000YC)

product_id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
InventoryItemWithVariants{
product_id	string
title: Product id
maxLength: 50
minLength: 1
name	string
title: Name
maxLength: 255
variants	string
title: Variants
readOnly: true
 
}
404	
Not Found