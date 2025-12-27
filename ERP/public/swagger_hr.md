hr

GET /hr/employees/ 직원 목록 조회 hr_employees_list

직원 목록 조회

Parameters Try it out No parameters

Responses Response content type

application/json Code Description 200 Example Value Model [EmployeeList{ id IDinteger title: ID
readOnly: true username\* Usernamestring title: Username pattern: ^[\w.@+-]+$ maxLength: 150
minLength: 1 Required. 150 characters or fewer. Letters, digits and @/./+/-/\_ only.

email Email addressstring($email) title: Email address maxLength: 254 role Rolestring title: Role
Enum: Array [ 3 ] contact Contactstring title: Contact maxLength: 20 x-nullable: true status
Statusstring title: Status Enum: Array [ 2 ] first_name First namestring title: First name
maxLength: 150 is_active Activeboolean title: Active Designates whether this user should be treated
as active. Unselect this instead of deleting accounts.

hire_date Hire datestring($date) title: Hire date readOnly: true x-nullable: true
remaining_leave_days Remaining leave daysstring title: Remaining leave days readOnly: true gender
Genderstring title: Gender x-nullable: true Enum: Array [ 2 ]

}]

GET /hr/employees/{employee_id}/ 특정 직원 조회 hr_employees_read

특정 직원 조회

Parameters Try it out Name Description employee_id \* string (path) employee_id Responses Response
content type

application/json Code Description 200 Example Value Model EmployeeDetail{ id integer title: ID
readOnly: true username\* string title: Username pattern: ^[\w.@+-]+$ maxLength: 150 minLength: 1
Required. 150 characters or fewer. Letters, digits and @/./+/-/\_ only.

email string($email) title: Email address maxLength: 254 role string title: Role Enum: Array [ 3 ]
contact string title: Contact maxLength: 20 x-nullable: true status string title: Status Enum: Array
[ 2 ] first_name string title: First name maxLength: 150 is_active boolean title: Active Designates
whether this user should be treated as active. Unselect this instead of deleting accounts.

hire_date string($date) title: Hire date x-nullable: true annual_leave_days integer title: Annual
leave days maximum: 2147483647 minimum: 0 allowed_tabs\* Allowed tabs{

} remaining_leave_days string title: Remaining leave days readOnly: true vacation_days string title:
Vacation days readOnly: true vacation_pending_days string title: Vacation pending days readOnly:
true gender string title: Gender x-nullable: true Enum: Array [ 2 ]

} 404 Not Found

PATCH /hr/employees/{employee_id}/ 직원 정보 수정 (HR 전용) hr_employees_partial_update

직원의 이름, 이메일, 연락처, 퇴사 여부, 연차일수, 권한 탭, 입사일, 직무, 삭제 여부를 수정합니다.

Parameters Try it out Name Description data \* object (body) Example Value Model { email string
example: john.doe@example.com 직원 이메일

first_name string example: 유시진 이름

contact string example: 010-1234-5678 직원 연락처

is_active boolean example: true 퇴사 여부 (false이면 퇴사)

annual_leave_days integer example: 24 연차일수

allowed_tabs [ example: List [ "INVENTORY", "SUPPLIER", "ORDER", "HR" ] 접근 허용 탭 목록 (예:
['INVENTORY', 'HR'])

string] hire_date string($date) example: 2024-03-01 입사일

role string example: STAFF 직무 구분

Enum: Array [ 3 ] is_deleted boolean example: false 삭제 여부(소프트 삭제)

gender string example: MALE 성별

Enum: Array [ 2 ]

} employee_id \* string (path) employee_id Responses Response content type

application/json Code Description 200 Example Value Model EmployeeDetail{ id integer title: ID
readOnly: true username\* string title: Username pattern: ^[\w.@+-]+$ maxLength: 150 minLength: 1
Required. 150 characters or fewer. Letters, digits and @/./+/-/\_ only.

email string($email) title: Email address maxLength: 254 role string title: Role Enum: Array [ 3 ]
contact string title: Contact maxLength: 20 x-nullable: true status string title: Status Enum: Array
[ 2 ] first_name string title: First name maxLength: 150 is_active boolean title: Active Designates
whether this user should be treated as active. Unselect this instead of deleting accounts.

hire_date string($date) title: Hire date x-nullable: true annual_leave_days integer title: Annual
leave days maximum: 2147483647 minimum: 0 allowed_tabs\* Allowed tabs{

} remaining_leave_days string title: Remaining leave days readOnly: true vacation_days string title:
Vacation days readOnly: true vacation_pending_days string title: Vacation pending days readOnly:
true gender string title: Gender x-nullable: true Enum: Array [ 2 ]

} 400 Bad Request

404 Not Found

GET /hr/vacations/ 휴가 신청 목록 조회 hr_vacations_list

휴가 신청 및 근무 배정 목록을 조회합니다. 쿼리 파라미터로 필터링 가능합니다.

Parameters Try it out Name Description leave_type string (query) 휴가 유형 필터 (예: VACATION, WORK)

leave_type employee integer (query) 직원 ID 필터

employee start_date string($date) (query) 시작일 필터 (YYYY-MM-DD)

start_date end_date string($date) (query) 종료일 필터 (YYYY-MM-DD)

end_date Responses Response content type

application/json Code Description 200 Example Value Model [VacationRequest{ id IDinteger title: ID
readOnly: true employee* Employeeinteger title: Employee employee_name Employee namestring title:
Employee name readOnly: true minLength: 1 start_date* Start
datestring($date)
title: Start date
end_date*	End datestring($date) title: End date leave_type Leave
typestring title: Leave type readOnly: true Enum: Array [ 6 ] reason Reasonstring title: Reason
x-nullable: true status Statusstring title: Status Enum: Array [ 4 ] status_display Status
displaystring title: Status display readOnly: true minLength: 1 created_at Created
atstring($date-time)
title: Created at
readOnly: true
reviewed_at	Reviewed atstring($date-time) title:
Reviewed at readOnly: true x-nullable: true

}]

POST /hr/vacations/ 휴가 신청 등록 hr_vacations_create

휴가 신청을 등록합니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { employee_ integer
example: 168 직원 ID

leave_type\* string example: VACATION 휴가 유형 (WORK는 관리자만 생성 가능)

Enum: Array [ 6 ] start_date* string($date) example: 2025-08-01 end_date* string($date) example:
2025-08-02 reason string example: 개인 사정으로 인한 연차 사유

} Responses Response content type

application/json Code Description 201 Example Value Model VacationRequest{ id integer title: ID
readOnly: true employee* integer title: Employee employee_name string title: Employee name readOnly:
true minLength: 1 start_date* string($date)
title: Start date
end_date*	string($date) title: End date
leave_type string title: Leave type readOnly: true Enum: Array [ 6 ] reason string title: Reason
x-nullable: true status string title: Status Enum: Array [ 4 ] status_display string title: Status
display readOnly: true minLength: 1 created_at
string($date-time)
title: Created at
readOnly: true
reviewed_at	string($date-time) title: Reviewed at
readOnly: true x-nullable: true

} 400 Bad Request

403 Forbidden

PATCH /hr/vacations/review/{id}/ 휴가 신청 취소/승인/거절 hr_vacations_review_partial_update

휴가 신청 상태를 승인(APPROVED), 거절(REJECTED), 대기중(PENDING), 취소(CANCELLED) 중 하나로
변경합니다. WORK 타입은 생성 시 자동 승인되므로 일반적으로 이 API를 사용할 필요가 없습니다.

Parameters Try it out Name Description data _ object (body) Example Value Model { status_ string
example: APPROVED 변경할 상태값

Enum: Array [ 2 ]

} id \* string (path) id Responses Response content type

application/json Code Description 200 Example Value Model VacationRequest{ id integer title: ID
readOnly: true employee* integer title: Employee employee_name string title: Employee name readOnly:
true minLength: 1 start_date* string($date)
title: Start date
end_date*	string($date) title: End date
leave_type string title: Leave type readOnly: true Enum: Array [ 6 ] reason string title: Reason
x-nullable: true status string title: Status Enum: Array [ 4 ] status_display string title: Status
display readOnly: true minLength: 1 created_at
string($date-time)
title: Created at
readOnly: true
reviewed_at	string($date-time) title: Reviewed at
readOnly: true x-nullable: true

} 400 Bad Request

403 Forbidden

404 Not Found
