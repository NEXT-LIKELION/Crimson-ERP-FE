import React, { useState, useCallback } from 'react';
import GreenButton from '../../components/button/GreenButton';
import { FaPlus } from 'react-icons/fa6';
import { MdOutlineEdit } from 'react-icons/md';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
} from '../../hooks/queries/useSuppliers';
import AddSupplierModal from '../../components/modal/AddSupplierModal';
import SupplierDetailModal from '../../components/modal/SupplierDetailModal';
import { Supplier, SupplierCreateData } from '../../types/product';
import { usePermissions } from '../../hooks/usePermissions';
import { useEnterKey } from '../../hooks/useEnterKey';
import { formatPhoneNumber } from '../../utils/formatters';
// Supplier 인터페이스는 types/product.ts에서 import됨

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
  const handleSearch = useCallback(() => {
    setSearch(searchInput);
  }, [searchInput]);
  const handleEnterKey = useEnterKey(handleSearch);

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
            onKeyDown={handleEnterKey}
          />
          <button
            className='rounded bg-blue-500 px-4 py-2 text-white'
            onClick={() => setSearch(searchInput)}>
            검색
          </button>
        </div>
        <div className='flex flex-row items-center gap-2'>
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
                  <td className='border-b border-gray-200 px-4 py-2'>
                    {formatPhoneNumber(supplier.contact)}
                  </td>
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
            await createSupplier.mutateAsync(form as unknown as SupplierCreateData);
          } catch (error: unknown) {
            let errorMsg = '공급업체 추가 중 오류가 발생했습니다.';
            if ('response' in (error as object)) {
              const errorObj = error as { response?: { data?: { detail?: string } } };
              const responseError = errorObj.response?.data?.detail;
              if (responseError) errorMsg = responseError;
            }
            alert(errorMsg);
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
        initialData={
          editId
            ? (suppliers.find((s) => s.id === editId) as unknown as Record<string, unknown>)
            : {}
        }
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

export default SupplierPage;
