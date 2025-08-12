import React, { useState, useEffect } from 'react';
import GreenButton from '../../components/button/GreenButton';
import { FaPlus } from 'react-icons/fa6';
import { MdOutlineDownload, MdFilterList, MdOutlineEdit } from 'react-icons/md';
import {
  useSuppliers,
  useCreateSupplier,
  useSupplierById,
  useUpdateSupplier,
} from '../../hooks/queries/useSuppliers';
import AddSupplierModal from '../../components/modal/AddSupplierModal';
import { fetchInventories } from '../../api/inventory';
import { updateSupplierVariant } from '../../api/supplier';
import { usePermissions } from '../../hooks/usePermissions';

interface Supplier {
  id: number;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
}

const SupplierPage: React.FC = () => {
  const { data, isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const permissions = usePermissions();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const updateSupplier = useUpdateSupplier();

  // API 데이터에서 실제 목록 추출
  const suppliers: Supplier[] = data?.data || [];
  const searchLower = search.toLowerCase();
  const filteredSuppliers = suppliers
    .filter(
      (supplier) =>
        !searchLower ||
        Object.values(supplier).some((value) => String(value).toLowerCase().includes(searchLower))
    )
    .sort((a, b) => a.id - b.id);

  return (
    <div className='p-6'>
      {/* 상단 헤더 */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <h1 className='text-2xl font-bold'>공급업체 관리</h1>
          <span className='text-sm text-gray-500'>총 {filteredSuppliers.length}개 업체</span>
        </div>
      </div>

      {/* 검색 필드 - 카드형 컨테이너 (버튼 포함, 한 줄 배치, 버튼 우측 정렬) */}
      <div className='mb-6 flex flex-row flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-6 shadow-md'>
        <div className='flex flex-row flex-wrap items-center gap-2'>
          <input
            type='text'
            placeholder='검색어를 입력하세요 (모든 항목)'
            className='w-72 rounded border px-3 py-2'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            className='rounded bg-blue-500 px-4 py-2 text-white'
            onClick={() => setSearch(searchInput)}>
            검색
          </button>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <MdFilterList
            className='cursor-pointer text-gray-500 hover:text-gray-700'
            size={22}
            onClick={() => alert('필터 클릭(추후 구현)')}
          />
          <MdOutlineDownload
            className='cursor-pointer text-gray-500 hover:text-gray-700'
            size={22}
            onClick={() => alert('다운로드 클릭(추후 구현)')}
          />
          {permissions.canCreate('SUPPLIER') && (
            <GreenButton
              text='공급업체 추가'
              icon={<FaPlus size={16} />}
              onClick={() => setAddModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* 공급업체 테이블 - 카드형 컨테이너 */}
      <div className='relative overflow-x-auto rounded-lg bg-white p-6 shadow-md sm:rounded-lg'>
        {isLoading ? (
          <div className='py-8 text-center'>로딩 중...</div>
        ) : error ? (
          <div className='py-8 text-center text-red-500'>
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <table className='w-full border-collapse text-sm text-gray-700'>
            <thead className='border-b border-gray-300 bg-gray-50 text-xs uppercase'>
              <tr>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>ID</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>업체명</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>담당자</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>연락처</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>이메일</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>주소</th>
                <th className='border-b border-gray-300 px-4 py-3 text-left'>상세</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className='hover:bg-gray-50'>
                  <td className='border-b border-gray-200 px-4 py-2 text-center'>{supplier.id}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>{supplier.name}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>{supplier.manager}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>{supplier.contact}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>{supplier.email}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>{supplier.address}</td>
                  <td className='border-b border-gray-200 px-4 py-2'>
                    <div className='flex gap-2'>
                      <button
                        className='rounded bg-gray-200 px-3 py-1 text-xs text-gray-800 hover:bg-gray-300'
                        onClick={() => setDetailId(supplier.id)}>
                        상세보기
                      </button>
                      {permissions.canEdit('SUPPLIER') && (
                        <button
                          className='flex items-center rounded bg-indigo-500 px-3 py-1 text-xs text-white hover:bg-indigo-600'
                          onClick={() => setEditId(supplier.id)}>
                          <MdOutlineEdit className='mr-1' />
                          수정
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={async (form) => {
          try {
            await createSupplier.mutateAsync(form);
          } catch (error: any) {
            alert(error?.response?.data?.detail || '공급업체 추가 중 오류가 발생했습니다.');
          }
        }}
      />

      <SupplierDetailModal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        supplierId={detailId}
      />
      <AddSupplierModal
        isOpen={!!editId}
        onClose={() => setEditId(null)}
        initialData={editId ? suppliers.find((s) => s.id === editId) : {}}
        title='공급업체 정보 수정'
        onSave={(form) => {
          if (editId != null) {
            updateSupplier.mutate({ id: editId, data: form }, { onSuccess: () => setEditId(null) });
          }
        }}
      />
    </div>
  );
};

const SupplierDetailModal = ({
  isOpen,
  onClose,
  supplierId,
}: {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number | null;
}) => {
  const { data, isLoading, error } = useSupplierById(supplierId ?? 0);
  const [variantEdits, setVariantEdits] = useState<
    Record<string, { cost_price: number; is_primary: boolean }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  useEffect(() => {
    fetchInventories().then((res) => {
      const flatVariants: any[] = [];
      res.data.forEach((product: any) => {
        (product.variants || []).forEach((variant: any) => {
          flatVariants.push(variant);
        });
      });
    });
  }, []);
  if (!isOpen || !supplierId) return null;
  const supplier = data?.data;

  // variant_code 기반으로 상태 관리 및 핸들러 수정
  const handleEditChange = (
    code: string,
    field: 'cost_price' | 'is_primary',
    value: any,
    original: { cost_price: number; is_primary: boolean }
  ) => {
    setVariantEdits((prev) => {
      const current = prev[code] ?? {
        cost_price: original.cost_price,
        is_primary: original.is_primary,
      };
      return {
        ...prev,
        [code]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // 저장 버튼 클릭 시 PATCH
  const handleSave = async (variant: any) => {
    const code = variant.variant_code;
    if (!code) {
      alert('variant_code가 없습니다.');
      return;
    }
    const edit = variantEdits[code] || {
      cost_price: variant.cost_price,
      is_primary: variant.is_primary,
    };
    setSavingId(code);
    try {
      await updateSupplierVariant(supplierId, code, {
        cost_price: edit.cost_price,
        is_primary: edit.is_primary,
      }); // 백엔드에서 처리하는 것이므로 파라미터 순서 중요
      alert('저장되었습니다.');
    } catch (e) {
      alert('저장 실패');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className='bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='max-h-[90vh] w-[800px] overflow-y-auto rounded-lg bg-white p-8 shadow-lg'>
        <h2 className='mb-4 text-xl font-bold'>공급업체 상세</h2>
        {isLoading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div className='text-red-500'>불러오기 실패</div>
        ) : supplier ? (
          <>
            <div className='mb-6'>
              <div>
                <b>업체명:</b> {supplier.name}
              </div>
              <div>
                <b>담당자:</b> {supplier.manager}
              </div>
              <div>
                <b>연락처:</b> {supplier.contact}
              </div>
              <div>
                <b>이메일:</b> {supplier.email}
              </div>
              <div>
                <b>주소:</b> {supplier.address}
              </div>
            </div>
            <h3 className='mb-2 text-lg font-semibold'>공급 품목(Variants)</h3>
            <table className='mb-4 w-full border-collapse text-sm text-gray-700'>
              <thead className='border-b border-gray-300 bg-gray-50'>
                <tr>
                  <th className='border-b px-4 py-2 text-center'>CODE</th>
                  <th className='border-b px-4 py-2 text-center'>품목명</th>
                  <th className='border-b px-4 py-2 text-center'>옵션</th>
                  <th className='border-b px-4 py-2 text-center'>재고</th>
                  <th className='border-b px-4 py-2 text-center'>단가</th>
                  <th className='border-b px-4 py-2 text-center'>대표여부</th>
                  <th className='border-b px-4 py-2 text-center'>저장</th>
                </tr>
              </thead>
              <tbody>
                {supplier.variants.map((variant: any) => {
                  const code = variant.variant_code;
                  const edit = variantEdits[code] || {
                    cost_price: variant.cost_price,
                    is_primary: variant.is_primary,
                  };
                  return (
                    <tr key={code}>
                      <td className='border-b px-4 py-2 text-center'>{variant.variant_code}</td>
                      <td className='border-b px-4 py-2 text-center'>{variant.name}</td>
                      <td className='border-b px-4 py-2 text-center'>{variant.option}</td>
                      <td className='border-b px-4 py-2 text-center'>{variant.stock}</td>
                      <td className='border-b px-4 py-2 text-center'>
                        <input
                          type='number'
                          className='w-24 rounded border px-2 py-1 text-right'
                          value={edit.cost_price}
                          onChange={(e) =>
                            handleEditChange(code, 'cost_price', Number(e.target.value), {
                              cost_price: variant.cost_price,
                              is_primary: variant.is_primary,
                            })
                          }
                        />
                      </td>
                      <td className='border-b px-4 py-2 text-center'>
                        <input
                          type='checkbox'
                          checked={edit.is_primary}
                          onChange={(e) =>
                            handleEditChange(code, 'is_primary', e.target.checked, {
                              cost_price: variant.cost_price,
                              is_primary: variant.is_primary,
                            })
                          }
                        />
                      </td>
                      <td className='border-b px-4 py-2 text-center'>
                        <button
                          className='rounded bg-blue-500 px-3 py-1 text-white disabled:opacity-50'
                          onClick={() => handleSave(variant)}
                          disabled={savingId === code}>
                          {savingId === code ? '저장중...' : '저장'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : null}
        <div className='mt-6 text-right'>
          <button className='rounded bg-gray-300 px-4 py-2' onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierPage;
