import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaRegCalendar } from 'react-icons/fa';

interface DateInputProps {
  placeholder?: string;
  onChange?: (date: Date | null) => void;
}

const DateInput: React.FC<DateInputProps> = ({
  placeholder = '날짜를 선택하세요',
  onChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    onChange?.(date);
  };

  return (
    <div className="relative inline-flex items-center font-inter">
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        placeholderText={placeholder}
        dateFormat="yyyy-MM-dd"
        className={`
          h-10 w-36 rounded-md
          pl-3 pr-10 py-2
          text-sm font-normal
          bg-gray-50 text-gray-700
          border border-gray-300
          focus:outline-none focus:border-indigo-600
          transition-colors duration-200
          cursor-pointer
        `}
      />
      <div className="absolute right-3 flex items-center justify-center pointer-events-none">
        <FaRegCalendar
          className={`text-gray-500 ${
            selectedDate ? 'text-indigo-600' : 'text-gray-500'
          } w-4 h-4`}
        />
      </div>
    </div>
  );
};

export default DateInput;