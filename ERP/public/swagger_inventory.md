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
[ProductOption{
id	IDinteger
title: ID
readOnly: true
product_id	Product idstring
title: Product id
maxLength: 50
minLength: 1
name*	Namestring
title: Name
maxLength: 255
minLength: 1
 
}]

POST
/inventory/upload/
상품 XLSX 일괄 업로드
inventory_upload_create

엑셀 파일을 업로드하여 상품 및 상세 품목 정보를 일괄 생성 또는 업데이트합니다.

Parameters
Try it out
Name	Description
file *
file
(formData)
업로드할 XLSX 파일

선택된 파일 없음
Responses
Response content type

application/json
Code	Description
200	
성공

400	
파일 에러 또는 유효성 오류


POST
/inventory/variants/merge/
상품 코드 병합
inventory_variants_merge_create

여러 variant(source_variant_codes)를 target_variant_code로 병합합니다. 병합된 variant들은 삭제되고, 연관된 product도 통합됩니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
target_variant_code*	string
최종 남길 variant_code

source_variant_codes*	[
합칠(삭제할) variant_code 리스트

string]
 
}
Responses
Response content type

application/json
Code	Description
204	
Merge completed.

400	
Bad Request

404	
Not Found


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
name*	string
title: Name
maxLength: 255
minLength: 1
variants	string
title: Variants
readOnly: true
 
}
404	
Not Found

inventory - Stock


GET
/inventory/adjustments/
재고 조정 이력 조회
inventory_adjustments_list

variant_code 기준 필터링 및 페이지네이션 지원

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
페이지 번호 (기본=1)

page
variant_code
string
(query)
조회할 variant_code (예: P00000YC000A)

variant_code
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
results*	[InventoryAdjustment{
id	ID[...]
variant_code	Variant code[...]
product_id	Product id[...]
product_name	Product name[...]
delta	Delta[...]
reason	Reason[...]
created_by	Created by[...]
created_at	Created at[...]
 
}]
 
}

PUT
/inventory/variants/stock/{variant_code}/
재고량 수동 업데이트
inventory_variants_stock_update

실사 재고량을 입력하여 재고를 업데이트하고 조정 이력을 자동 생성합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
actual_stock*	integer
example: 125
실사한 실제 재고량

reason	string
example: 2025년 2분기 실사
조정 사유

updated_by	string
example: 유시진
작업자

 
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
Stock updated successfully

404	
Not Found