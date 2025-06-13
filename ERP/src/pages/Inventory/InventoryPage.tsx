import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import { FaPlus, FaFileArrowUp } from 'react-icons/fa6';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import { deleteInventoryItem, updateInventoryItem } from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import { useState } from 'react';
import AddProductModal from '../../components/modal/AddProductModal';

const InventoryPage = () => {
    const { data, isLoading, error, refetch } = useInventories();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isAddModalOpen, setAddModalOpen] = useState(false);

    const editId = searchParams.get('edit');
    const selectedProduct = data?.find((p: any) => p.product_id === editId);

    const handleCloseModal = () => {
        searchParams.delete('edit');
        setSearchParams(searchParams);
    };

    const handleAddSave = async (_newProduct: any) => {
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

    const handleUpdateSave = async (updatedProduct: any) => {
        try {
            await updateInventoryItem(updatedProduct.id, updatedProduct);
            alert('상품이 성공적으로 수정되었습니다.');
            refetch();
        } catch (err) {
            console.error('상품 수정 실패:', err);
            alert('상품 수정 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (productId: number) => {
        if (!window.confirm('정말 이 상품을 삭제하시겠습니까?')) return;
        try {
            await deleteInventoryItem(productId);
            alert('상품이 삭제되었습니다.');
            refetch(); // 목록 다시 불러오기
        } catch (err) {
            console.error('상품 삭제 실패:', err);
            alert('삭제 중 오류가 발생했습니다.');
        }
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
                <InputField />
            </div>

            {/* 재고 테이블 */}
            <InventoryTable inventories={data ?? []} onSave={handleUpdateSave} onDelete={handleDelete} />
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
