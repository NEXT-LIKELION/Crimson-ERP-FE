hr


GET
/hr/employees/
직원 목록 조회
hr_employees_list

직원 목록 조회

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
[EmployeeList{
id	IDinteger
title: ID
readOnly: true
username*	Usernamestring
title: Username
pattern: ^[\w.@+-]+$
maxLength: 150
minLength: 1
Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.

email	Email addressstring($email)
title: Email address
maxLength: 254
role	Rolestring
title: Role
Enum:
Array [ 3 ]
contact	Contactstring
title: Contact
maxLength: 20
x-nullable: true
status	Statusstring
title: Status
Enum:
Array [ 2 ]
first_name	First namestring
title: First name
maxLength: 150
is_active	Activeboolean
title: Active
Designates whether this user should be treated as active. Unselect this instead of deleting accounts.

hire_date	Hire datestring($date)
title: Hire date
readOnly: true
x-nullable: true
remaining_leave_days	Remaining leave daysstring
title: Remaining leave days
readOnly: true
 
}]

GET
/hr/employees/{employee_id}/
특정 직원 조회
hr_employees_read

특정 직원 조회

Parameters
Try it out
Name	Description
employee_id *
string
(path)
employee_id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
EmployeeDetail{
id	integer
title: ID
readOnly: true
username*	string
title: Username
pattern: ^[\w.@+-]+$
maxLength: 150
minLength: 1
Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.

email	string($email)
title: Email address
maxLength: 254
role	string
title: Role
Enum:
Array [ 3 ]
contact	string
title: Contact
maxLength: 20
x-nullable: true
status	string
title: Status
Enum:
Array [ 2 ]
first_name	string
title: First name
maxLength: 150
is_active	boolean
title: Active
Designates whether this user should be treated as active. Unselect this instead of deleting accounts.

hire_date	string($date)
title: Hire date
x-nullable: true
annual_leave_days	integer
title: Annual leave days
maximum: 2147483647
minimum: 0
allowed_tabs*	Allowed tabs{
 
}
remaining_leave_days	string
title: Remaining leave days
readOnly: true
vacation_days	string
title: Vacation days
readOnly: true
vacation_pending_days	string
title: Vacation pending days
readOnly: true
 
}
404	
Not Found


PATCH
/hr/employees/{employee_id}/
직원 정보 수정 (HR 전용)
hr_employees_partial_update

직원의 이름, 이메일, 연락처, 퇴사 여부, 연차일수, 권한 탭, 입사일, 직무를 수정합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
email	string
example: john.doe@example.com
직원 이메일

first_name	string
example: 유시진
이름

contact	string
example: 010-1234-5678
직원 연락처

is_active	boolean
example: true
퇴사 여부 (false이면 퇴사)

annual_leave_days	integer
example: 24
연차일수

allowed_tabs	[
example: List [ "INVENTORY", "SUPPLIER", "ORDER", "HR" ]
접근 허용 탭 목록 (예: ['INVENTORY', 'HR'])

string]
hire_date	string($date)
example: 2024-03-01
입사일

role	string
example: STAFF
직무 구분

Enum:
Array [ 3 ]
 
}
employee_id *
string
(path)
employee_id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
EmployeeDetail{
id	integer
title: ID
readOnly: true
username*	string
title: Username
pattern: ^[\w.@+-]+$
maxLength: 150
minLength: 1
Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.

email	string($email)
title: Email address
maxLength: 254
role	string
title: Role
Enum:
Array [ 3 ]
contact	string
title: Contact
maxLength: 20
x-nullable: true
status	string
title: Status
Enum:
Array [ 2 ]
first_name	string
title: First name
maxLength: 150
is_active	boolean
title: Active
Designates whether this user should be treated as active. Unselect this instead of deleting accounts.

hire_date	string($date)
title: Hire date
x-nullable: true
annual_leave_days	integer
title: Annual leave days
maximum: 2147483647
minimum: 0
allowed_tabs*	Allowed tabs{
 
}
remaining_leave_days	string
title: Remaining leave days
readOnly: true
vacation_days	string
title: Vacation days
readOnly: true
vacation_pending_days	string
title: Vacation pending days
readOnly: true
 
}
400	
Bad Request

404	
Not Found


GET
/hr/vacations/
휴가 신청 목록 조회
hr_vacations_list

휴가 신청 전체 조회

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
[VacationRequest{
id	IDinteger
title: ID
readOnly: true
employee*	Employeeinteger
title: Employee
employee_name	Employee namestring
title: Employee name
readOnly: true
minLength: 1
start_date*	Start datestring($date)
title: Start date
end_date*	End datestring($date)
title: End date
leave_type	Leave typestring
title: Leave type
readOnly: true
Enum:
Array [ 5 ]
reason	Reasonstring
title: Reason
x-nullable: true
status	Statusstring
title: Status
Enum:
Array [ 4 ]
status_display	Status displaystring
title: Status display
readOnly: true
minLength: 1
created_at	Created atstring($date-time)
title: Created at
readOnly: true
reviewed_at	Reviewed atstring($date-time)
title: Reviewed at
readOnly: true
x-nullable: true
 
}]

POST
/hr/vacations/
휴가 신청 등록
hr_vacations_create

휴가 신청 등록

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
employee*	integer
example: 168
직원 ID

leave_type*	string
example: VACATION
휴가 유형

Enum:
Array [ 5 ]
start_date*	string($date)
example: 2025-08-01
end_date*	string($date)
example: 2025-08-02
reason	string
example: 개인 사정으로 인한 연차
사유

 
}
Responses
Response content type

application/json
Code	Description
201	
Example Value
Model
VacationRequest{
id	integer
title: ID
readOnly: true
employee*	integer
title: Employee
employee_name	string
title: Employee name
readOnly: true
minLength: 1
start_date*	string($date)
title: Start date
end_date*	string($date)
title: End date
leave_type	string
title: Leave type
readOnly: true
Enum:
Array [ 5 ]
reason	string
title: Reason
x-nullable: true
status	string
title: Status
Enum:
Array [ 4 ]
status_display	string
title: Status display
readOnly: true
minLength: 1
created_at	string($date-time)
title: Created at
readOnly: true
reviewed_at	string($date-time)
title: Reviewed at
readOnly: true
x-nullable: true
 
}
400	
Bad Request


PATCH
/hr/vacations/review/{id}/
휴가 신청 취소/승인/거절
hr_vacations_review_partial_update

휴가 신청 상태를 승인(APPROVED), 거절(REJECTED), 대기중(PENDING), 취소(CANCELLED) 중 하나로 변경합니다.

Parameters
Try it out
Name	Description
data *
object
(body)
Example Value
Model
{
status*	string
example: APPROVED
변경할 상태값

Enum:
Array [ 2 ]
 
}
id *
string
(path)
id
Responses
Response content type

application/json
Code	Description
200	
Example Value
Model
VacationRequest{
id	integer
title: ID
readOnly: true
employee*	integer
title: Employee
employee_name	string
title: Employee name
readOnly: true
minLength: 1
start_date*	string($date)
title: Start date
end_date*	string($date)
title: End date
leave_type	string
title: Leave type
readOnly: true
Enum:
Array [ 5 ]
reason	string
title: Reason
x-nullable: true
status	string
title: Status
Enum:
Array [ 4 ]
status_display	string
title: Status display
readOnly: true
minLength: 1
created_at	string($date-time)
title: Created at
readOnly: true
reviewed_at	string($date-time)
title: Reviewed at
readOnly: true
x-nullable: true
 
}
400	
Bad Request

403	
Forbidden

404	
Not Found