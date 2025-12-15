supplier

GET /supplier/ 공급업체 목록 조회 supplier_list

Parameters Try it out No parameters

Responses Response content type

application/json Code Description 200 Example Value Model [Supplier{ id IDinteger title: ID
readOnly: true name\* Namestring title: Name maxLength: 100 minLength: 1 contact Contactstring
title: Contact maxLength: 50 x-nullable: true manager Managerstring title: Manager maxLength: 50
x-nullable: true email Emailstring($email) title: Email maxLength: 254 x-nullable: true address
Addressstring title: Address maxLength: 255 x-nullable: true

}]

POST /supplier/ 공급업체 등록 supplier_create

Parameters Try it out Name Description data _ object (body) Example Value Model Supplier{ name_
string title: Name maxLength: 100 minLength: 1 contact string title: Contact maxLength: 50
x-nullable: true manager string title: Manager maxLength: 50 x-nullable: true email string($email)
title: Email maxLength: 254 x-nullable: true address string title: Address maxLength: 255
x-nullable: true

} Responses Response content type

application/json Code Description 201 Example Value Model Supplier{ id integer title: ID readOnly:
true name\* string title: Name maxLength: 100 minLength: 1 contact string title: Contact maxLength:
50 x-nullable: true manager string title: Manager maxLength: 50 x-nullable: true email
string($email) title: Email maxLength: 254 x-nullable: true address string title: Address maxLength:
255 x-nullable: true

}

GET /supplier/{id}/ 공급업체 상세 조회 supplier_read

Parameters Try it out Name Description id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model Supplier{ id integer title: ID readOnly:
true name\* string title: Name maxLength: 100 minLength: 1 contact string title: Contact maxLength:
50 x-nullable: true manager string title: Manager maxLength: 50 x-nullable: true email
string($email) title: Email maxLength: 254 x-nullable: true address string title: Address maxLength:
255 x-nullable: true

}

PATCH /supplier/{id}/ 공급업체 정보 수정 supplier_partial_update

Parameters Try it out Name Description data _ object (body) Example Value Model SupplierOption{
name_ string title: Name maxLength: 100 minLength: 1 contact string title: Contact maxLength: 50
x-nullable: true manager string title: Manager maxLength: 50 x-nullable: true email string($email)
title: Email maxLength: 254 x-nullable: true address string title: Address maxLength: 255
x-nullable: true

} id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model Supplier{ id integer title: ID readOnly:
true name\* string title: Name maxLength: 100 minLength: 1 contact string title: Contact maxLength:
50 x-nullable: true manager string title: Manager maxLength: 50 x-nullable: true email
string($email) title: Email maxLength: 254 x-nullable: true address string title: Address maxLength:
255 x-nullable: true

}

GET /supplier/{id}/orders/ 공급업체별 발주 내역 상세 조회 supplier_orders_list

공급업체별로 발주(주문) 및 그 안의 품목, 가격, 수량 등의 세부 정보를 조회합니다.

Parameters Try it out Name Description id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model [SupplierOrder{ id Idinteger title: Id
readOnly: true order_date\* Order
datestring($date)
title: Order date
expected_delivery_date	Expected delivery datestring($date) title:
Expected delivery date x-nullable: true status Statusstring title: Status Enum: Array [ 4 ]
total_price Total pricestring title: Total price readOnly: true items [ readOnly: true
SupplierOrderItem{...}]

}]
