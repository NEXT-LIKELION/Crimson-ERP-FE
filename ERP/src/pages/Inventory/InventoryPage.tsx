import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import SecondaryButton from '../../components/button/SecondaryButton';
import { FaPlus, FaFileArrowUp } from 'react-icons/fa6';
import { FaCodeBranch, FaHistory } from 'react-icons/fa';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import {
  deleteProductVariant,
  updateInventoryVariant,
  mergeVariants,
  fetchAllInventoriesForMerge,
  fetchFilteredInventoriesForExport,
} from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import AddProductModal from '../../components/modal/AddProductModal';
import MergeVariantsModal from '../../components/modal/MergeVariantsModal';
import StockAdjustmentModal from '../../components/modal/StockAdjustmentModal';
import StockHistoryModal from '../../components/modal/StockHistoryModal';
import { Product } from '../../types/product';
import { useQueryClient } from '@tanstack/react-query';
import { uploadInventoryExcel } from '../../api/upload';
import { usePermissions } from '../../hooks/usePermissions';
import * as XLSX from 'xlsx';
import { useAdjustStock } from '../../hooks/queries/useStockAdjustment';

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isMergeModalOpen, setMergeModalOpen] = useState(false);
  const [isStockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);
  const [isStockHistoryModalOpen, setStockHistoryModalOpen] = useState(false);
  const [selectedVariantForStock, setSelectedVariantForStock] = useState<{
    variant_code: string;
    product_id: string;
    name: string;
    option: string;
    current_stock: number;
    min_stock: number;
  } | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [minStock, setMinStock] = useState('0');
  const [maxStock, setMaxStock] = useState('1000');
  const [minSales, setMinSales] = useState('0');
  const [maxSales, setMaxSales] = useState('5000000');
  const [appliedFilters, setAppliedFilters] = useState<{
    product_name?: string;
    category?: string;
    status?: string;
    min_stock?: number;
    max_stock?: number;
    min_sales?: number;
    max_sales?: number;
  }>({});

  // URL에서 필터 파라미터 초기화 (초기 로드 시에만)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return; // 이미 초기화되었으면 실행하지 않음

    const urlName = searchParams.get('product_name') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlStatus = searchParams.get('status') || '';
    const urlMinStock = searchParams.get('min_stock') || '0';
    const urlMaxStock = searchParams.get('max_stock') || '1000';
    const urlMinSales = searchParams.get('min_sales') || '0';
    const urlMaxSales = searchParams.get('max_sales') || '5000000';

    setProductName(urlName);
    setCategory(urlCategory === '모든 카테고리' ? '' : urlCategory);
    setStatus(urlStatus === '모든 상태' ? '' : urlStatus);
    setMinStock(urlMinStock);
    setMaxStock(urlMaxStock);
    setMinSales(urlMinSales);
    setMaxSales(urlMaxSales);

    const filters: Record<string, string | number> = {};
    if (urlName) filters.product_name = urlName;
    if (urlCategory && urlCategory !== '모든 카테고리') filters.category = urlCategory;
    if (urlStatus && urlStatus !== '모든 상태') filters.status = urlStatus;
    if (urlMinStock !== '0' || urlMaxStock !== '1000') {
      filters.min_stock = parseInt(urlMinStock);
      filters.max_stock = parseInt(urlMaxStock);
    }
    if (urlMinSales !== '0' || urlMaxSales !== '5000000') {
      filters.min_sales = parseInt(urlMinSales);
      filters.max_sales = parseInt(urlMaxSales);
    }

    setAppliedFilters(filters);
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    infiniteScroll
  } = useInventories(appliedFilters);

  const adjustStockMutation = useAdjustStock();

  // 병합 모달용 전체 데이터 (모든 페이지 데이터 합치기)
  const [allMergeData, setAllMergeData] = useState<unknown[]>([]);

  // 전체 데이터에서 카테고리 목록 추출 (병합용 데이터 사용)
  const categoryOptions = useMemo(() => {
    if (!allMergeData || allMergeData.length === 0) return ['모든 카테고리'];

    const uniqueCategories = Array.from(
      new Set((allMergeData as { category?: string }[]).map((item) => item.category).filter(Boolean) as string[])
    );

    return ['모든 카테고리', ...uniqueCategories.sort()];
  }, [allMergeData]);

  // 병합 모달이 열릴 때만 데이터 로드 (lazy loading)
  const loadMergeData = async () => {
    if (allMergeData.length === 0) {
      try {
        console.log('🔄 Loading merge data...');
        const allData = await fetchAllInventoriesForMerge();
        setAllMergeData(allData);
      } catch (error) {
        console.error('전체 데이터 로드 실패:', error);
      }
    }
  };

  // URL 업데이트 함수 (페이지 파라미터 제거)
  const updateURL = useCallback(
    (newFilters: Record<string, string | number>) => {
      const params = new URLSearchParams();

      if (newFilters.product_name) params.set('product_name', String(newFilters.product_name));
      if (newFilters.category) params.set('category', String(newFilters.category));
      if (newFilters.status) params.set('status', String(newFilters.status));
      if (newFilters.min_stock !== undefined)
        params.set('min_stock', newFilters.min_stock.toString());
      if (newFilters.max_stock !== undefined)
        params.set('max_stock', newFilters.max_stock.toString());
      if (newFilters.min_sales !== undefined)
        params.set('min_sales', newFilters.min_sales.toString());
      if (newFilters.max_sales !== undefined)
        params.set('max_sales', newFilters.max_sales.toString());

      // edit 파라미터는 유지
      const editId = searchParams.get('edit');
      if (editId) params.set('edit', editId);

      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const editId = searchParams.get('edit');
  const selectedProduct = useMemo(() => {
    if (!data || !editId) return null;
    // 백엔드에서 이미 평면화된 데이터를 직접 사용
    const result = data.find((item: { variant_code: string }) => item.variant_code === String(editId));
    if (!result) return null;

    const processedResult = {
      ...result,
      cost_price: result.cost_price || 0,
      min_stock: result.min_stock || 0,
      variant_id: result.variant_code,
      orderCount: result.order_count ?? 0,
      returnCount: result.return_count ?? 0,
      totalSales: result.sales ? `${result.sales.toLocaleString()}원` : '0원',
      description: result.description || '',
      memo: result.memo || '',
      suppliers: result.suppliers || [],
    };


    return processedResult;
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
      // variant_code를 우선 사용하고, 없으면 variant_id 사용
      const variantIdentifier = updatedProduct.variant_code || updatedProduct.variant_id;
      if (!variantIdentifier) {
        throw new Error('variant 식별자를 찾을 수 없습니다.');
      }



      // suppliers와 readOnly 필드들 제외
      const { 
        suppliers, 
        sales, 
        cost_price, 
        order_count, 
        return_count, 
        stock,
        ...editableFields 
      } = updatedProduct;
      
      // readOnly 필드들은 사용되지 않지만 구조분해할당으로 제외하기 위해 필요
      void suppliers;
      void sales;
      void cost_price;
      void order_count;
      void return_count;
      void stock;

      // API에 전송할 수정 가능한 필드들만 포함
      const updateData = {
        ...editableFields,
        price: typeof editableFields.price === 'string' 
          ? Number(editableFields.price) 
          : editableFields.price,
        min_stock: typeof editableFields.min_stock === 'string'
          ? Number(editableFields.min_stock)
          : editableFields.min_stock,
      };


      
      await updateInventoryVariant(String(variantIdentifier), updateData);
      
      // 공급업체 정보가 배열로 제공된 경우 (향후 구현)
      if (Array.isArray(suppliers) && suppliers.length > 0) {

        // TODO: 공급업체 매핑 업데이트 API 구현 후 호출
      }
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
    // 백엔드에서 이미 평면화된 데이터를 직접 사용
    const variantToDelete = data?.find((item: { variant_code: string }) => item.variant_code === variantCode);

    if (!variantToDelete) {
      alert('삭제할 품목을 찾을 수 없습니다.');
      return;
    }

    if (!window.confirm('정말 이 품목을 삭제하시겠습니까?')) return;

    try {
      await deleteProductVariant(variantCode);
      alert('품목이 삭제되었습니다.');
      refetch();
    } catch (err: unknown) {
      console.error('품목 삭제 실패:', err);
      if ('response' in (err as object)) {
        const errorResponse = err as { response?: { status?: number } };
        if (errorResponse.response?.status === 500) {
          alert(
            '❌ 삭제 불가\n\n해당 상품은 주문 이력이 있어 삭제할 수 없습니다.\n주문 이력을 먼저 처리하거나 관리자에게 문의하세요.'
          );
        } else {
          alert('품목 삭제에 실패했습니다.');
        }
      } else {
        alert('삭제 중 오류가 발생했습니다.');
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
      alert('POS 데이터가 성공적으로 업로드되었습니다.');
      await refetch();
    } catch (err) {
      console.error('POS 업로드 오류:', err);
      alert('POS 데이터 업로드 중 오류 발생');
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = () => {
    setProductName('');
    setCategory('');
    setStatus('');
    setMinStock('0');
    setMaxStock('1000');
    setMinSales('0');
    setMaxSales('5000000');
    setAppliedFilters({});
    updateURL({});
    // 필터 초기화로 자동 refetch됨
  };

  const handleMerge = async (targetCode: string, sourceCodes: string[]) => {
    try {
      await mergeVariants({
        target_variant_code: targetCode,
        source_variant_codes: sourceCodes,
      });
      // 병합 후 모든 캐시 클리어하고 강제 새로고침
      await queryClient.clear(); // 모든 캐시 클리어
      await queryClient.invalidateQueries({ queryKey: ['inventories'] });
      await refetch();

      // 필터 초기화해서 최신 데이터 확인
      setAppliedFilters({});

    } catch (error) {
      console.error('병합 실패:', error);
      throw error; // 모달에서 에러 처리하도록 re-throw
    }
  };

  const handleExportToExcel = async () => {
    try {


      // 현재 필터링된 전체 데이터 가져오기 (페이지네이션 무시)
      let exportData: unknown[] = [];

      if (Object.keys(appliedFilters).length === 0) {
        // 필터가 없는 경우 → 전체 데이터 가져오기
        exportData = allMergeData; // 이미 로드된 전체 데이터 사용

      } else {
        // 필터가 있는 경우 → api에서 처리
        // API 파라미터명 변환
        const exportFilters: Record<string, unknown> = { ...appliedFilters };
        if (appliedFilters.min_stock !== undefined) {
          exportFilters.stock_gt = appliedFilters.min_stock - 1;
          delete exportFilters.min_stock;
        }
        if (appliedFilters.max_stock !== undefined) {
          exportFilters.stock_lt = appliedFilters.max_stock + 1;
          delete exportFilters.max_stock;
        }
        if (appliedFilters.min_sales !== undefined) {
          exportFilters.sales_min = appliedFilters.min_sales;
          delete exportFilters.min_sales;
        }
        if (appliedFilters.max_sales !== undefined) {
          exportFilters.sales_max = appliedFilters.max_sales;
          delete exportFilters.max_sales;
        }
        
        exportData = await fetchFilteredInventoriesForExport(exportFilters);
      }

      if (!exportData || exportData.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      // 엑셀에 표시할 데이터 변환
      const excelData = (exportData as Product[]).map((item, index: number) => ({
        번호: index + 1,
        상품코드: item.product_id,
        품목코드: item.variant_code,
        상품명: item.name,
        카테고리: item.category,
        옵션: item.option,
        판매가: item.price,
        매입가: item.cost_price,
        재고수량: Math.max(0, Number(item.stock) || 0),
        최소재고: Math.max(0, Number(item.min_stock) || 0),
        상태: item.stock === 0 ? '품절' : (item.stock || 0) < (item.min_stock || 0) ? '재고부족' : '정상',
        결제수량: item.order_count,
        환불수량: item.return_count,
        판매합계: item.sales,
        설명: item.description,
        메모: item.memo,
        '주요 공급업체': (() => {
          const itemWithSuppliers = item as { suppliers?: { is_primary: boolean; name: string }[] };
          return itemWithSuppliers.suppliers?.find((s) => s.is_primary)?.name || '';
        })(),
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 5 }, // 번호
        { wch: 12 }, // 상품코드
        { wch: 15 }, // 품목코드
        { wch: 25 }, // 상품명
        { wch: 10 }, // 카테고리
        { wch: 15 }, // 옵션
        { wch: 10 }, // 판매가
        { wch: 10 }, // 매입가
        { wch: 8 }, // 재고수량
        { wch: 8 }, // 최소재고
        { wch: 8 }, // 상태
        { wch: 8 }, // 결제수량
        { wch: 8 }, // 환불수량
        { wch: 12 }, // 판매합계
        { wch: 30 }, // 설명
        { wch: 20 }, // 메모
        { wch: 15 }, // 주요 공급업체
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '재고 현황');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
      const filename = `재고_현황_${dateStr}_${timeStr}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, filename);


    } catch (error) {
      console.error('엑셀 Export 오류:', error);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  // 재고 조정 핸들러
  const handleStockClick = (variant: {
    variant_code: string;
    product_id: string;
    name: string;
    option: string;
    current_stock: number;
    min_stock: number;
  }) => {
    setSelectedVariantForStock(variant);
    setStockAdjustModalOpen(true);
  };

  const handleStockAdjust = async (
    variantCode: string,
    data: {
      actual_stock: number;
      reason: string;
      updated_by: string;
    }
  ) => {
    await adjustStockMutation.mutateAsync({ variantCode, data });
  };

  const handleStockAdjustSuccess = () => {
    refetch();
    // EditProductModal이 열려있는 경우 해당 product 데이터도 업데이트
    if (editId && selectedVariantForStock) {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  };

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p>에러가 발생했습니다!</p>;

  return (
    <div className='p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>재고 관리</h1>
        <div className='flex space-x-2'>
          {permissions.canCreate('INVENTORY') && (
            <>
              <GreenButton
                text='상품 추가'
                icon={<FaPlus size={16} />}
                onClick={() => setAddModalOpen(true)}
              />
              <SecondaryButton
                text='상품 병합'
                icon={<FaCodeBranch size={16} />}
                onClick={async () => {
                  await loadMergeData(); // 병합 데이터 로드
                  setMergeModalOpen(true);
                }}
              />
              <SecondaryButton
                text='재고 변경 이력'
                icon={<FaHistory size={16} />}
                onClick={() => setStockHistoryModalOpen(true)}
              />
              <PrimaryButton
                text='POS 데이터 업로드'
                icon={<FaFileArrowUp size={16} />}
                onClick={handlePOSButtonClick}
              />
            </>
          )}
          <input
            ref={fileInputRef}
            id='posUploadInput'
            type='file'
            accept='.xlsx,.xls'
            className='hidden'
            onChange={handlePOSUpload}
          />
        </div>
      </div>

      <div className='mb-6'>
        <InputField
          productName={productName}
          onProductNameChange={setProductName}
          category={category}
          onCategoryChange={setCategory}
          categoryOptions={categoryOptions}
          status={status}
          onStatusChange={setStatus}
          minStock={minStock}
          onMinStockChange={setMinStock}
          maxStock={maxStock}
          onMaxStockChange={setMaxStock}
          minSales={minSales}
          onMinSalesChange={setMinSales}
          maxSales={maxSales}
          onMaxSalesChange={setMaxSales}
          onSearch={() => {
            // 유효성 검사
            const minSalesValue = parseInt(minSales) || 0;
            const maxSalesValue = parseInt(maxSales) || 5000000;
            const minStockValue = parseInt(minStock) || 0;
            const maxStockValue = maxStock ? parseInt(maxStock) : 1000;

            if (minSalesValue > maxSalesValue) {
              alert('판매합계 최소값이 최대값보다 클 수 없습니다.');
              return;
            }

            if (minStockValue > maxStockValue) {
              alert('재고수량 최소값이 최대값보다 클 수 없습니다.');
              return;
            }

            // 검색 실행
            const newFilters: Record<string, string | number> = {};
            
            // 상품명 필터
            if (productName.trim()) {
              newFilters.product_name = productName.trim();
            }
            
            // 카테고리 필터
            if (category && category !== '모든 카테고리') {
              newFilters.category = category;
            }
            
            // 상태 필터
            if (status && status !== '모든 상태') {
              newFilters.status = status;
            }
            
            // 재고 필터 (기본값이 아닌 경우만)
            const isDefaultStock = minStockValue === 0 && maxStockValue === 1000;
            if (!isDefaultStock) {
              newFilters.min_stock = minStockValue;
              newFilters.max_stock = maxStockValue;
            }
            
            // 판매 필터 (기본값이 아닌 경우만)
            const isDefaultSales = minSalesValue === 0 && maxSalesValue === 5000000;
            if (!isDefaultSales) {
              newFilters.min_sales = minSalesValue;
              newFilters.max_sales = maxSalesValue;
            }
            
            console.log('🔍 Setting applied filters:', newFilters);
            setAppliedFilters(newFilters);
            updateURL(newFilters);
          }}
          onReset={handleReset}
        />
      </div>

      <InventoryTable
        inventories={data ?? []}
        onDelete={handleVariantDelete}
        onExportToExcel={handleExportToExcel}
        // 무한 스크롤 관련 props
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        infiniteScroll={infiniteScroll}
      />
      {selectedProduct && (
        <EditProductModal
          isOpen={!!editId}
          onClose={handleCloseModal}
          product={selectedProduct}
          onSave={handleUpdateSave}
          onStockAdjustClick={handleStockClick}
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
          variants={allMergeData as Product[]}
          onMerge={handleMerge}
        />
      )}
      {isStockAdjustModalOpen && selectedVariantForStock && (
        <StockAdjustmentModal
          isOpen={isStockAdjustModalOpen}
          onClose={() => {
            setStockAdjustModalOpen(false);
            setSelectedVariantForStock(null);
          }}
          variant={selectedVariantForStock}
          onAdjust={handleStockAdjust}
          onSuccess={handleStockAdjustSuccess}
        />
      )}
      {isStockHistoryModalOpen && (
        <StockHistoryModal
          isOpen={isStockHistoryModalOpen}
          onClose={() => setStockHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
