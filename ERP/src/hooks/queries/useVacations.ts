import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchVacations,
    createVacation,
    reviewVacation,
    type Vacation,
    type VacationCreateData,
    type VacationStatus,
} from '../../api/hr';

// 휴가 목록 조회 훅
export const useVacations = () =>
    useQuery({
        queryKey: ['vacations'],
        queryFn: fetchVacations,
        staleTime: 1000 * 60 * 2, // 2분
        gcTime: 1000 * 60 * 5, // 5분
    });

// 휴가 신청 뮤테이션 훅
export const useCreateVacation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createVacation,
        onSuccess: () => {
            // 휴가 목록 새로고침
            queryClient.invalidateQueries({ queryKey: ['vacations'] });
        },
        onError: (error: any) => {
            console.error('휴가 신청 실패:', error);
        },
    });
};

// 휴가 승인/거절/취소 뮤테이션 훅
export const useReviewVacation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ vacationId, status }: { vacationId: number; status: VacationStatus }) =>
            reviewVacation(vacationId, status),
        onSuccess: () => {
            // 휴가 목록 새로고침
            queryClient.invalidateQueries({ queryKey: ['vacations'] });
        },
        onError: (error: any) => {
            console.error('휴가 처리 실패:', error);
        },
    });
};