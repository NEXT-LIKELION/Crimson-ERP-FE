inventory - View

GET /inventory/ 상품 옵션 리스트 조회 inventory_list

상품 드롭다운용으로 product_id와 name만 간단히 반환합니다.

Parameters Try it out No parameters

Responses Response content type

application/json Code Description 200 Example Value Model [InventoryItemSummary{ id IDinteger title:
ID readOnly: true product_id Product idstring title: Product id maxLength: 50 minLength: 1 name
Namestring title: Name maxLength: 255

}]

GET /inventory/category/ 카테고리 목록 조회 inventory_category_list

InventoryItem에 등록된 카테고리 관련 필드들의 고유 목록을 반환합니다.

big_category middle_category category Parameters Try it out No parameters

Responses Response content type

application/json Code Description 200 Example Value Model { big_categories [ example: List [
"STORE", "ONLINE" ] string] middle_categories [ example: List [ "FASHION", "BOOK" ] string]
categories [ example: List [ "문구", "의류" ] string]

}

GET /inventory/variants/ 상품 상세 목록 조회 inventory_variants_list

POST : 상품 상세 추가 GET : 쿼리 파라미터 기반 Product Variant 조회

Parameters Try it out Name Description stock_lt integer (query) 재고 수량 미만

stock_lt stock_gt integer (query) 재고 수량 초과

stock_gt sales_min integer (query) 최소 매출

sales_min sales_max integer (query) 최대 매출

sales_max page integer (query) 페이지 번호 (default = 1)

page ordering string (query) 정렬 필드 (-price, stock 등)

ordering product_name string (query) 상품명 검색 (부분일치)

product_name category string (query) 상품 카테고리 (부분일치)

category channel string (query) 채널 필터 (online/offline)

channel Responses Response content type

application/json Code Description 200 Example Value Model [ProductVariant{ product_id Product
idstring title: Product id readOnly: true minLength: 1 offline_name Offline namestring title:
Offline name readOnly: true minLength: 1 online_name Online namestring title: Online name readOnly:
true minLength: 1 big_category Big categorystring title: Big category readOnly: true minLength: 1
middle_category Middle categorystring title: Middle category readOnly: true minLength: 1 category
Categorystring title: Category readOnly: true minLength: 1 variant_code* Variant codestring title:
Variant code maxLength: 50 minLength: 1 option* Optionstring title: Option maxLength: 255 minLength:
1 stock Stockinteger title: Stock readOnly: true price Priceinteger title: Price maximum: 2147483647
minimum: 0 min_stock Min stockinteger title: Min stock maximum: 2147483647 minimum: 0 description
Descriptionstring title: Description readOnly: true minLength: 1 memo Memostring title: Memo
channels [ readOnly: true [...]]

}]

GET /inventory/variants/{variant_code}/ 세부 품목 정보 조회 (방패필통 크림슨)
inventory_variants_read

GET / PATCH / DELETE: 특정 상품의 상세 정보 접근

Parameters Try it out Name Description variant_code \* string (path) 조회할 variant_code (예:
P00000XN000A)

variant_code Responses Response content type

application/json Code Description 200 Example Value Model ProductVariant{ product_id string title:
Product id readOnly: true minLength: 1 offline_name string title: Offline name readOnly: true
minLength: 1 online_name string title: Online name readOnly: true minLength: 1 big_category string
title: Big category readOnly: true minLength: 1 middle_category string title: Middle category
readOnly: true minLength: 1 category string title: Category readOnly: true minLength: 1
variant_code* string title: Variant code maxLength: 50 minLength: 1 option* string title: Option
maxLength: 255 minLength: 1 stock integer title: Stock readOnly: true price integer title: Price
maximum: 2147483647 minimum: 0 min_stock integer title: Min stock maximum: 2147483647 minimum: 0
description string title: Description readOnly: true minLength: 1 memo string title: Memo channels [
readOnly: true string minLength: 1]

} 404 Not Found
