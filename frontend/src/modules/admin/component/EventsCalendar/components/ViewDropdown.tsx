import React, { useState, useRef, useEffect } from 'react';
import { gridOptions } from '../constants';

interface CustomViewSelectProps {
  view: string;
  setView: (value: string) => void;
}

const CustomViewSelect: React.FC<CustomViewSelectProps> = ({ view, setView }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

 

  const selectedOption = gridOptions.find(opt => opt.value === view);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string): void => {
    setView(value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        className="flex items-center justify-between w-32 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0086C9]/20 focus:border-[#0086C9] transition-all duration-200 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-700">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {gridOptions.map((option) => (
            <button
              key={option.value}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                view === option.value
                  ? 'bg-[#0086C9]/10 text-[#0086C9] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomViewSelect;