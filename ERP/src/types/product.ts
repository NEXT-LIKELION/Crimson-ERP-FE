// src/types/product.ts

export interface ProductVariant {
    id: number;
    variant_code?: string;
    option: string;
    stock: number;
    price: number;
    cost_price: number;
    created_at?: string;
    updated_at?: string;
}

export interface Product {
    id: number;
    product_id: string;
    name: string;
    item_code?: string;
    category?: string;
    categoryCode?: string;
    description?: string;
    supplier?: string;
    memo?: string;
    stock: number;
    min_stock?: number;
    status?: string;
    price?: string | number;
    option?: string;
    cost_price?: string | number;
    variant_id?: number;
    variants?: ProductVariant[];
    created_at?: string;

    // 프론트에서만 사용하는 임시 필드들
    orderCount?: number;
    returnCount?: number;
    salesCount?: number;
    totalSales?: string;
}
