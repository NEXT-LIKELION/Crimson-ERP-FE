inventory


POST
/inventory/variants/upload-excel/
상품 재고 엑셀 업로드
inventory_variants_upload-excel_create

Parameters
Try it out
Name	Description
file *
file
(formData)
업로드할 엑셀 파일 (.xlsx)

선택된 파일 없음
year
integer
(query)
재고 기준 연도 (default: 현재 연도)

year
month
integer
(query)
재고 기준 월 (default: 현재 월)

month
Responses
Response content type

application/json
Code	Description
201	

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