inventory - Export

GET /inventory/variants/export/ 상품 재고 현황 Export (엑셀용) inventory_variants_export_list

월별 ProductVariantStatus 기준으로 상품 / 옵션 / 재고 / 판매 / 재고조정 정보를 한 행으로 반환합니다.

엑셀 다운로드 및 관리 화면 테이블 출력 용도입니다.

Parameters Try it out Name Description year \* integer (query) 조회 연도 (예: 2025)

year month \* integer (query) 조회 월 (1~12)

month product_code string (query) 상품 코드 검색 (product_id, 부분 일치)

product_code variant_code string (query) 상품 상세 코드 검색 (variant_code, 부분 일치)

variant_code category string (query) 카테고리 필터 (부분 일치)

category Responses Response content type

application/json Code Description 200 Example Value Model [ProductVariantStatus{ year* Yearinteger
title: Year maximum: 2147483647 minimum: -2147483648 month* Monthinteger title: Month maximum:
2147483647 minimum: -2147483648 big_category Big categorystring title: Big category readOnly: true
minLength: 1 middle_category Middle categorystring title: Middle category readOnly: true minLength:
1 category Categorystring title: Category readOnly: true minLength: 1 description Descriptionstring
title: Description readOnly: true minLength: 1 online_name Online namestring title: Online name
readOnly: true minLength: 1 offline_name Offline namestring title: Offline name readOnly: true
minLength: 1 option Optionstring title: Option readOnly: true minLength: 1 detail_option Detail
optionstring title: Detail option readOnly: true minLength: 1 product_code Product codestring title:
Product code readOnly: true minLength: 1 variant_code Variant codestring title: Variant code
readOnly: true minLength: 1 warehouse_stock_start Warehouse stock startinteger title: Warehouse
stock start maximum: 2147483647 minimum: -2147483648 store_stock_start Store stock startinteger
title: Store stock start maximum: 2147483647 minimum: -2147483648 initial_stock Initial stockstring
title: Initial stock readOnly: true inbound_quantity Inbound quantityinteger title: Inbound quantity
maximum: 2147483647 minimum: -2147483648 store_sales Store salesinteger title: Store sales maximum:
2147483647 minimum: -2147483648 online_sales Online salesinteger title: Online sales maximum:
2147483647 minimum: -2147483648 total_sales Total salesstring title: Total sales readOnly: true
adjustment_total Adjustment totalstring title: Adjustment total readOnly: true ending_stock Ending
stockstring title: Ending stock readOnly: true

}]
