import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import SecondaryButton from '../../components/button/SecondaryButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaPlus, FaFileArrowUp, FaCodePullRequest } from 'react-icons/fa6';
import { FaHistory, FaUndo } from 'react-icons/fa';
import { FiInfo } from 'react-icons/fi';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import { useInventories } from '../../hooks/queries/useInventories';
import {
  deleteProductVariant,
  updateInventoryVariant,
  mergeVariants,
  fetchAllInventoriesForMerge,
  fetchFilteredInventoriesForExport,
  fetchCategories,
} from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import AddProductModal from '../../components/modal/AddProductModal';
import MergeVariantsModal from '../../components/modal/MergeVariantsModal';
import StockAdjustmentModal from '../../components/modal/StockAdjustmentModal';
import StockHistoryModal from '../../components/modal/StockHistoryModal';
import InventoryRollbackModal from '../../components/modal/InventoryRollbackModal';
import InventoryTabs from '../../components/tabs/InventoryTabs';
import { Product, InventorySnapshot } from '../../types/product';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { uploadInventoryExcel } from '../../api/upload';
import { usePermissions } from '../../hooks/usePermissions';
import * as XLSX from 'xlsx';
import { useAdjustStock } from '../../hooks/queries/useStockAdjustment';
import { useInventorySnapshots } from '../../hooks/queries/useInventorySnapshots';
import { getAllChannelUpdateDates, detectUploadChannel } from '../../utils/snapshotAnalyzer';
import { getErrorMessage } from '../../utils/errorHandling';

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isMergeModalOpen, setMergeModalOpen] = useState(false);
  const [isStockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);
  const [isStockHistoryModalOpen, setStockHistoryModalOpen] = useState(false);
  const [isRollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [isPOSUploading, setIsPOSUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'offline' | 'online'>('all');

  // POS 마지막 업데이트 날짜 조회 (기존 방식 유지)
  const { data: snapshotsData } = useInventorySnapshots({ page: 1 });

  // 스냅샷에 채널 정보 추가 (기존 데이터 활용)
  const snapshotsWithChannel = useMemo(() => {
    if (!snapshotsData?.results || snapshotsData.results.length === 0) {
      return [];
    }

    const snapshots = snapshotsData.results;

    return snapshots.map((snapshot: InventorySnapshot) => {
      const detectedChannel = detectUploadChannel(snapshot);

      return {
        ...snapshot,
        detectedChannel,
      };
    });
  }, [snapshotsData]);

  const channelUpdateDates = useMemo(() => {
    return getAllChannelUpdateDates(snapshotsWithChannel);
  }, [snapshotsWithChannel]);

  const lastUpdateDates = useMemo(() => {
    const formatDate = (dateString: string | null) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : format(date, 'yyyy-MM-dd', { locale: ko });
    };

    const result = {
      onlineDate: formatDate(channelUpdateDates.onlineDate),
      offlineDate: formatDate(channelUpdateDates.offlineDate),
      allDate: formatDate(channelUpdateDates.allDate),
    };

    return result;
  }, [channelUpdateDates]);

  // 현재 탭에 따른 업데이트 날짜 결정
  const currentUpdateDate = useMemo(() => {
    if (activeTab === 'all') {
      // 전체 탭인 경우 온라인/오프라인 날짜 객체 반환
      const result: { onlineDate?: string; offlineDate?: string } = {};
      if (lastUpdateDates.onlineDate) result.onlineDate = lastUpdateDates.onlineDate;
      if (lastUpdateDates.offlineDate) result.offlineDate = lastUpdateDates.offlineDate;
      return Object.keys(result).length > 0 ? result : undefined;
    } else if (activeTab === 'online') {
      return lastUpdateDates.onlineDate || undefined;
    } else if (activeTab === 'offline') {
      return lastUpdateDates.offlineDate || undefined;
    }
    return undefined;
  }, [activeTab, lastUpdateDates]);

  const handleTabChange = (tab: 'all' | 'offline' | 'online') => {
    setActiveTab(tab);

    // 탭 변경 시 현재 필터에 채널 정보 추가/제거
    const newFilters = { ...appliedFilters };
    if (tab === 'all') {
      // 전체 탭이면 채널 필터 제거
      delete newFilters.channel;
    } else {
      // 채널 필터링 활성화
      newFilters.channel = tab;
    }

    setAppliedFilters(newFilters);
    updateURL(newFilters);
  };
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
    channel?: string;
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
    infiniteScroll,
  } = useInventories(appliedFilters);

  const adjustStockMutation = useAdjustStock();

  // 병합 모달용 전체 데이터 (모든 페이지 데이터 합치기)
  const [allMergeData, setAllMergeData] = useState<unknown[]>([]);
  const [isMergeDataLoading, setIsMergeDataLoading] = useState(false);

  // 카테고리 목록 상태 관리
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['모든 카테고리']);

  // 카테고리 목록 불러오기
  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      const categories = response.data || [];
      setCategoryOptions(['모든 카테고리', ...categories.sort()]);
    } catch (error) {
      console.error('카테고리 목록 로드 실패:', error);
      setCategoryOptions(['모든 카테고리']);
    }
  };

  // 컴포넌트 마운트 시 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 병합 모달이 열릴 때만 데이터 로드 (lazy loading)
  const loadMergeData = async () => {
    if (allMergeData.length === 0) {
      setIsMergeDataLoading(true);
      try {
        const allData = await fetchAllInventoriesForMerge();
        setAllMergeData(allData);
      } catch (error) {
        alert('전체 데이터를 불러오는 중 오류가 발생했습니다: ' + getErrorMessage(error));
      } finally {
        setIsMergeDataLoading(false);
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
    const result = data.find(
      (item: { variant_code: string }) => item.variant_code === String(editId)
    );
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
      // React Query 캐시 무효화 - 상품 관련 모든 쿼리 새로고침
      await queryClient.invalidateQueries({ queryKey: ['inventories'] });
      await queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // 데이터 새로고침
      await refetch();
      alert('상품이 성공적으로 추가되었습니다.');
    } catch (err) {
      alert('상품 추가 중 오류가 발생했습니다: ' + getErrorMessage(err));
    }
  };

  const handleUpdateSave = async (updatedProduct: Product) => {
    try {
      // variant_code를 우선 사용하고, 없으면 variant_id 사용
      const variantIdentifier = updatedProduct.variant_code || updatedProduct.variant_id;
      if (!variantIdentifier) {
        throw new Error('variant 식별자를 찾을 수 없습니다.');
      }

      // readOnly 필드들만 제외
      const { sales, cost_price, order_count, return_count, stock, ...editableFields } =
        updatedProduct;

      // readOnly 필드들은 사용되지 않지만 구조분해할당으로 제외하기 위해 필요
      void sales;
      void cost_price;
      void order_count;
      void return_count;
      void stock;

      // API에 전송할 수정 가능한 필드들 (suppliers 포함)
      const updateData = {
        ...editableFields,
        price:
          typeof editableFields.price === 'string'
            ? Number(editableFields.price)
            : editableFields.price,
        min_stock:
          typeof editableFields.min_stock === 'string'
            ? Number(editableFields.min_stock)
            : editableFields.min_stock,
      };

      await updateInventoryVariant(String(variantIdentifier), updateData);

      alert('상품이 성공적으로 수정되었습니다.');
      handleCloseModal();
      await queryClient.invalidateQueries({ queryKey: ['inventories'] });
      await refetch();
    } catch (err) {
      alert('상품 수정 중 오류가 발생했습니다: ' + getErrorMessage(err));
    }
  };

  const handleVariantDelete = async (variantCode: string) => {
    // 백엔드에서 이미 평면화된 데이터를 직접 사용
    const variantToDelete = data?.find(
      (item: { variant_code: string }) => item.variant_code === variantCode
    );

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

    setIsPOSUploading(true);
    try {
      await uploadInventoryExcel(file);
      alert('POS 데이터가 성공적으로 업로드되었습니다.');
      // 재고 데이터와 스냅샷 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySnapshots'] });
      await refetch();
    } catch (err) {
      alert('POS 데이터 업로드 중 오류 발생: ' + getErrorMessage(err));
      console.log(err);
    } finally {
      setIsPOSUploading(false);
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

    // 현재 탭이 전체가 아닌 경우 채널 필터는 유지
    const baseFilters: Record<string, string | number> = {};
    if (activeTab !== 'all') {
      // TODO: 백엔드 구현 후 실제 채널 필터링 추가
      // baseFilters.channel = activeTab;
    }

    setAppliedFilters(baseFilters);
    updateURL(baseFilters);
    // 필터 초기화로 자동 refetch됨
  };

  const handleMerge = async (targetCode: string, sourceCodes: string[]) => {
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
        상태:
          item.stock === 0
            ? '품절'
            : (item.stock || 0) < (item.min_stock || 0)
              ? '재고부족'
              : '정상',
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
      alert('엑셀 파일 생성 중 오류가 발생했습니다: ' + getErrorMessage(error));
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

  // 모든 탭에서 동일한 API 기반 데이터 사용
  const tabData = data ?? [];

  if (error) return <p>에러가 발생했습니다!</p>;

  return (
    <div className='relative p-6'>
      {isLoading && <LoadingSpinner overlay text='재고 데이터를 불러오는 중...' />}
      {isPOSUploading && <LoadingSpinner overlay text='POS 데이터를 업로드하는 중...' />}
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
                icon={<FaCodePullRequest size={16} />}
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
              <SecondaryButton
                text='POS 롤백'
                icon={<FaUndo size={16} />}
                onClick={() => setRollbackModalOpen(true)}
              />
              <div className='flex flex-col items-end gap-1'>
                <div className='flex items-center gap-2'>
                  <PrimaryButton
                    text='POS 데이터 업로드'
                    icon={<FaFileArrowUp size={16} />}
                    onClick={handlePOSButtonClick}
                    disabled={isPOSUploading}
                  />
                  <div className='group relative flex items-center'>
                    <FiInfo
                      className='h-4 w-4 cursor-help text-gray-500 hover:text-gray-700'
                      aria-label='파일명 규칙 안내'
                    />
                    <div className='invisible absolute top-6 right-0 z-50 w-72 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg group-hover:visible'>
                      <div className='mb-2 font-semibold'>파일명 규칙</div>
                      <div className='space-y-1'>
                        <p>
                          • 파일명에{' '}
                          <span className='rounded bg-gray-800 px-1 font-mono'>_online</span> 또는{' '}
                          <span className='rounded bg-gray-800 px-1 font-mono'>_offline</span>을
                          반드시 포함해주세요
                        </p>
                        <p className='text-gray-300'>예시:</p>
                        <p className='rounded bg-gray-800 px-2 py-1 font-mono text-xs'>
                          재고_online_20250115.xlsx
                        </p>
                        <p className='rounded bg-gray-800 px-2 py-1 font-mono text-xs'>
                          POS데이터_offline_0115.xlsx
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <span className='text-xs text-gray-500'>
                  파일명: *_online.xlsx 또는 *_offline.xlsx
                </span>
              </div>
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

      {/* 탭 메뉴 */}
      <InventoryTabs activeTab={activeTab} onTabChange={handleTabChange} />

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

            // 채널 필터 (탭에 따라)
            if (activeTab !== 'all') {
              newFilters.channel = activeTab;
            }

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

            setAppliedFilters(newFilters);
            updateURL(newFilters);
          }}
          onReset={handleReset}
        />
      </div>

      <InventoryTable
        inventories={tabData}
        onDelete={handleVariantDelete}
        onExportToExcel={handleExportToExcel}
        lastUpdateDate={currentUpdateDate}
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
      {isRollbackModalOpen && (
        <InventoryRollbackModal
          isOpen={isRollbackModalOpen}
          onClose={() => setRollbackModalOpen(false)}
          onSuccess={refetch}
        />
      )}

      {/* 병합 데이터 로딩 스피너 */}
      {isMergeDataLoading && (
        <LoadingSpinner overlay={true} text='병합용 데이터를 불러오는 중...' />
      )}
    </div>
  );
};

export default InventoryPage;
