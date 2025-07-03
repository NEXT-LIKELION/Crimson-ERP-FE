import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import { FaPlus, FaFileArrowUp } from 'react-icons/fa6';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import { deleteInventoryItem, updateInventoryVariant } from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import { useState, useMemo } from 'react';
import AddProductModal from '../../components/modal/AddProductModal';
import { Product } from '../../types/product';
import { useQueryClient } from '@tanstack/react-query';

const InventoryPage = () => {
    const { data, isLoading, error, refetch } = useInventories();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [productName, setProductName] = useState('');
    const [status, setStatus] = useState('');
    const [minSales, setMinSales] = useState('');
    const [maxSales, setMaxSales] = useState('');
    const [filters, setFilters] = useState({
        productName: '',
        status: '',
        minSales: '',
        maxSales: '',
    });

    const editId = searchParams.get('edit');
    // Find the product from the flattened data structure that InventoryTable creates
    const selectedProduct = useMemo(() => {
        if (!data || !editId) return null;
        return data
            .flatMap((item) => {
                const variants = item.variants || [];
                return variants.map((variant) => ({
                    ...item,
                    option: variant.option,
                    price: variant.price,
                    stock: variant.stock,
                    cost_price: variant.cost_price,
                    min_stock: variant.min_stock !== undefined ? variant.min_stock : item.min_stock,
                    variant_id: variant.variant_code as string,
                    variant_code: variant.variant_code,
                    orderCount: variant.order_count ?? 0,
                    returnCount: variant.return_count ?? 0,
                    totalSales:
                        variant.order_count &&
                        variant.return_count &&
                        variant.price &&
                        variant.order_count - variant.return_count > 0
                            ? `${(variant.order_count - variant.return_count) * variant.price}원`
                            : '0원',
                    product_id: item.product_id, // 반드시 포함
                }));
            })
            .find((p) => p.variant_id === String(editId));
    }, [data, editId]);

    const handleCloseModal = () => {
        searchParams.delete('edit');
        setSearchParams(searchParams);
    };

    const handleAddSave = async () => {
        try {
            await refetch();
            alert('상품이 성공적으로 추가되었습니다.');
        } catch (err) {
            console.error('상품 추가 실패:', err);
            alert('상품 추가 중 오류가 발생했습니다.');
        }
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (error) return <p>에러가 발생했습니다!</p>;

    const handleUpdateSave = async (updatedProduct: Product) => {
        try {
            console.log('🔄 handleUpdateSave - updatedProduct:', updatedProduct);
            console.log('🔄 handleUpdateSave - cost_price:', updatedProduct.cost_price);
            console.log('🔄 handleUpdateSave - min_stock:', updatedProduct.min_stock);
            console.log('🔄 handleUpdateSave - variant_id:', updatedProduct.variant_id);

            await updateInventoryVariant(String(updatedProduct.variant_id), updatedProduct);
            alert('상품이 성공적으로 수정되었습니다.');

            // 모달을 먼저 닫고 데이터를 새로고침
            handleCloseModal();

            // 캐시 무효화 후 데이터 새로고침
            await queryClient.invalidateQueries({ queryKey: ['inventories'] });
            await refetch();

            console.log('데이터 새로고침 완료');
        } catch (err) {
            console.error('상품 수정 실패:', err);
            alert('상품 수정 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (productId: string) => {
        if (!window.confirm('정말 이 상품을 삭제하시겠습니까?')) return;
        try {
            await deleteInventoryItem(Number(productId));
            alert('상품이 삭제되었습니다.');
            refetch(); // 목록 다시 불러오기
        } catch (err) {
            console.error('상품 삭제 실패:', err);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // 초기화 함수
    const handleReset = () => {
        setProductName('');
        setStatus('');
        setMinSales('');
        setMaxSales('');
        setFilters({ productName: '', status: '', minSales: '', maxSales: '' });
        refetch(); // 전체 데이터 다시 불러오기
    };

    return (
        <div className="p-6">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">재고 관리</h1>
                <div className="flex space-x-2">
                    <GreenButton text="상품 추가" icon={<FaPlus size={16} />} onClick={() => setAddModalOpen(true)} />
                    <PrimaryButton
                        text="POS 데이터 업로드"
                        icon={<FaFileArrowUp size={16} />}
                        onClick={() => alert('데이터 업로드')}
                    />
                </div>
            </div>

            {/* 검색 필드 */}
            <div className="mb-6">
                <InputField
                    productName={productName}
                    onProductNameChange={setProductName}
                    status={status}
                    onStatusChange={setStatus}
                    minSales={minSales}
                    onMinSalesChange={setMinSales}
                    maxSales={maxSales}
                    onMaxSalesChange={setMaxSales}
                    onSearch={() => {
                        // 판매합계 범위 유효성 검사
                        if (minSales && maxSales && parseInt(minSales) > parseInt(maxSales)) {
                            alert('판매합계 최소값이 최대값보다 클 수 없습니다.');
                            return;
                        }

                        setFilters({ productName, status, minSales, maxSales });
                        refetch(); // or apply in-memory filter
                    }}
                    onReset={handleReset}
                />
            </div>

            {/* 재고 테이블 */}
            <InventoryTable inventories={data ?? []} onDelete={handleDelete} filters={filters} />
            {selectedProduct && (
                <EditProductModal
                    isOpen={!!editId}
                    onClose={handleCloseModal}
                    product={selectedProduct}
                    onSave={handleUpdateSave}
                />
            )}
            {isAddModalOpen && (
                <AddProductModal
                    isOpen={isAddModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onSave={handleAddSave}
                />
            )}
        </div>
    );
};

export default InventoryPage;
