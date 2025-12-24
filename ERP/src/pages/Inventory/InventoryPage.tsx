import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import SecondaryButton from '../../components/button/SecondaryButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FaPlus, FaFileArrowUp, FaCodePullRequest, FaFileArrowDown } from 'react-icons/fa6';
import { FaHistory } from 'react-icons/fa';
import InputField from '../../components/inputfield/InputField';
import InventoryTable from '../../components/inventorytable/InventoryTable';
import VariantStatusTable from '../../components/table/VariantStatusTable';
import { useInventories, type ApiProductVariant } from '../../hooks/queries/useInventories';
import { useVariantStatus } from '../../hooks/queries/useVariantStatus';
import {
  deleteProductVariant,
  updateInventoryVariant,
  mergeVariants,
  fetchAllInventoriesForMerge,
  fetchFilteredInventoriesForExport,
  fetchCategories,
  uploadVariantStatusExcel,
  downloadVariantStatusExcel,
  fetchVariantDetail,
} from '../../api/inventory';
import { useSearchParams } from 'react-router-dom';
import EditProductModal from '../../components/modal/EditProductModal';
import AddProductModal from '../../components/modal/AddProductModal';
import MergeVariantsModal from '../../components/modal/MergeVariantsModal';
import StockAdjustmentModal from '../../components/modal/StockAdjustmentModal';
import StockHistoryModal from '../../components/modal/StockHistoryModal';
import { Product, ProductVariantStatus } from '../../types/product';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { uploadInventoryExcel } from '../../api/upload';
import { usePermissions } from '../../hooks/usePermissions';
import * as XLSX from 'xlsx';
import { getErrorMessage } from '../../utils/errorHandling';

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const permissions = usePermissions();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isMergeModalOpen, setMergeModalOpen] = useState(false);
  const [isStockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);
  const [isStockHistoryModalOpen, setStockHistoryModalOpen] = useState(false);
  const [isPOSUploading, setIsPOSUploading] = useState(false);
  const [isStatusExcelUploading, setIsStatusExcelUploading] = useState(false);
  const [isStatusExcelDownloading, setIsStatusExcelDownloading] = useState(false);

  // 월별 재고 현황 관련 state
  const [viewMode, setViewMode] = useState<'variant' | 'status'>('variant'); // 'variant': 기존 뷰, 'status': 월별 현황
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusSelectedVariantCode, setStatusSelectedVariantCode] = useState<string | null>(null);

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
    setCategory(urlCategory);
    setStatus(urlStatus === '모든 상태' ? '' : urlStatus);
    setMinStock(urlMinStock);
    setMaxStock(urlMaxStock);
    setMinSales(urlMinSales);
    setMaxSales(urlMaxSales);

    const filters: Record<string, string | number> = {};
    if (urlName) filters.product_name = urlName;
    if (urlCategory) filters.category = urlCategory;
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
    data: rawData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    infiniteScroll,
  } = useInventories(appliedFilters);

  // data 타입을 명시적으로 보장 (ApiProductVariant[])
  const data: ApiProductVariant[] = useMemo(() => rawData ?? [], [rawData]);

  // 월별 재고 현황 데이터 조회
  const { data: variantStatusData, isLoading: isStatusLoading } = useVariantStatus({
    year: selectedYear,
    month: selectedMonth,
    page: 1,
  });

  // 월별 재고 현황에서 선택된 variant 상세 정보 조회
  const { data: statusSelectedVariantDetail } = useQuery({
    queryKey: ['variantDetail', statusSelectedVariantCode],
    queryFn: () => fetchVariantDetail(statusSelectedVariantCode!),
    enabled: !!statusSelectedVariantCode,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  // 병합 모달용 전체 데이터 (모든 페이지 데이터 합치기)
  const [allMergeData, setAllMergeData] = useState<unknown[]>([]);
  const [isMergeDataLoading, setIsMergeDataLoading] = useState(false);

  // 카테고리 목록 조회 (React Query 사용)
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    gcTime: 1000 * 60 * 10, // 10분간 가비지 컬렉션 방지
  });

  // 카테고리 옵션 처리 (중복 제거 및 정렬)
  const categoryOptions = useMemo(() => {
    const categories = categoriesData?.data || [];
    // 중복 제거 및 정렬
    const uniqueCategories = [...new Set(categories)].sort();
    return uniqueCategories;
  }, [categoriesData]);

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
  const selectedProduct = useMemo(():
    | (ApiProductVariant & {
        variant_id: string;
        orderCount: number;
        returnCount: number;
        totalSales: string;
      })
    | null => {
    // 월별 재고 현황에서 선택된 variant가 있는 경우
    if (statusSelectedVariantDetail?.data) {
      const result = statusSelectedVariantDetail.data;
      return {
        ...result,
        name: result.offline_name || result.name || '',
        cost_price: result.cost_price || 0,
        min_stock: result.min_stock || 0,
        variant_id: result.variant_code || '',
        orderCount: result.order_count ?? 0,
        returnCount: result.return_count ?? 0,
        totalSales: result.sales ? `${String(result.sales).replace(/\D/g, '')}` : '0',
        description: result.description || '',
        memo: result.memo || '',
        suppliers: result.suppliers || '',
      };
    }

    // 기존 상품 관리에서 선택된 variant가 있는 경우
    if (!data || !editId) return null;
    // 백엔드에서 이미 평면화된 데이터를 직접 사용
    const result = data.find((item) => item.variant_code === String(editId));
    if (!result) return null;

    const processedResult = {
      ...result,
      name: result.offline_name || result.name || '',
      cost_price: result.cost_price || 0,
      min_stock: result.min_stock || 0,
      variant_id: result.variant_code || '',
      orderCount: result.order_count ?? 0,
      returnCount: result.return_count ?? 0,
      totalSales: result.sales ? `${String(result.sales).replace(/\D/g, '')}` : '0',
      description: result.description || '',
      memo: result.memo || '',
      suppliers: result.suppliers || '',
    };

    return processedResult;
  }, [data, editId, statusSelectedVariantDetail]);

  const handleCloseModal = () => {
    // 기존 상품 관리에서 열린 모달인 경우
    if (editId) {
      searchParams.delete('edit');
      setSearchParams(searchParams);
    }
    // 월별 재고 현황에서 열린 모달인 경우
    if (statusSelectedVariantCode) {
      setStatusSelectedVariantCode(null);
    }
  };

  const handleAddSave = async () => {
    try {
      // React Query 캐시 무효화 - 상품 관련 모든 쿼리 새로고침
      await queryClient.invalidateQueries({ queryKey: ['inventories'] });
      await queryClient.invalidateQueries({ queryKey: ['productOptions'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] }); // 카테고리 목록도 새로고침

      // 데이터 새로고침
      await refetch();
      alert('상품이 성공적으로 추가되었습니다.');
    } catch (err) {
      alert('상품 추가 중 오류가 발생했습니다: ' + getErrorMessage(err));
    }
  };

  const handleUpdateSave = async (updatedProduct: Product | ApiProductVariant) => {
    try {
      // variant_code를 우선 사용하고, 없으면 variant_id 사용 (Product 타입 호환성)
      const variantIdentifier =
        updatedProduct.variant_code ||
        ('variant_id' in updatedProduct ? updatedProduct.variant_id : undefined);
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
      await queryClient.invalidateQueries({ queryKey: ['categories'] }); // 카테고리 목록도 새로고침
      await queryClient.invalidateQueries({
        queryKey: ['variantDetail', statusSelectedVariantCode],
      }); // 상세 정보도 새로고침
      if (statusSelectedVariantCode) {
        // 월별 재고 현황도 새로고침
        await queryClient.invalidateQueries({
          queryKey: ['variantStatus', selectedYear, selectedMonth],
        });
      }
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
  const statusExcelInputRef = useRef<HTMLInputElement>(null);

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
      // 재고 데이터 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      await refetch();
    } catch (err) {
      alert('POS 데이터 업로드 중 오류 발생: ' + getErrorMessage(err));
    } finally {
      setIsPOSUploading(false);
      e.target.value = '';
    }
  };

  // 월별 재고 현황 엑셀 업로드 핸들러
  const handleStatusExcelButtonClick = () => {
    statusExcelInputRef.current?.click();
  };

  const handleStatusExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      alert('Excel 파일(.xlsx 또는 .xls)만 업로드 가능합니다.');
      return;
    }

    setIsStatusExcelUploading(true);
    try {
      await uploadVariantStatusExcel(file, selectedYear, selectedMonth);
      alert(`${selectedYear}년 ${selectedMonth}월 재고 데이터가 성공적으로 업로드되었습니다.`);

      // 월별 재고 현황 데이터 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['variantStatus', selectedYear, selectedMonth] });
    } catch (err) {
      alert('월별 재고 현황 엑셀 업로드 중 오류 발생: ' + getErrorMessage(err));
    } finally {
      setIsStatusExcelUploading(false);
      e.target.value = '';
    }
  };

  // 월별 재고 현황 엑셀 다운로드 핸들러
  const handleStatusExcelDownload = async () => {
    setIsStatusExcelDownloading(true);
    try {
      const response = await downloadVariantStatusExcel({
        year: selectedYear,
        month: selectedMonth,
      });

      // JSON 데이터를 엑셀로 변환
      const data = response.data;

      if (!data || data.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      // 엑셀에 표시할 데이터 변환
      const excelData = data.map((item: ProductVariantStatus, index: number) => ({
        번호: index + 1,
        연도: item.year,
        월: item.month,
        대분류: item.big_category,
        중분류: item.middle_category,
        카테고리: item.category,
        설명: item.description,
        온라인명: item.online_name,
        오프라인명: item.offline_name,
        옵션: item.option,
        상세옵션: item.detail_option,
        상품코드: item.product_code,
        품목코드: item.variant_code,
        월초창고재고: item.warehouse_stock_start || 0,
        월초매장재고: item.store_stock_start || 0,
        기초재고: item.initial_stock || 0,
        당월입고: item.inbound_quantity || 0,
        매장판매: item.store_sales || 0,
        쇼핑몰판매: item.online_sales || 0,
        판매합계: item.total_sales || 0,
        재고조정: item.adjustment_quantity || 0,
        기말재고: item.ending_stock || 0,
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 5 }, // 번호
        { wch: 6 }, // 연도
        { wch: 4 }, // 월
        { wch: 8 }, // 대분류
        { wch: 8 }, // 중분류
        { wch: 10 }, // 카테고리
        { wch: 20 }, // 설명
        { wch: 25 }, // 온라인명
        { wch: 25 }, // 오프라인명
        { wch: 15 }, // 옵션
        { wch: 10 }, // 상세옵션
        { wch: 12 }, // 상품코드
        { wch: 15 }, // 품목코드
        { wch: 12 }, // 월초창고재고
        { wch: 12 }, // 월초매장재고
        { wch: 10 }, // 기초재고
        { wch: 10 }, // 당월입고
        { wch: 10 }, // 매장판매
        { wch: 12 }, // 쇼핑몰판매
        { wch: 10 }, // 판매합계
        { wch: 10 }, // 재고조정
        { wch: 10 }, // 기말재고
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedMonth}월 재고현황`);

      // 파일명 생성
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `재고현황_${selectedYear}년${selectedMonth}월_${dateStr}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, filename);

      alert('월별 재고 현황 엑셀 파일이 다운로드되었습니다.');
    } catch (err) {
      alert('월별 재고 현황 엑셀 다운로드 중 오류 발생: ' + getErrorMessage(err));
    } finally {
      setIsStatusExcelDownloading(false);
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

    // 전체 탭만 사용하므로 채널 필터 없이 초기화
    const baseFilters: Record<string, string | number> = {};

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

  const handleStockAdjustSuccess = () => {
    refetch();
    // EditProductModal이 열려있는 경우 해당 product 데이터도 업데이트
    if (editId && selectedVariantForStock) {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  };

  // 월별 재고 현황 테이블에서 상품 클릭 핸들러
  const handleStatusRowClick = (variantCode: string) => {
    if (!variantCode) return;
    setStatusSelectedVariantCode(variantCode);
  };

  // 모든 탭에서 동일한 API 기반 데이터 사용
  const tabData = data ?? [];
  console.log('tabData', tabData);

  if (error) return <p>에러가 발생했습니다!</p>;

  return (
    <div className='w-full max-w-full overflow-hidden min-h-[calc(100vh+10px)]'>
      {isLoading && <LoadingSpinner overlay text='재고 데이터를 불러오는 중...' />}
      {isPOSUploading && <LoadingSpinner overlay text='POS 데이터를 업로드하는 중...' />}
      {isStatusExcelUploading && (
        <LoadingSpinner overlay text='월별 재고 현황을 업로드하는 중...' />
      )}
      {isStatusExcelDownloading && (
        <LoadingSpinner overlay text='월별 재고 현황을 다운로드하는 중...' />
      )}
      <div className='mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4'>
          <h1 className='truncate text-xl font-bold sm:text-2xl'>재고 관리</h1>
          {/* 뷰 모드 전환 버튼 */}
          <div className='flex w-fit flex-shrink-0 rounded-lg border border-gray-300 bg-white'>
            <button
              onClick={() => setViewMode('variant')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'variant'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              } rounded-l-lg`}>
              상품 관리
            </button>
            <button
              onClick={() => setViewMode('status')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'status'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              } rounded-r-lg border-l border-gray-300`}>
              월별 재고 현황
            </button>
          </div>
        </div>
        <div className='flex flex-shrink-0 flex-wrap gap-2'>
          {viewMode === 'variant' && permissions.canCreate('INVENTORY') && (
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
              <PrimaryButton
                text='POS 데이터 업로드'
                icon={<FaFileArrowUp size={16} />}
                onClick={handlePOSButtonClick}
                disabled={isPOSUploading}
              />
            </>
          )}

          {/* 월별 재고 현황 모드일 때 엑셀 업로드/다운로드 버튼 */}
          {viewMode === 'status' && permissions.canCreate('INVENTORY') && (
            <>
              <PrimaryButton
                text='엑셀 업로드'
                icon={<FaFileArrowUp size={16} />}
                onClick={handleStatusExcelButtonClick}
                disabled={isStatusExcelUploading || isStatusExcelDownloading}
              />
              <SecondaryButton
                text='엑셀 다운로드'
                icon={<FaFileArrowDown size={16} />}
                onClick={handleStatusExcelDownload}
                disabled={isStatusExcelUploading || isStatusExcelDownloading}
              />
            </>
          )}

          {/* 파일 입력 필드들 */}
          <input
            ref={fileInputRef}
            id='posUploadInput'
            type='file'
            accept='.xlsx,.xls'
            className='hidden'
            onChange={handlePOSUpload}
          />
          <input
            ref={statusExcelInputRef}
            id='statusExcelUploadInput'
            type='file'
            accept='.xlsx,.xls'
            className='hidden'
            onChange={handleStatusExcelUpload}
          />
        </div>
      </div>

      {/* 월별 재고 현황 모드일 때 년/월 선택 필터 */}
      {viewMode === 'status' && (
        <div className='mb-4 w-full min-w-0 rounded-lg border border-gray-200 bg-white p-3 sm:p-4'>
          <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3'>
            <label className='text-sm font-medium text-gray-700'>조회 기간:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none'>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none'>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
            <span className='text-sm text-gray-500'>
              {selectedYear}년 {selectedMonth}월 재고 현황
            </span>
          </div>
        </div>
      )}

      {/* 검색 필터 - 상품 관리 모드일 때만 표시 */}
      {viewMode === 'variant' && (
        <div className='mb-6'>
          {/* TODO: 이 부분 작동 한번 더 확인. 현재 엉망임 */}
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

              // 채널 필터 제거 (전체 탭만 사용)

              // 상품명 필터
              if (productName.trim()) {
                newFilters.product_name = productName.trim();
              }

              // 카테고리 필터
              if (category) {
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
      )}

      {/* 테이블 - 뷰 모드에 따라 다른 테이블 표시 */}
      {viewMode === 'variant' ? (
        <InventoryTable
          inventories={tabData}
          onDelete={handleVariantDelete}
          onExportToExcel={handleExportToExcel}
          // 무한 스크롤 관련 props
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          infiniteScroll={infiniteScroll}
        />
      ) : (
        <VariantStatusTable
          data={variantStatusData?.results || []}
          isLoading={isStatusLoading}
          year={selectedYear}
          month={selectedMonth}
          onRowClick={handleStatusRowClick}
        />
      )}
      {selectedProduct && (
        <EditProductModal
          isOpen={!!editId || !!statusSelectedVariantCode}
          onClose={handleCloseModal}
          product={selectedProduct as Product}
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
          onSuccess={handleStockAdjustSuccess}
        />
      )}
      {isStockHistoryModalOpen && (
        <StockHistoryModal
          isOpen={isStockHistoryModalOpen}
          onClose={() => setStockHistoryModalOpen(false)}
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
