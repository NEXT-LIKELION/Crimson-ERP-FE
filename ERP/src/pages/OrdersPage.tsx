import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllVariants } from '../../api/inventory';

const OrdersPage: React.FC = () => {
    const [variantList, setVariantList] = useState<{ value: string; label: string; productName: string; option: string }[]>([]);

    useEffect(() => {
        fetchAllVariants().then(setVariantList);
    }, []);

    const getVariantLabel = (variant_id: string) => {
        const found = variantList.find(v => v.value === variant_id);
        return found ? found.label : variant_id;
    };

    return (
        <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                    const isPending = order.status === 'pending';
                    return (
                        <tr
                            key={order.id}
                            className={`${isPending ? 'bg-yellow-50' : ''} hover:bg-gray-50 transition-colors`}
                        >
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                {getVariantLabel(order.productName)}
                            </td>
                        </tr>
                    );
                })
            ) : (
            )}
        </tbody>
    );
};

export default OrdersPage; 