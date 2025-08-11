import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVacations, createVacation, reviewVacation, type VacationStatus, type VacationRequest, type VacationCreateData } from "../../api/hr";

// 휴가 목록 조회 훅
export const useVacations = () =>
    useQuery<{data: VacationRequest[]}>({
        queryKey: ["vacations"],
        queryFn: fetchVacations,
        staleTime: 1000 * 60 * 2, // 2분
        gcTime: 1000 * 60 * 5, // 5분
    });

// 휴가 신청 뮤테이션 훅
export const useCreateVacation = () => {
    const queryClient = useQueryClient();

    return useMutation<{data: VacationRequest}, Error, VacationCreateData>({
        mutationFn: createVacation,
        onSuccess: (data) => {
            // 휴가 목록 새로고침
            queryClient.invalidateQueries({ queryKey: ["vacations"] });
            
            // 해당 직원의 정보도 새로고침 (휴가 데이터 갱신을 위해)
            if (data?.data?.employee) {
                queryClient.invalidateQueries({ queryKey: ["employee", data.data.employee] });
            }
            
            // 전체 직원 목록도 새로고침
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
        onError: (error: Error) => {
            console.error("휴가 신청 실패:", error);
        },
    });
};

// 휴가 승인/거절/취소 뮤테이션 훅
export const useReviewVacation = () => {
    const queryClient = useQueryClient();

    return useMutation<{data: VacationRequest}, Error, { vacationId: number; status: VacationStatus }>({
        mutationFn: ({ vacationId, status }: { vacationId: number; status: VacationStatus }) =>
            reviewVacation(vacationId, status),
        onSuccess: (data) => {
            // 휴가 목록 새로고침
            queryClient.invalidateQueries({ queryKey: ["vacations"] });
            
            // 해당 직원의 정보도 새로고침 (휴가 데이터 갱신을 위해)
            if (data?.data?.employee) {
                queryClient.invalidateQueries({ queryKey: ["employee", data.data.employee] });
            }
            
            // 전체 직원 목록도 새로고침 (remaining_leave_days 갱신을 위해)
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
        onError: (error: Error) => {
            console.error("휴가 처리 실패:", error);
        },
    });
};
