'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DatePickerInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

// Creates a fake input event that simulates a user typing
const createInputEvent = (name: string, value: string): React.ChangeEvent<HTMLInputElement> => {
  return {
    target: {
      name,
      value
    }
  } as React.ChangeEvent<HTMLInputElement>;
};

export default function DatePickerInput({ 
  name, 
  value, 
  onChange, 
  placeholder = "Enter date in DD/MM/YYYY format",
  required = false
}: DatePickerInputProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [inputError, setInputError] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const [day, month, year] = dateStr.split('/').map(Number);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }
    
    return new Date(year, month - 1, day);
  };

  // Format Date to DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Validate a date string
  const isValidDate = (dateStr: string): boolean => {
    if (!dateStr) return true; // Empty is considered valid (unless required is true)
    
    // Check format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return false;
    }
    
    const [day, month, year] = dateStr.split('/').map(Number);
    
    // Check year range (1900 to 2100)
    if (year < 1900 || year > 2100) {
      return false;
    }
    
    // Check month range
    if (month < 1 || month > 12) {
      return false;
    }
    
    // Check day range based on month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return false;
    }
    
    return true;
  };
  
  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Calculate optimal calendar position when it's shown
  useEffect(() => {
    if (showCalendar && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const calendarWidth = 260; // Approximate width of calendar
      const calendarHeight = 350; // Approximate max height of calendar
      
      let top: number;
      let left: number;
      
      // Force center positioning for all screens (both mobile and desktop)
      // Center vertically in the viewport
      top = Math.max(20, window.innerHeight / 2 - calendarHeight / 2 + window.scrollY);
      
      // For horizontal positioning, try to align with input if possible
      if (windowWidth < 640) {
        // On small screens, always center horizontally
        left = window.innerWidth / 2 - calendarWidth / 2;
      } else {
        // On larger screens, align with input but keep within viewport
        const inputCenterX = inputRect.left + (inputRect.width / 2);
        left = Math.max(10, Math.min(
          inputCenterX - calendarWidth / 2, // Try to center on input
          window.innerWidth - calendarWidth - 10 // Keep within right edge with 10px margin
        ));
      }
      
      setCalendarPosition({ top, left });
    }
  }, [showCalendar, windowWidth]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target as Node) && 
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate days for current month view
  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    
    // Get days from previous month to fill first week
    const prevMonthDays = [];
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Next month days to fill remaining cells
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthDays = [];
    
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Handle day selection
  const handleDayClick = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const formattedDate = formatDate(date);
    
    // Update the input value
    onChange(createInputEvent(name, formattedDate));
    setInputError(''); // Clear any input error
    
    // Close the calendar
    setShowCalendar(false);
  };

  // Navigate to previous month
  const goToPrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Format for display in header
  const getMonthYearString = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  // Handle input validation for manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputError(''); // Clear any previous error
    
    // Allow empty or partial input
    if (!inputValue) {
      onChange(e);
      return;
    }
    
    // Only allow digits and / in the input
    if (!/^[\d/]*$/.test(inputValue)) {
      return;
    }
    
    // Auto-format as user types
    let formattedValue = inputValue;
    
    // Auto-add slashes
    if (inputValue.length === 2 && !inputValue.includes('/')) {
      formattedValue = `${inputValue}/`;
    } else if (inputValue.length === 5 && inputValue.indexOf('/', 3) === -1) {
      formattedValue = `${inputValue}/`;
    }
    
    // Create a new event with the formatted value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: formattedValue
      }
    };
    
    onChange(newEvent);
    
    // Validate complete date
    if (formattedValue.length === 10) {
      if (!isValidDate(formattedValue)) {
        setInputError('Invalid date. Please check format (DD/MM/YYYY)');
      }
    }
  };

  // When the calendar icon is clicked
  const toggleCalendar = () => {
    if (!showCalendar) {
      // If there's a valid date in the input, set the calendar to that month
      const date = parseDate(value);
      if (date) {
        setCurrentMonth(date);
      } else {
        // Otherwise use current month
        setCurrentMonth(new Date());
      }
    }
    
    setShowCalendar(!showCalendar);
  };

  // Handle focus of input field
  const handleFocus = () => {
    // Optionally select all text for easier editing
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  // Generated days for the current month view
  const days = generateDays();
  // Selected date
  const selectedDate = parseDate(value);

  const isSmallScreen = windowWidth < 640;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event from propagating
          }}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 pl-3 pr-10 text-black ${inputError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          placeholder={placeholder}
          required={required}
          aria-label={`Date picker - ${placeholder}. You can type a date or use the calendar button.`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCalendar();
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Open calendar"
            title="Open calendar to select date"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {inputError && (
        <div className="text-red-500 text-xs mt-1">{inputError}</div>
      )}
      
      {/* Small help text */}
      <div className="text-black text-xs mt-1">
        Use calendar icon or type in DD/MM/YYYY format
      </div>
      
      {showCalendar && (
        <>
          {/* Backdrop overlay for all screens */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCalendar(false);
            }}
          />
          
          <div 
            ref={calendarRef}
            className="fixed z-50 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-md border border-gray-200 dark:border-gray-700 p-2"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '350px',
              overflowY: 'auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPrevMonth();
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="font-medium">{getMonthYearString()}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNextMonth();
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayObj, index) => {
                const isSelected = selectedDate && 
                  selectedDate.getDate() === dayObj.day && 
                  selectedDate.getMonth() === dayObj.month && 
                  selectedDate.getFullYear() === dayObj.year;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDayClick(dayObj.day, dayObj.month, dayObj.year);
                    }}
                    className={`
                      text-center py-1 text-sm rounded-md
                      ${!dayObj.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                      ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100'}
                    `}
                  >
                    {dayObj.day}
                  </button>
                );
              })}
            </div>
            
            {/* Calendar footer with hints */}
            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="text-gray-500">Type to edit manually</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const today = new Date();
                  handleDayClick(today.getDate(), today.getMonth(), today.getFullYear());
                }}
                className="text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 