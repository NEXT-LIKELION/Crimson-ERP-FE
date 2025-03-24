import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ placeholder = 'Search...', onSearch }) => {
  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);  

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onSearch?.(newQuery);
  };

  const handleFocus = () => setIsFocused(true);   
  const handleBlur = () => setIsFocused(false);    

  return (
    <div className="relative flex items-center font-inter">
      <FaSearch
        className={`
          absolute left-3
          ${isFocused ? 'text-indigo-600' : 'text-gray-400'}  // 포커스 상태에 따라 색상 변경
          transition-colors duration-200
        `}
      />
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}   
        onBlur={handleBlur}     
        className={`
          h-9 w-full rounded-md
          pl-10 pr-3
          text-sm font-normal
          border border-gray-300 bg-gray-50
          focus:outline-none focus:border-indigo-600 focus:bg-white
          transition-colors duration-200
        `}
      />
    </div>
  );
};

export default SearchInput;
