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
    mutationFn: ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: {
        name?: string;
        contact?: string;
        manager?: string;
        email?: string;
        address?: string;
      }
    }) => supplierApi.updateSupplier(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

// 공급업체 variant 업데이트 (낙관적 업데이트 포함)
export const useUpdateSupplierVariant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ supplierId, variantCode, data }: {
      supplierId: number;
      variantCode: string; 
      data: { cost_price: number; is_primary: boolean };
    }) => supplierApi.updateSupplierVariant(supplierId, variantCode, data),
    
    // 낙관적 업데이트
    onMutate: async ({ supplierId, variantCode, data }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['supplier', supplierId] });
      
      // 이전 데이터 스냅샷 저장
      const previousData = queryClient.getQueryData(['supplier', supplierId]);
      
      // 낙관적으로 캐시 업데이트
      queryClient.setQueryData(['supplier', supplierId], (old: any) => {
        if (!old?.data?.variants) return old;
        
        return {
          ...old,
          data: {
            ...old.data,
            variants: old.data.variants.map((variant: any) => 
              variant.variant_code === variantCode
                ? { ...variant, ...data }
                : variant
            )
          }
        };
      });
      
      return { previousData };
    },
    
    // 성공 시 서버 데이터로 동기화
    onSuccess: (_, { supplierId }) => {
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
    },
    
    // 실패 시 롤백
    onError: (_, { supplierId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['supplier', supplierId], context.previousData);
      }
    }
  });
};
