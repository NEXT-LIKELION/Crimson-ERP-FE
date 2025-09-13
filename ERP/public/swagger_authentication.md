authentication


POST
/authentication/approve/
직원 계정 상태 전환 (STAFF/INTERN)
authentication_approve_create

MANAGER가 STAFF 또는 INTERN 계정을 승인(APPROVED)하거나 거절(DENIED)할 수 있습니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
username*	string
example: staff1
STAFF 사용자 아이디

status*	string
example: APPROVED
변경할 상태

Enum:
Array [ 2 ]
 
}
Responses
Response content type

application/json
Code	Description
200	
상태 변경 성공

400	
잘못된 요청

403	
권한 없음

404	
사용자 없음


POST
/authentication/login/
로그인
authentication_login_create

사용자 로그인 후 JWT 토큰과 사용자 정보를 반환합니다. STAFF의 경우 approved 상태여야 로그인 가능합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
username*	string
example: staff1
사용자 아이디

password*	string($password)
example: crimson123
비밀번호

 
}
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
{
message	string
access_token	string
refresh_token	string
user	{
username	string
email	string
first_name	string
contact	string
role	string
status	string
 
}
 
}
401	
잘못된 로그인 정보

403	
승인되지 않은 계정


POST
/authentication/logout/
로그아웃
authentication_logout_create

리프레시 토큰을 블랙리스트에 등록하여 로그아웃을 수행합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
refresh_token*	string
JWT 리프레시 토큰

 
}
Responses
Response content type

application/json
Code	Description
200	
로그아웃 성공

400	
잘못된 토큰


POST
/authentication/signup/
회원가입
authentication_signup_create

새로운 사용자를 등록하고, JWT 토큰을 반환합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
username*	string
example: test01
사용자 아이디

email*	string($email)
example: test@example.com
password*	string($password)
example: crimson123
first_name*	string
example: 테스트
contact*	string
example: 010-1234-5678
 
}
Responses
Response content type

application/json
Code	Description
201	
Example Value
Model
{
message	string
성공 메시지

access_token	string
JWT 액세스 토큰

refresh_token	string
JWT 리프레시 토큰

 
}
400	
잘못된 입력