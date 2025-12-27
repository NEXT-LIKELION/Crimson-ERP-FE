inventory - Stock Adjust

GET /inventory/adjustments/ 재고 조정 이력 조회 inventory_adjustments_list

재고 조정 이력을 조회합니다.

variant_code, year, month 기준 필터 가능 최신순 정렬 Parameters Try it out Name Description page
integer (query) A page number within the paginated result set.

page Responses Response content type

application/json Code Description 200 Example Value Model { count* integer next
string($uri)
x-nullable: true
previous	string($uri) x-nullable: true results* [InventoryAdjustment{ id
ID[...] variant_code Variant code[...] product_id Product id[...] product_name Product name[...]
delta Delta[...] reason Reason[...] created_by Created by[...] created_at Created at[...]

}]

}

POST /inventory/adjustments/ 재고 조정 등록 inventory_adjustments_create

재고 조정을 등록합니다.

처리 흐름:

InventoryAdjustment 생성 (이력 저장) 해당 year/month의 ProductVariantStatus 조회 또는 생성
stock_adjustment에 delta 누적 반영 Parameters Try it out Name Description data _ object (body)
Example Value Model { variant_code_ string example: P00001-A 조정 대상 variant_code

year integer example: 2025 조정 연도 (미입력 시 현재 연도)

month integer example: 12 조정 월 (미입력 시 현재 월)

delta\* integer example: -5 재고 조정 수량 (음수/양수 가능)

reason\* string example: 분기 실사 재고 차이 조정 사유

created_by\* string example: 김정현 조정 작업자

} Responses Response content type

application/json Code Description 201 Example Value Model InventoryAdjustment{ id integer title: ID
readOnly: true variant_code string title: Variant code readOnly: true minLength: 1 product_id string
title: Product id readOnly: true minLength: 1 product_name string title: Product name readOnly: true
minLength: 1 delta integer title: Delta readOnly: true 보정 수량: 양수/음수 모두 가능

reason string title: Reason readOnly: true minLength: 1 보정 사유 설명

created_by string title: Created by readOnly: true minLength: 1 보정 작업 수행자(사용자명 또는 ID)

created_at string($date-time) title: Created at readOnly: true

}
