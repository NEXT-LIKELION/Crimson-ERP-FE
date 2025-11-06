inventory - Stock

GET /inventory/adjustments/ 재고 조정 이력 조회 inventory_adjustments_list

variant_code 기준 필터링 및 페이지네이션 지원

Parameters Try it out Name Description ordering string (query) Which field to use when ordering the
results.

ordering page integer (query) 페이지 번호 (기본=1)

page variant_code string (query) 조회할 variant_code (예: P00000YC000A)

variant_code Responses Response content type

application/json Code Description 200 Example Value Model { count* integer next
string($uri)
x-nullable: true
previous	string($uri) x-nullable: true results* [InventoryAdjustment{ id
ID[...] variant_code Variant code[...] product_id Product id[...] product_name Product name[...]
delta Delta[...] reason Reason[...] created_by Created by[...] created_at Created at[...]

}]

}

PUT /inventory/variants/stock/{variant_code}/ 재고량 수동 업데이트 inventory_variants_stock_update

실사 재고량을 입력하여 재고를 업데이트하고 조정 이력을 자동 생성합니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { actual_stock_
integer example: 125 실사한 실제 재고량

reason string example: 2025년 2분기 실사 조정 사유

updated_by string example: 유시진 작업자

} variant_code \* string (path) 수정할 variant_code (예: P00000YC000A)

variant_code Responses Response content type

application/json Code Description 200 Stock updated successfully

404 Not Found
