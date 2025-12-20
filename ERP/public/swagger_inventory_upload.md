inventory - Upload


POST
/inventory/upload/
POS 데이터 업로드 (스냅샷 자동 생성)
inventory_upload_create

POS 데이터(xlsx/xls)를 업로드하여 재고를 업데이트합니다.

자동 처리 프로세스:

업로드 전 현재 재고 상태를 스냅샷으로 자동 저장
업로드된 데이터로 상품/재고 정보 덮어쓰기
처리 결과 및 생성된 스냅샷 ID 반환
지원 파일 형식:

상품 상세 시트: 상품 품목코드, 옵션 컬럼 포함
매출 요약 시트: 바코드, 매출건수 컬럼 포함
롤백 방법:

문제가 생긴 경우 POST /inventory/rollback/{snapshot_id} 사용
업로드 전 상태로 완전 복원 가능
주의사항:

이 작업은 기존 데이터를 덮어씁니다
반드시 백업된 스냅샷 ID를 기록해두세요
Parameters
Try it out
Name	Description
file *
file
(formData)
업로드할 XLSX/XLS 파일

선택된 파일 없음
reason
string
(formData)
업로드 사유 (선택사항)

reason
Responses
Response content type

application/json
Code	Description
200	
업로드 성공

Example Value
Model
{
message	string
example: POS 데이터 업로드 완료
snapshot_id	integer
example: 123
업로드 전 생성된 스냅샷 ID

batch_id	string
example: 20250911-abc123
업로드 배치 ID

type	string
example: variant_detail
처리된 시트 타입

channel	string
example: online
업로드 시 지정한 채널

created_count	integer
example: 50
신규 생성된 상품 수

updated_count	integer
example: 100
업데이트된 상품 수

errors	[
처리 오류 목록

string]
 
}
400	
파일 오류 또는 유효성 검증 실패