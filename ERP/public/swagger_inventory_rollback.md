inventory - Rollback


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