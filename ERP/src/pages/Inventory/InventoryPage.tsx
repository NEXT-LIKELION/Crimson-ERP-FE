import GreenButton from "../../components/button/GreenButton";
import PrimaryButton from "../../components/button/PrimaryButton";
import SecondaryButton from "../../components/button/SecondaryButton";
import { FaPlus, FaFileArrowUp } from "react-icons/fa6";
import { FaCodeBranch } from "react-icons/fa";
import InputField from "../../components/inputfield/InputField";
import InventoryTable from "../../components/inventorytable/InventoryTable";
import { useInventories } from "../../hooks/queries/useInventories";
import { deleteProductVariant, updateInventoryVariant, mergeVariants } from "../../api/inventory";
import { useSearchParams } from "react-router-dom";
import EditProductModal from "../../components/modal/EditProductModal";
import { useState, useMemo, useRef, useEffect } from "react";
import AddProductModal from "../../components/modal/AddProductModal";
import MergeVariantsModal from "../../components/modal/MergeVariantsModal";
import { Product } from "../../types/product";
import { useQueryClient } from "@tanstack/react-query";
import { uploadInventoryExcel } from "../../api/upload";

const InventoryPage = () => {
    const { data, isLoading, error, refetch } = useInventories();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isMergeModalOpen, setMergeModalOpen] = useState(false);
    const [productName, setProductName] = useState("");
    const [status, setStatus] = useState("");
    const [minSales, setMinSales] = useState("0");
    const [maxSales, setMaxSales] = useState("5000000");
    const [filters, setFilters] = useState({
        productName: "",
        status: "",
        minSales: "0",
        maxSales: "5000000",
    });


    const editId = searchParams.get("edit");
    const selectedProduct = useMemo(() => {
        if (!data || !editId) return null;
        // 백엔드에서 이미 평면화된 데이터를 직접 사용
        const result = data.find((item) => item.variant_code === String(editId));
        if (!result) return null;
        
        const processedResult = {
            ...result,
            cost_price: result.cost_price || 0,
            min_stock: result.min_stock || 0,
            variant_id: result.variant_code,
            orderCount: result.order_count ?? 0,
            returnCount: result.return_count ?? 0,
            totalSales: result.sales ? `${result.sales.toLocaleString()}원` : "0원",
            description: result.description || "",
            memo: result.memo || "",
            suppliers: result.suppliers || [],
        };

        console.log("selectedProduct:", processedResult);
        console.log("editId:", editId);
        return processedResult;
    }, [data, editId]);

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

    const handleUpdateSave = async (updatedProduct: Product) => {
        try {
            // variant_code를 우선 사용하고, 없으면 variant_id 사용
            const variantIdentifier = updatedProduct.variant_code || updatedProduct.variant_id;
            if (!variantIdentifier) {
                throw new Error("variant 식별자를 찾을 수 없습니다.");
            }

            console.log("handleUpdateSave - variantIdentifier:", variantIdentifier);
            console.log("handleUpdateSave - updatedProduct:", updatedProduct);

            await updateInventoryVariant(String(variantIdentifier), updatedProduct);
            alert("상품이 성공적으로 수정되었습니다.");
            handleCloseModal();
            await queryClient.invalidateQueries({ queryKey: ["inventories"] });
            await refetch();
        } catch (err) {
            console.error("상품 수정 실패:", err);
            alert("상품 수정 중 오류가 발생했습니다.");
        }
    };

    const handleVariantDelete = async (variantCode: string) => {
        // 백엔드에서 이미 평면화된 데이터를 직접 사용
        const variantToDelete = data?.find((item) => item.variant_code === variantCode);

        if (!variantToDelete) {
            alert("삭제할 품목을 찾을 수 없습니다.");
            return;
        }

        if (!window.confirm("정말 이 품목을 삭제하시겠습니까?")) return;

        try {
            await deleteProductVariant(variantCode);
            alert("품목이 삭제되었습니다.");
            refetch();
        } catch (err: any) {
            console.error("품목 삭제 실패:", err);
            if (err?.response?.status === 500) {
                alert("❌ 삭제 불가\n\n해당 상품은 주문 이력이 있어 삭제할 수 없습니다.\n주문 이력을 먼저 처리하거나 관리자에게 문의하세요.");
            } else {
                alert(err?.response?.data?.error || "삭제 중 오류가 발생했습니다.");
            }
        }
    };


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePOSButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handlePOSUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadInventoryExcel(file);
            alert("POS 데이터가 성공적으로 업로드되었습니다.");
            await refetch();
        } catch (err) {
            console.error("POS 업로드 오류:", err);
            alert("POS 데이터 업로드 중 오류 발생");
        } finally {
            e.target.value = "";
        }
    };

    const handleReset = () => {
        setProductName("");
        setStatus("");
        setMinSales("0");
        setMaxSales("1000000");
        setFilters({ productName: "", status: "", minSales: "0", maxSales: "1000000" });
        // refetch는 필요하지 않음 - 필터 변경으로 자동 업데이트됨
    };

    const handleMerge = async (targetCode: string, sourceCodes: string[]) => {
        try {
            await mergeVariants({
                target_variant_code: targetCode,
                source_variant_codes: sourceCodes
            });
            await queryClient.invalidateQueries({ queryKey: ["inventories"] });
            await refetch();
        } catch (error) {
            console.error("병합 실패:", error);
            throw error; // 모달에서 에러 처리하도록 re-throw
        }
    };

    if (isLoading) return <p>로딩 중...</p>;
    if (error) return <p>에러가 발생했습니다!</p>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">재고 관리</h1>
                <div className="flex space-x-2">
                    <GreenButton text="상품 추가" icon={<FaPlus size={16} />} onClick={() => setAddModalOpen(true)} />
                    <SecondaryButton text="상품 병합" icon={<FaCodeBranch size={16} />} onClick={() => setMergeModalOpen(true)} />
                    <PrimaryButton
                        text="POS 데이터 업로드"
                        icon={<FaFileArrowUp size={16} />}
                        onClick={handlePOSButtonClick}
                    />
                    <input
                        ref={fileInputRef}
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
                        const minValue = parseInt(minSales) || 0;
                        const maxValue = parseInt(maxSales) || 1000000;

                        if (minValue > maxValue) {
                            alert("판매합계 최소값이 최대값보다 클 수 없습니다.");
                            return;
                        }

                        console.log("검색 실행:", { productName, status, minSales, maxSales });
                        setFilters({
                            productName: productName.trim(),
                            status,
                            minSales: minValue.toString(),
                            maxSales: maxValue.toString(),
                        });
                        // refetch는 필요하지 않음 - 필터 변경으로 자동 업데이트됨
                    }}
                    onReset={handleReset}
                />
            </div>

            <InventoryTable
                inventories={data ?? []}
                onDelete={handleVariantDelete}
                filters={filters}
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
            {isMergeModalOpen && (
                <MergeVariantsModal
                    isOpen={isMergeModalOpen}
                    onClose={() => setMergeModalOpen(false)}
                    variants={data ?? []}
                    onMerge={handleMerge}
                />
            )}
        </div>
    );
};

export default InventoryPage;
