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
cost_price	Cost price[...]
order_count	Order count[...]
return_count	Return count[...]
sales	Sales[...]
 
}]
 
}

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