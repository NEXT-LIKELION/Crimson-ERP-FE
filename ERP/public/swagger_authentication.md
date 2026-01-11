authentication

POST /authentication/approve/ 직원 계정 상태 전환 (STAFF/INTERN/MANAGER)
authentication_approve_create

MANAGER가 STAFF, INTERN 또는 MANAGER 계정을 승인(APPROVED)하거나 거절(DENIED)할 수 있습니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { username_ string
example: staff1 STAFF 사용자 아이디

status\* string example: APPROVED 변경할 상태

Enum: Array [ 2 ]

} Responses Response content type

application/json Code Description 200 상태 변경 성공

400 잘못된 요청

403 권한 없음

404 사용자 없음

PUT /authentication/change-password/{employee_id}/ 비밀번호 변경 (본인 또는 매니저)
authentication_change-password_update

로그인한 본인의 비밀번호를 직접 변경하거나, 'MANAGER' 권한을 가진 사용자가 다른 직원의 비밀번호를
변경합니다.

일반 사용자: URL의 employee*id에 자신의 ID를 넣어서 요청해야 합니다. 매니저: URL의 employee_id에
대상 직원의 ID를 넣어 요청할 수 있습니다. Parameters Try it out Name Description data * object
(body) Example Value Model { password\_ string example: new_strong_password! 새 비밀번호

} employee_id \* string (path) employee_id Responses Response content type

application/json Code Description 200 비밀번호가 성공적으로 변경되었습니다.

400 Bad Request - 유효하지 않은 데이터

403 Forbidden - 권한 없음

404 Not Found - 직원을 찾을 수 없음

POST /authentication/login/ 로그인 authentication_login_create

사용자 로그인 후 JWT 토큰과 사용자 정보를 반환합니다. STAFF의 경우 approved 상태여야 로그인
가능합니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { username_ string
example: staff1 사용자 아이디

password\* string($password) example: crimson123 비밀번호

} Responses Response content type

application/json Code Description 200 Example Value Model { message string access_token string
refresh_token string user { username string email string first_name string contact string role
string status string

}

} 401 잘못된 로그인 정보

403 승인되지 않은 계정

POST /authentication/logout/ 로그아웃 authentication_logout_create

리프레시 토큰을 블랙리스트에 등록하여 로그아웃을 수행합니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { refresh_token_
string JWT 리프레시 토큰

} Responses Response content type

application/json Code Description 200 로그아웃 성공

400 잘못된 토큰

POST /authentication/signup/ 회원가입 authentication_signup_create

새로운 사용자를 등록하고, JWT 토큰을 반환합니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { username_ string
example: test01 사용자 아이디

email* string($email) example: test@example.com password* string($password) example: crimson123
first_name* string example: 테스트 contact* string example: 010-1234-5678

} Responses Response content type

application/json Code Description 201 Example Value Model { message string 성공 메시지

access_token string JWT 액세스 토큰

refresh_token string JWT 리프레시 토큰

} 400 잘못된 입력
