import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaRegCalendar } from 'react-icons/fa';

interface DateInputProps {
  placeholder?: string;
  onChange?: (date: Date | null) => void;
  value?: Date | null; // 추가
}

const DateInput: React.FC<DateInputProps> = ({
  placeholder = '날짜를 선택하세요',
  onChange,
  value,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    onChange?.(date);
  };

  return (
    <div className='font-inter relative inline-flex items-center'>
      <DatePicker
        selected={value !== undefined ? value : selectedDate}
        onChange={handleDateChange}
        placeholderText={placeholder}
        dateFormat='yyyy-MM-dd'
        className={`h-10 w-36 cursor-pointer rounded-md border border-gray-300 bg-gray-50 py-2 pr-10 pl-3 text-sm font-normal text-gray-700 transition-colors duration-200 focus:border-indigo-600 focus:outline-none`}
      />
      <div className='pointer-events-none absolute right-3 flex items-center justify-center'>
        <FaRegCalendar
          className={`text-gray-500 ${
            (value !== undefined ? value : selectedDate) ? 'text-indigo-600' : 'text-gray-500'
          } h-4 w-4`}
        />
      </div>
    </div>
  );
};

export default DateInput;
