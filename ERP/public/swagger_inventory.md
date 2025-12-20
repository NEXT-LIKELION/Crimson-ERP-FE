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

GET
/inventory/category/
카테고리 목록 조회
inventory_category_list

InventoryItem에 등록된 카테고리 문자열의 고유 목록을 반환합니다.

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
[
example: List [ "문구", "도서", "의류" ]
카테고리 이름 리스트

string]

POST
/inventory/rollback/{id}/
재고 롤백 (스냅샷 복원)
inventory_rollback_create

지정된 스냅샷 시점으로 재고를 되돌립니다.

자동 처리 프로세스:

롤백 전 현재 재고 상태를 백업 스냅샷으로 자동 저장
지정된 스냅샷의 재고 데이터로 ProductVariant 테이블 덮어쓰기
처리 결과 및 백업 스냅샷 ID 반환
복원되는 데이터:

stock (재고)
price (판매가)
cost_price (원가)
order_count (주문수량)
return_count (반품수량)
사용 예시:

잘못된 POS 업로드 후 이전 상태로 복원
실수로 변경된 재고 데이터 되돌리기
특정 시점의 재고 상태로 복구
주의사항:

롤백 후에는 다시 되돌릴 수 없습니다 (새 백업 스냅샷 사용)
variant_code가 존재하지 않는 항목은 건너뜁니다
Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
reason	string
example: 잘못된 POS 업로드 되돌리기
롤백 사유

 
}
id *
integer
(path)
롤백할 스냅샷 ID

id
Responses
Response content type

application/json
Code	Description
200	
롤백 성공

Example Value
Model
{
message	string
example: 롤백 완료
rollback_snapshot_id	integer
example: 123
롤백한 스냅샷 ID

backup_snapshot_id	integer
example: 124
롤백 전 생성된 백업 스냅샷 ID

updated_count	integer
example: 450
업데이트된 상품 수

skipped_count	integer
example: 5
존재하지 않아 건너뛴 상품 수

rollback_date	string
example: 2025-09-11T09:30:00+09:00
롤백한 스냅샷 생성일시

 
}
404	
스냅샷을 찾을 수 없음

Example Value

500	
롤백 처리 중 오류 발생


GET
/inventory/snapshot
inventory_snapshot_list

GET /snapshot : 스냅샷 목록(메타만; items 제외)
POST /snapshot : 현재 재고 상태 스냅샷 생성

Parameters
Try it out
Name	Description
page
integer
(query)
A page number within the paginated result set.

page
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
results*	[InventorySnapshot{
id	ID[...]
created_at	Created at[...]
reason	Reason[...]
actor_name	Actor name[...]
meta	Meta{...}
items	[...]
 
}]
 
}

POST
/inventory/snapshot
inventory_snapshot_create

GET /snapshot : 스냅샷 목록(메타만; items 제외)
POST /snapshot : 현재 재고 상태 스냅샷 생성

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
InventorySnapshot{
created_at	string($date-time)
title: Created at
reason	string
title: Reason
maxLength: 200
스냅샷 사유 (예: POS 덮어쓰기 전)

meta	Meta{
 
}
 
}
Responses
Response content type

application/json
Code	Description
201	
Example Value
Model
InventorySnapshot{
id	integer
title: ID
readOnly: true
created_at	string($date-time)
title: Created at
reason	string
title: Reason
maxLength: 200
스냅샷 사유 (예: POS 덮어쓰기 전)

actor_name	string
title: Actor name
readOnly: true
meta	Meta{
 
}
items	[
readOnly: true
InventorySnapshotItem{
id	ID[...]
variant	Variant[...]
product_id	Product id[...]
name	Name[...]
category	Category[...]
variant_code	Variant code[...]
option	Option[...]
stock	Stock[...]
price	Price[...]
order_count	Order count[...]
return_count	Return count[...]
sales	Sales[...]
 
}]
 
}

GET
/inventory/snapshot/{id}/
재고 스냅샷 상세 조회
inventory_snapshot_read

특정 스냅샷의 상세 정보를 조회합니다.

포함되는 데이터:

스냅샷 메타정보 (생성일시, 사유, 수행자)
당시 모든 상품의 재고 상태 (items 배열)
각 상품별 재고, 가격, 주문/반품 수량 등
사용 예시:

롤백 전 특정 시점의 재고 상태 확인
재고 변화 추적 및 분석
문제 발생 시점 데이터 검증
주의사항:

큰 데이터가 포함되므로 필요할 때만 호출
목록 조회는 GET /inventory/snapshot 사용
Parameters
Try it out
Name	Description
id *
integer
(path)
조회할 스냅샷 ID

id
Responses
Response content type

application/json
Code	Description
200	
스냅샷 상세 조회 성공

Example Value

404	
스냅샷을 찾을 수 없음


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