import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import { FaPlus, FaFileArrowUp } from 'react-icons/fa6';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import { deleteProductVariant, updateInventoryVariant } from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import { useState, useMemo } from 'react';
import AddProductModal from '../../components/modal/AddProductModal';
import { Product } from '../../types/product';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

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
        minSales: minSales ? String(parseInt(minSales)) : '',
        maxSales: maxSales ? String(parseInt(maxSales)) : '',
    });

    const [deletedVariant, setDeletedVariant] = useState<Product | null>(null);

    const editId = searchParams.get('edit');
    const selectedProduct = useMemo(() => {
        if (!data || !editId) return null;
        return (
            data
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
                        product_id: item.product_id,
                    }));
                })
                .find((p) => p.variant_id === String(editId)) || null
        );
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

    const handleUpdateSave = async (updatedProduct: Product) => {
        try {
            await updateInventoryVariant(String(updatedProduct.variant_id), updatedProduct);
            alert('상품이 성공적으로 수정되었습니다.');
            handleCloseModal();
            await queryClient.invalidateQueries({ queryKey: ['inventories'] });
            await refetch();
        } catch (err) {
            console.error('상품 수정 실패:', err);
            alert('상품 수정 중 오류가 발생했습니다.');
        }
    };

    const handleVariantDelete = async (variantCode: string) => {
        const flatVariants =
            data?.flatMap(
                (item) =>
                    item.variants?.map((variant) => ({
                        ...item,
                        ...variant,
                        variant_id: variant.variant_code,
                        product_id: item.product_id,
                    })) || []
            ) || [];

        const variantToDelete = flatVariants.find((v) => v?.variant_id === variantCode);

        if (!variantToDelete) {
            alert('삭제할 품목을 찾을 수 없습니다.');
            return;
        }

        if (!window.confirm('정말 이 품목을 삭제하시겠습니까?')) return;

        try {
            setDeletedVariant(variantToDelete as Product);
            await deleteProductVariant(variantCode);
            alert('품목이 삭제되었습니다.');
            refetch();
        } catch (err: any) {
            console.error('품목 삭제 실패:', err);
            alert(err?.response?.data?.error || '삭제 중 오류가 발생했습니다.');
            setDeletedVariant(null);
        }
    };

    const handleUndoDelete = async () => {
        if (!deletedVariant) return;

        try {
            await updateInventoryVariant(String(deletedVariant.variant_id), deletedVariant);
            alert('삭제가 취소되어 품목이 복원되었습니다.');
            setDeletedVariant(null);
            refetch();
        } catch (err) {
            console.error('복원 실패:', err);
            alert('복원 중 오류가 발생했습니다.');
        }
    };

    const handlePOSUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // 1. 엑셀 파일 읽기
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // 2. 시트 데이터를 JSON으로 변환 (헤더 자동 매칭)
            const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

            // 3. 각 행마다 품목코드와 판매수량 추출 후 재고 차감
            for (const row of jsonData) {
                // 엑셀 컬럼명과 정확히 일치하는지 확인
                const variantCode = row['품목코드'] || row['상품 품목코드'] || row['상품코드'];
                const salesCount = row['판매수량'] || row['결제수량'] || row['판매수량'];

                if (!variantCode || !salesCount) continue;

                // API 호출: 재고 차감 (판매수량만큼)
                await updateInventoryVariant(String(variantCode), {
                    // 기존 재고에서 판매수량만큼 차감
                    stock: -parseInt(salesCount, 10),
                });
            }

            alert('POS 데이터가 성공적으로 처리되었습니다.');
            await refetch();
        } catch (err) {
            console.error('POS 업로드 오류:', err);
            alert('POS 데이터 업로드 중 오류 발생');
        } finally {
            e.target.value = ''; // 동일 파일 재선택 가능
        }
    };

    const handleReset = () => {
        setProductName('');
        setStatus('');
        setMinSales('');
        setMaxSales('');
        setFilters({ productName: '', status: '', minSales: '', maxSales: '' });
        refetch();
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (error) return <p>에러가 발생했습니다!</p>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">재고 관리</h1>
                <div className="flex space-x-2">
                    <GreenButton text="상품 추가" icon={<FaPlus size={16} />} onClick={() => setAddModalOpen(true)} />
                    <label htmlFor="posUploadInput" className="cursor-pointer">
                        <PrimaryButton text="POS 데이터 업로드" icon={<FaFileArrowUp size={16} />} />
                    </label>
                    <input
                        id="posUploadInput"
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        onChange={handlePOSUpload}
                    />
                </div>
            </div>

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
                        if (minSales && maxSales && parseInt(minSales) > parseInt(maxSales)) {
                            alert('판매합계 최소값이 최대값보다 클 수 없습니다.');
                            return;
                        }
                        setFilters({ productName, status, minSales, maxSales });
                        refetch();
                    }}
                    onReset={handleReset}
                />
            </div>

            <InventoryTable
                inventories={data ?? []}
                onDelete={handleVariantDelete}
                filters={filters}
                deletedVariant={deletedVariant}
                onUndoDelete={handleUndoDelete}
            />
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
