inventory - Variant Status (엑셀 행 하나)


GET
/inventory/variant-status/
재고 현황 확인
inventory_variant-status_list

Parameters
Try it out
Name	Description
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
adjustment_quantity	Adjustment quantity[...]
adjustment_status	Adjustment status[...]
ending_stock	Ending stock[...]
 
}]
 
}

PATCH
/inventory/variant-status/{year}/{month}/{variant_code}/
월별 재고 현황 수정 (셀 단위)
inventory_variant-status_partial_update

엑셀 화면에서 관리자 수동 수정용 PATCH API

year / month / variant_code로 대상 식별
월초재고, 입고, 판매량만 수정 가능
Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
warehouse_stock_start	integer
example: 120
store_stock_start	integer
example: 30
inbound_quantity	integer
example: 50
store_sales	integer
example: 20
online_sales	integer
example: 10
 
}
example: OrderedMap { "inbound_quantity": 40, "store_sales": 18, "online_sales": 12 }
year *
integer
(path)
연도 (예: 2025)

year
month *
integer
(path)
월 (1~12)

month
variant_code *
string
(path)
상품 variant_code (예: P00000YC000A)

variant_code
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
ProductVariantStatus{
year*	integer
title: Year
maximum: 2147483647
minimum: -2147483648
month*	integer
title: Month
maximum: 2147483647
minimum: -2147483648
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
description	string
title: Description
readOnly: true
minLength: 1
online_name	string
title: Online name
readOnly: true
minLength: 1
offline_name	string
title: Offline name
readOnly: true
minLength: 1
option	string
title: Option
readOnly: true
minLength: 1
detail_option	string
title: Detail option
readOnly: true
minLength: 1
product_code	string
title: Product code
readOnly: true
minLength: 1
variant_code	string
title: Variant code
readOnly: true
minLength: 1
warehouse_stock_start	integer
title: Warehouse stock start
maximum: 2147483647
minimum: -2147483648
store_stock_start	integer
title: Store stock start
maximum: 2147483647
minimum: -2147483648
initial_stock	string
title: Initial stock
readOnly: true
inbound_quantity	integer
title: Inbound quantity
maximum: 2147483647
minimum: -2147483648
store_sales	integer
title: Store sales
maximum: 2147483647
minimum: -2147483648
online_sales	integer
title: Online sales
maximum: 2147483647
minimum: -2147483648
total_sales	string
title: Total sales
readOnly: true
adjustment_quantity	string
title: Adjustment quantity
readOnly: true
adjustment_status	string
title: Adjustment status
readOnly: true
ending_stock	string
title: Ending stock
readOnly: true
 
}
400	
Invalid field

404	
Not Found