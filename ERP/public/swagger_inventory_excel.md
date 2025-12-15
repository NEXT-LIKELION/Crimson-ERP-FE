inventory - Excel

POST /inventory/variants/upload-excel/ 상품 재고 엑셀 업로드 inventory_variants_upload-excel_create

Parameters Try it out Name Description file \* file (formData) 업로드할 엑셀 파일 (.xlsx)

선택된 파일 없음 year integer (query) 재고 기준 연도 (default: 현재 연도)

year month integer (query) 재고 기준 월 (default: 현재 월)

month Responses Response content type

application/json Code Description 201
