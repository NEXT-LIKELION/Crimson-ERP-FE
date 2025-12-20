orders


GET
/orders/
전체 주문 보기
orders_list

필터링, 정렬, 페이지네이션이 가능한 주문 리스트

Parameters
Try it out
Name	Description
ordering
string
(query)
정렬 필드 (order_date, expected_delivery_date)

ordering
product_name
string
(query)
상품명

product_name
supplier
string
(query)
공급업체 이름

supplier
status
string
(query)
주문 상태

status
start_date
string($date)
(query)
조회 시작일 (예: 2025-07-01)

start_date
end_date
string($date)
(query)
조회 종료일 (예: 2025-08-01)

end_date
page
integer
(query)
페이지 번호 (default: 1)

page
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[OrderCompact{
id	Idinteger
title: Id
readOnly: true
supplier	Supplierstring
title: Supplier
readOnly: true
minLength: 1
manager	Managerstring
title: Manager
readOnly: true
minLength: 1
status	Statusstring
title: Status
Enum:
Array [ 4 ]
note	Notestring
title: Note
x-nullable: true
order_date*	Order datestring($date)
title: Order date
expected_delivery_date	Expected delivery datestring($date)
title: Expected delivery date
readOnly: true
total_quantity	Total quantitystring
title: Total quantity
readOnly: true
total_price	Total pricestring
title: Total price
readOnly: true
product_names	Product namesstring
title: Product names
readOnly: true
 
}]

POST
/orders/
주문 생성하기
orders_create

주문을 생성합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
supplier*	integer
example: 1
manager_name*	string
example: 유시진
order_date*	string($date)
example: 2025-07-07
expected_delivery_date*	string($date)
example: 2025-07-09
status*	string
example: PENDING
instruction_note	string
example: 납품 전에 전화주세요
note	string
example: 발주 요청
vat_included	boolean
example: true
packaging_included	boolean
example: false
items*	[{
variant_code	[...]
quantity	[...]
unit_price	[...]
unit	[...]
remark	[...]
spec	[...]
 
}]
 
}
Responses
Response content type

application/json
Code	Description
201	
Example Value
Model
OrderRead{
id	integer
title: Id
readOnly: true
supplier	string
title: Supplier
readOnly: true
minLength: 1
manager	string
title: Manager
readOnly: true
minLength: 1
order_date*	string($date)
title: Order date
expected_delivery_date	string($date)
title: Expected delivery date
x-nullable: true
status	string
title: Status
Enum:
Array [ 4 ]
instruction_note	string
title: Instruction note
x-nullable: true
note	string
title: Note
x-nullable: true
created_at	string($date-time)
title: Created at
readOnly: true
vat_included	boolean
title: Vat included
packaging_included	boolean
title: Packaging included
items	[
readOnly: true
OrderItem{
id	ID[...]
variant_code	Variant code[...]
option	Option[...]
item_name	Item name[...]
quantity*	Quantity[...]
unit	Unit[...]
unit_price*	Unit price[...]
remark	Remark[...]
spec	Spec[...]
 
}]
 
}

GET
/orders/export/
전체 주문 Export (엑셀용)
orders_export_list

필터링/정렬은 유지하며 pagination 없이 모든 주문 데이터를 반환합니다.

Parameters
Try it out
Name	Description
ordering
string
(query)
ordering
product_name
string
(query)
product_name
supplier
string
(query)
supplier
status
string
(query)
status
start_date
string($date)
(query)
start_date
end_date
string($date)
(query)
end_date
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
[OrderCompact{
id	Idinteger
title: Id
readOnly: true
supplier	Supplierstring
title: Supplier
readOnly: true
minLength: 1
manager	Managerstring
title: Manager
readOnly: true
minLength: 1
status	Statusstring
title: Status
Enum:
Array [ 4 ]
note	Notestring
title: Note
x-nullable: true
order_date*	Order datestring($date)
title: Order date
expected_delivery_date	Expected delivery datestring($date)
title: Expected delivery date
readOnly: true
total_quantity	Total quantitystring
title: Total quantity
readOnly: true
total_price	Total pricestring
title: Total price
readOnly: true
product_names	Product namesstring
title: Product names
readOnly: true
 
}]

GET
/orders/{order_id}/
주문 상세 보기
orders_read

Retrieve detailed information about a specific order.

Parameters
Try it out
Name	Description
order_id *
string
(path)
order_id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
OrderRead{
id	integer
title: Id
readOnly: true
supplier	string
title: Supplier
readOnly: true
minLength: 1
manager	string
title: Manager
readOnly: true
minLength: 1
order_date*	string($date)
title: Order date
expected_delivery_date	string($date)
title: Expected delivery date
x-nullable: true
status	string
title: Status
Enum:
Array [ 4 ]
instruction_note	string
title: Instruction note
x-nullable: true
note	string
title: Note
x-nullable: true
created_at	string($date-time)
title: Created at
readOnly: true
vat_included	boolean
title: Vat included
packaging_included	boolean
title: Packaging included
items	[
readOnly: true
OrderItem{
id	ID[...]
variant_code	Variant code[...]
option	Option[...]
item_name	Item name[...]
quantity*	Quantity[...]
unit	Unit[...]
unit_price*	Unit price[...]
remark	Remark[...]
spec	Spec[...]
 
}]
 
}
404	
Not Found


PATCH
/orders/{order_id}/
주문 상태 변경하기
orders_partial_update

Update the status of a specific order.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
status*	string
 
}
order_id *
string
(path)
order_id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
OrderRead{
id	integer
title: Id
readOnly: true
supplier	string
title: Supplier
readOnly: true
minLength: 1
manager	string
title: Manager
readOnly: true
minLength: 1
order_date*	string($date)
title: Order date
expected_delivery_date	string($date)
title: Expected delivery date
x-nullable: true
status	string
title: Status
Enum:
Array [ 4 ]
instruction_note	string
title: Instruction note
x-nullable: true
note	string
title: Note
x-nullable: true
created_at	string($date-time)
title: Created at
readOnly: true
vat_included	boolean
title: Vat included
packaging_included	boolean
title: Packaging included
items	[
readOnly: true
OrderItem{
id	ID[...]
variant_code	Variant code[...]
option	Option[...]
item_name	Item name[...]
quantity*	Quantity[...]
unit	Unit[...]
unit_price*	Unit price[...]
remark	Remark[...]
spec	Spec[...]
 
}]
 
}
400	
Bad Request

404	
Not Found


DELETE
/orders/{order_id}/
주문 삭제하기
orders_delete

Delete a specific order by its ID.

Parameters
Try it out
Name	Description
order_id *
string
(path)
order_id
Responses
Response content type

application/json
Code	Description
204	
No Content

404	
Not Found