import React from 'react';

interface InventoryTabsProps {
  activeTab: 'all' | 'offline' | 'online';
  onTabChange: (tab: 'all' | 'offline' | 'online') => void;
}

const InventoryTabs: React.FC<InventoryTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'all', label: '전체', count: null },
    { id: 'offline', label: '오프라인', count: null },
    { id: 'online', label: '온라인', count: null },
  ] as const;

  return (
    <div className='mb-6'>
      <div className='flex border-b border-gray-200'>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative min-w-[100px] border-b-2 border-transparent px-6 py-3 text-sm font-medium transition-all duration-150 ease-in-out ${
              activeTab === tab.id
                ? 'border-blue-600 bg-blue-50/30 text-blue-600'
                : 'text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            } ${index === 0 ? 'rounded-tl-lg' : ''} ${index === tabs.length - 1 ? 'rounded-tr-lg' : ''} `}>
            <div className='flex items-center justify-center gap-2'>
              <span className='whitespace-nowrap'>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`min-w-[20px] rounded-full px-2 py-1 text-center text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                  } `}>
                  {tab.count}
                </span>
              )}
            </div>

            {/* Chrome 탭 스타일 하단 활성 표시 */}
            {activeTab === tab.id && (
              <div className='absolute right-0 bottom-0 left-0 h-0.5 rounded-t bg-blue-600'></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryTabs;
