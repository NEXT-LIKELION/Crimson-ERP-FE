import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import { FaPlus, FaFileArrowUp } from 'react-icons/fa6';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import { updateInventoryItem } from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';

const InventoryPage = () => {
    const { data, isLoading, error, refetch } = useInventories();
    const [searchParams, setSearchParams] = useSearchParams();

    const editId = searchParams.get('edit');
    const selectedProduct = data?.find((p: any) => p.product_code === editId);

    const handleCloseModal = () => {
        searchParams.delete('edit');
        setSearchParams(searchParams);
    };

    const handleSave = async (updatedProduct: any) => {
        try {
            await updateInventoryItem(updatedProduct.product_code, updatedProduct);
            alert('상품이 성공적으로 수정되었습니다.');
            refetch();
            handleCloseModal();
        } catch (err) {
            console.error('상품 수정 실패:', err);
            alert('상품 수정 중 오류가 발생했습니다.');
        }
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (error) return <p>에러가 발생했습니다!</p>;
    return (
        <div className="p-6">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">재고 관리</h1>
                <div className="flex space-x-2">
                    <GreenButton text="상품 추가" icon={<FaPlus size={16} />} onClick={() => alert('상품 추가')} />
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
            <InventoryTable inventories={data ?? []} onSave={handleSave} />
            {selectedProduct && (
                <EditProductModal
                    isOpen={!!editId}
                    onClose={handleCloseModal}
                    product={selectedProduct}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default InventoryPage;
