import { useQuery } from '@tanstack/react-query';
import { fetchInventories } from '../../api/inventory';
import { AxiosResponse } from 'axios';
import { Product } from '../../types/product';
import { useEffect } from 'react';

type PaginatedResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: Product[];
};

type InventoriesResponse = AxiosResponse<PaginatedResponse>;

export const useInventories = () => {
    const query = useQuery<InventoriesResponse, Error>({
        queryKey: ['inventories'],
        queryFn: fetchInventories,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    useEffect(() => {
        if (query.isSuccess) {
            console.log('✅ 재고 목록 응답:', query.data.data);
        }
        if (query.isError) {
            console.error('❌ 재고 목록 불러오기 실패:', query.error);
        }
    }, [query.isSuccess, query.isError, query.data, query.error]);

    return {
        ...query,
        data: query.data?.data?.results ?? [], // 페이지네이션된 results 배열 반환
    };
};
