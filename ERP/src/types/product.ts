// src/types/product.ts

export interface ProductVariant {
    product_id: string;
    variant_code: string;
    option: string;
    stock: number;
    price: number;
    min_stock: number;
    description: string;
    memo: string;
    cost_price: number;
    order_count: number;
    return_count: number;
    sales: number;
    suppliers: {
        name: string;
        is_primary: boolean;
    }[];
}

export interface Product {
    id?: number;
    product_id: string;
    name: string;
    variants: ProductVariant[];

    // 프론트에서만 사용하는 임시 필드들 (테이블 렌더링용)
    option?: string;
    price?: number | string;
    stock?: number;
    cost_price?: number | string;
    min_stock?: number;
    variant_id?: number | string;
    variant_code?: string;
    orderCount?: number;
    returnCount?: number;
    salesCount?: number;
    totalSales?: string;
    status?: string;
    created_at?: string;
    description?: string;
    memo?: string;
    suppliers?: { name: string; is_primary: boolean }[];
}
