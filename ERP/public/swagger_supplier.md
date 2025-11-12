supplier

GET /supplier/ 공급업체 목록 조회 supplier_list

Parameters Try it out No parameters

Responses Response content type

application/json Code Description 200 Example Value Model [Supplier{ id IDinteger title: ID
readOnly: true name* Namestring title: Name maxLength: 100 minLength: 1 contact* Contactstring
title: Contact maxLength: 20 minLength: 1 manager* Managerstring title: Manager maxLength: 50
minLength: 1 email* Emailstring($email) title: Email maxLength: 254 minLength: 1 address\*
Addressstring title: Address maxLength: 255 minLength: 1 variant_codes [[...]] variants
Variantsstring title: Variants readOnly: true

}]

POST /supplier/ 공급업체 등록 supplier_create

Parameters Try it out Name Description data _ object (body) Example Value Model Supplier{ name_
string title: Name maxLength: 100 minLength: 1 contact* string title: Contact maxLength: 20
minLength: 1 manager* string title: Manager maxLength: 50 minLength: 1 email* string($email) title:
Email maxLength: 254 minLength: 1 address* string title: Address maxLength: 255 minLength: 1
variant_codes [string minLength: 1]

} Responses Response content type

application/json Code Description 201 Example Value Model Supplier{ id integer title: ID readOnly:
true name* string title: Name maxLength: 100 minLength: 1 contact* string title: Contact maxLength:
20 minLength: 1 manager* string title: Manager maxLength: 50 minLength: 1 email* string($email)
title: Email maxLength: 254 minLength: 1 address\* string title: Address maxLength: 255 minLength: 1
variant_codes [string minLength: 1] variants string title: Variants readOnly: true

}

PATCH /supplier/variants/{supplier_id}/{variant_code}/ 공급업체-상품 옵션 매핑 수정
supplier_variants_partial_update

Parameters Try it out Name Description data \* object (body) Example Value Model
SupplierVariantUpdateTable{ cost_price integer title: Cost price maximum: 2147483647 minimum: 0
is_primary boolean title: Is primary

} supplier_id \* integer (path) 공급업체 ID (예: 1)

supplier_id variant_code \* string (path) 상품 상세 코드 (예: P00000XN000A)

variant_code Responses Response content type

application/json Code Description 200 Example Value Model SupplierVariantUpdateTable{ id integer
title: ID readOnly: true cost_price integer title: Cost price maximum: 2147483647 minimum: 0
is_primary boolean title: Is primary

}

GET /supplier/{id}/ 공급업체 상세 조회 supplier_read

Parameters Try it out Name Description id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model Supplier{ id integer title: ID readOnly:
true name* string title: Name maxLength: 100 minLength: 1 contact* string title: Contact maxLength:
20 minLength: 1 manager* string title: Manager maxLength: 50 minLength: 1 email* string($email)
title: Email maxLength: 254 minLength: 1 address\* string title: Address maxLength: 255 minLength: 1
variant_codes [string minLength: 1] variants string title: Variants readOnly: true

}

PATCH /supplier/{id}/ 공급업체 정보 수정 supplier_partial_update

Parameters Try it out Name Description data _ object (body) Example Value Model SupplierOption{
name_ string title: Name maxLength: 100 minLength: 1 contact* string title: Contact maxLength: 20
minLength: 1 manager* string title: Manager maxLength: 50 minLength: 1 email* string($email) title:
Email maxLength: 254 minLength: 1 address* string title: Address maxLength: 255 minLength: 1

} id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model Supplier{ id integer title: ID readOnly:
true name* string title: Name maxLength: 100 minLength: 1 contact* string title: Contact maxLength:
20 minLength: 1 manager* string title: Manager maxLength: 50 minLength: 1 email* string($email)
title: Email maxLength: 254 minLength: 1 address\* string title: Address maxLength: 255 minLength: 1
variant_codes [string minLength: 1] variants string title: Variants readOnly: true

}
