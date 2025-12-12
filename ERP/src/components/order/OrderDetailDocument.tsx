import { forwardRef } from 'react';
import { numberToKorean, OrderDetail } from '../../utils/orderUtils';
import { ORDER_INFO } from '../../constant';
import { formatOption } from '../../utils/formatters';

interface SupplierDetailLite {
  id: number;
  name: string;
  contact: string;
  manager: string;
  email: string;
  address: string;
}

interface OrderDetailDocumentProps {
  orderDetail: OrderDetail;
  supplierDetail: SupplierDetailLite | null;
}

const OrderDetailDocument = forwardRef<HTMLDivElement, OrderDetailDocumentProps>(
  ({ orderDetail, supplierDetail }, ref) => (
    <div ref={ref} className='w-full border border-stone-300 bg-white'>
      {/* Title */}
      <div className='my-5 text-center'>
        <h3 className='text-xl font-bold'>발 주 서</h3>
      </div>

      {/* Company Information */}
      <div className='mb-3 flex px-5'>
        <div className='w-1/2 space-y-1'>
          <p>
            <span className='font-bold'>사업자번호:</span> {ORDER_INFO.BUSINESS_NUMBER}
          </p>
          <p>
            <span className='font-bold'>상호:</span> {ORDER_INFO.COMPANY_NAME}
          </p>
          <p>
            <span className='font-bold'>대표자:</span> {ORDER_INFO.CEO}
          </p>
          <p>
            <span className='font-bold'>주소:</span> {ORDER_INFO.ADDRESS}
          </p>
        </div>
        <div className='w-1/2 space-y-1'>
          <p>
            <span className='font-bold'>발신:</span> {ORDER_INFO.COMPANY_NAME}
          </p>
          <p>
            <span className='font-bold'>전화:</span> {ORDER_INFO.PHONE}
          </p>
          <p>
            <span className='font-bold'>담당자:</span> {orderDetail.manager}
          </p>
          <p>
            <span className='font-bold'>FAX:</span> {ORDER_INFO.FAX}
          </p>
        </div>
      </div>

      {/* Supplier Information */}
      <div className='my-5 px-5'>
        <div className='space-y-1'>
          <p>
            <span className='font-bold'>수신:</span> {supplierDetail?.name || orderDetail.supplier}
          </p>
          <p>
            <span className='font-bold'>전화:</span> {supplierDetail?.contact || '-'}
          </p>
          <p>
            <span className='font-bold'>담당자:</span> {supplierDetail?.manager || '-'}
          </p>
          <p>
            <span className='font-bold'>이메일:</span> {supplierDetail?.email || '-'}
          </p>
        </div>
      </div>

      {/* Order Message */}
      <div className='my-6 px-5'>
        <p className='text-base'>아래와 같이 발주하오니 기일 내 필히 납품하여 주시기 바랍니다.</p>
      </div>

      {/* Order Details */}
      <div className='my-5 flex px-5'>
        <div className='w-1/2 space-y-1'>
          <p>
            <span className='font-bold'>발주일자:</span> {orderDetail.order_date}
          </p>
          <p>
            <span className='font-bold'>납품일자:</span> {orderDetail.expected_delivery_date}
          </p>
          <p>
            <span className='font-bold'>납품장소:</span> {ORDER_INFO.DELIVERY_LOCATION}
          </p>
        </div>
        <div className='w-1/2 space-y-1'>
          <p>
            <span className='font-bold'>구매비용:</span> 일금{' '}
            {numberToKorean(
              orderDetail.items.reduce((total, item) => total + item.quantity * item.unit_price, 0)
            )}{' '}
            (₩
            {orderDetail.items
              .reduce((total, item) => total + item.quantity * item.unit_price, 0)
              .toLocaleString()}
            )
          </p>
          <p>
            <span className='font-bold'>부가세:</span>{' '}
            {orderDetail.vat_included ? '포함' : '비포함'}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className='my-5 px-5'>
        <table className='w-full border border-gray-300'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='w-12 border border-stone-300 p-2 text-center'>NO</th>
              <th className='border border-stone-300 p-2 text-center'>발주품목 및 내역</th>
              <th className='w-20 border border-stone-300 p-2 text-center'>규격</th>
              <th className='w-14 border border-stone-300 p-2 text-center'>단위</th>
              <th className='w-14 border border-stone-300 p-2 text-center'>수량</th>
              <th className='w-40 border border-stone-300 p-2 text-center'>단가 (VAT 포함)</th>
              <th className='w-40 border border-stone-300 p-2 text-center'>금액 (VAT 포함)</th>
              <th className='w-14 border border-stone-300 p-2 text-center'>비고</th>
            </tr>
          </thead>
          <tbody>
            {orderDetail.items.map((item, index) => (
              <tr key={item.id}>
                <td className='border border-stone-300 p-2 text-center'>{index + 1}</td>
                <td className='border border-stone-300 p-2'>
                  {formatOption(item.option, item.item_name)}
                </td>
                <td className='border border-stone-300 p-2'>{item.spec}</td>
                <td className='border border-stone-300 p-2 text-center'>{item.unit}</td>
                <td className='border border-stone-300 p-2 text-center'>{item.quantity}</td>
                <td className='border border-stone-300 p-2 text-right'>
                  {item.unit_price.toLocaleString()}
                </td>
                <td className='border border-stone-300 p-2 text-right'>
                  {(item.quantity * item.unit_price).toLocaleString()}
                </td>
                <td className='border border-stone-300 p-2'>{item.remark || ''}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className='border border-stone-300 p-2 text-center'>
                합계
              </td>
              <td className='border border-stone-300 p-2 text-center'>
                {orderDetail.items.reduce((total, item) => total + item.quantity, 0)}
              </td>
              <td className='border border-stone-300 p-2 text-right'>
                {orderDetail.items
                  .reduce((total, item) => total + item.unit_price, 0)
                  .toLocaleString()}
              </td>
              <td className='border border-stone-300 p-2 text-right'>
                {orderDetail.items
                  .reduce((total, item) => total + item.quantity * item.unit_price, 0)
                  .toLocaleString()}
              </td>
              <td className='border border-stone-300 p-2'></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className='my-5 px-5'>
        <div className='mb-2'>
          <span className='font-bold'>발주 이유:</span>
        </div>
        <div className='min-h-16 border border-gray-300 p-3'>
          <p>{orderDetail.note || ''}</p>
        </div>
      </div>

      {/* Work Instructions */}
      <div className='my-5 px-5'>
        <div className='mb-2'>
          <span className='font-bold'>작업지시사항:</span>
        </div>
        <div className='min-h-16 border border-gray-300 p-3'>
          <p>{orderDetail.instruction_note || ''}</p>
        </div>
      </div>

      {/* Packaging */}
      <div className='my-5 flex items-center px-5'>
        <span className='mr-6 font-bold'>포장:</span>
        <div className='rounded-md border border-gray-300 bg-zinc-100 px-3 py-1'>
          <span>{orderDetail.packaging_included ? '있음' : '없음'}</span>
        </div>
      </div>
    </div>
  )
);

OrderDetailDocument.displayName = 'OrderDetailDocument';

export default OrderDetailDocument;
