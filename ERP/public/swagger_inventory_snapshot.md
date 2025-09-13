inventory - Snapshot


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