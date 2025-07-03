import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as supplierApi from '../../api/supplier';

// 공급업체 목록 조회
export const useSuppliers = () =>
    useQuery({
        queryKey: ['suppliers'],
        queryFn: supplierApi.fetchSuppliers,
    });

// 공급업체 상세 조회
export const useSupplierById = (id: number) =>
    useQuery({
        queryKey: ['supplier', id],
        queryFn: () => supplierApi.fetchSupplierById(id),
        enabled: !!id,
    });

// 공급업체 생성
export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierApi.createSupplier,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
    });
};

// 공급업체 수정
export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => supplierApi.updateSupplier(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
    });
};
