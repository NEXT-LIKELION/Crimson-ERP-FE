import GreenButton from "../../components/button/GreenButton";
import PrimaryButton from "../../components/button/PrimaryButton";
import { FaPlus, FaFileArrowUp } from "react-icons/fa6";
import InputField from "../../components/inputfield/InputField";
import InventoryTable from "../../components/inventorytable/InventoryTable";
import { useInventories } from "../../hooks/queries/useInventories";
import { deleteInventoryItem, updateInventoryItem } from "../../api/inventory";
import { useSearchParams } from "react-router-dom";
import EditProductModal from "../../components/modal/EditProductModal";
import { useState } from "react";
import AddProductModal from "../../components/modal/AddProductModal";
import { Product } from "../../types/product";

const InventoryPage = () => {
    const { data, isLoading, error, refetch } = useInventories();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [productName, setProductName] = useState("");
    const [status, setStatus] = useState("");
    const [filters, setFilters] = useState({ productName: "", status: "" });

    const editId = searchParams.get("edit");
    // Find the product from the flattened data structure that InventoryTable creates
    const selectedProduct = data
        ?.flatMap((item) => {
            const variants = item.variants || [];
            return variants.map((variant) => ({
                ...item,
                option: variant.option,
                price: variant.price,
                stock: variant.stock,
                variant_id: variant.variant_code as string,
                orderCount: variant.order_count ?? 0,
                returnCount: variant.return_count ?? 0,
                totalSales:
                    variant.order_count &&
                    variant.return_count &&
                    variant.price &&
                    variant.order_count - variant.return_count > 0
                        ? `${
                              (variant.order_count - variant.return_count) *
                              variant.price
                          }원`
                        : "0원",
            }));
        })
        .find((p) => p.variant_id === String(editId));

    const handleCloseModal = () => {
        searchParams.delete("edit");
        setSearchParams(searchParams);
    };

    const handleAddSave = async () => {
        try {
            await refetch();
            alert("상품이 성공적으로 추가되었습니다.");
        } catch (err) {
            console.error("상품 추가 실패:", err);
            alert("상품 추가 중 오류가 발생했습니다.");
        }
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (error) return <p>에러가 발생했습니다!</p>;

    const handleUpdateSave = async (updatedProduct: Product) => {
        try {
            await updateInventoryItem(updatedProduct.id, updatedProduct);
            alert("상품이 성공적으로 수정되었습니다.");
            refetch();
        } catch (err) {
            console.error("상품 수정 실패:", err);
            alert("상품 수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (productId: string) => {
        if (!window.confirm("정말 이 상품을 삭제하시겠습니까?")) return;
        try {
            await deleteInventoryItem(Number(productId));
            alert("상품이 삭제되었습니다.");
            refetch(); // 목록 다시 불러오기
        } catch (err) {
            console.error("상품 삭제 실패:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="p-6">
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">재고 관리</h1>
                <div className="flex space-x-2">
                    <GreenButton
                        text="상품 추가"
                        icon={<FaPlus size={16} />}
                        onClick={() => setAddModalOpen(true)}
                    />
                    <PrimaryButton
                        text="POS 데이터 업로드"
                        icon={<FaFileArrowUp size={16} />}
                        onClick={() => alert("데이터 업로드")}
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
                    onSearch={() => {
                        setFilters({ productName, status });
                        refetch(); // or apply in-memory filter
                    }}
                />
            </div>

            {/* 재고 테이블 */}
            <InventoryTable
                inventories={
                    data?.filter(
                        (item) =>
                            (!filters.productName ||
                                item.name
                                    .toLowerCase()
                                    .includes(
                                        filters.productName.toLowerCase()
                                    )) &&
                            (!filters.status || item.status === filters.status)
                    ) ?? []
                }
                onDelete={handleDelete}
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
