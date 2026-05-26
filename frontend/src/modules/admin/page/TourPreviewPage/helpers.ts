/**
 * Defines a single time slot for booking.
 */
export interface TimeSlot {
  time: string; // e.g., "9:00 AM"
  available: boolean;
  dateTime: Date;
  availabilityId?: number; // ID from API to identify the specific availability slot
}

/**
 * Calculates the minimum notice cutoff time in milliseconds.
 * @param minimumNotice - The minimum notice value (e.g., 2)
 * @param minimumNoticeUnit - The unit of time ('minutes' or 'hours')
 * @returns The cutoff time in milliseconds
 */
export const calculateMinimumNoticeCutoff = (
  minimumNotice: number | undefined,
  minimumNoticeUnit: string | undefined
): number => {
  if (!minimumNotice || !minimumNoticeUnit) {
    return 0; // No minimum notice requirement
  }

  const unitLower = minimumNoticeUnit.toLowerCase();
  let minutesRequired = 0;

  if (unitLower === 'hours' || unitLower === 'hour') {
    minutesRequired = minimumNotice * 60;
  } else if (unitLower === 'minutes' || unitLower === 'minute') {
    minutesRequired = minimumNotice;
  }

  return minutesRequired * 60000; // Convert to milliseconds
};

/**
 * Checks if a time slot meets the minimum notice requirement.
 * @param slotDateTime - The date/time of the slot
 * @param minimumNoticeCutoffMs - The cutoff time in milliseconds
 * @returns true if the slot is available (meets minimum notice), false if within notice period
 */
export const meetsMinimumNoticeRequirement = (
  slotDateTime: Date,
  minimumNoticeCutoffMs: number
): boolean => {
  if (minimumNoticeCutoffMs === 0) {
    return true; // No minimum notice requirement
  }

  const now = new Date();
  const requiredBookingTime = new Date(now.getTime() + minimumNoticeCutoffMs);

  // The slot must be at or after the required booking time
  return slotDateTime >= requiredBookingTime;
}

/**
 * Defines the overall schedule map, keyed by date "YYYY-MM-DD".
 */
export interface ScheduleData {
  [dateKey: string]: TimeSlot[];
}

export const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
export const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * Generates dummy schedule data for a given month/year.
 * @param month - Month (1-12)
 * @param year - Year
 * @param minimumNotice - Minimum notice value (optional)
 * @param minimumNoticeUnit - Unit of minimum notice: 'minutes' or 'hours' (optional)
 */
export const getDummyScheduleData = (
    month: number, 
    year: number, 
    minimumNotice?: number, 
    minimumNoticeUnit?: string
): ScheduleData => {
    const data: ScheduleData = {};
    
    // Calculate the minimum notice cutoff time
    const minimumNoticeCutoffMs = calculateMinimumNoticeCutoff(minimumNotice, minimumNoticeUnit);
    
    // Available days of the month for demonstration
    const availableDays = [17, 18, 19, 20, 21, 24, 25];
    const now = new Date();

    availableDays.forEach(day => {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Generate time slots every 15 minutes between 9:00 AM and 11:30 AM
        const slots: TimeSlot[] = [];
        for (let h = 9; h <= 11; h++) {
            for (let m = 0; m < 60; m += 15) {
                if (h === 11 && m > 30) continue; 
                
                const date = new Date(year, month - 1, day, h, m);
                
                // Skip slots in the past
                if (date <= now) continue;
                
                // Check if slot meets minimum notice requirement
                const meetsMinNotice = meetsMinimumNoticeRequirement(date, minimumNoticeCutoffMs);
                
                if (meetsMinNotice) {
                    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    
                    // Set the 11:15 AM slot to unavailable for demo
                    const isAvailable = !(h === 11 && m === 15);
                    
                    if (isAvailable) {
                        slots.push({ time: timeStr, available: true, dateTime: date });
                    }
                }
            }
        }
        
        if (slots.length > 0) {
            data[dateKey] = slots;
        }
    });
    return data;
};

/**
 * Generates schedule data from TourAvailability array for a given month/year.
 * ONLY shows dates for the current month. Returns empty for all other months.
 * @param availability - Array of TourAvailability objects (includes slots with booked status)
 * @param duration - Duration of each tour in minutes
 * @param month - Month (1-12)
 * @param year - Year
 * @param timeSlotInterval - Interval between time slots in minutes (default: 15)
 * @param minimumNotice - Minimum notice value (optional)
 * @param minimumNoticeUnit - Unit of minimum notice: 'minutes' or 'hours' (optional)
 * @returns ScheduleData object with available time slots for one date per available day of the week.
 */
export const generateScheduleFromAvailability = (
    availability: { 
        day: string; 
        startHour: number; 
        startMinute: number; 
        startMeridiem: string; 
        endHour: number; 
        endMinute: number; 
        endMeridiem: string;
        slots?: { id?:number; availabilityId: number; date: string; startTime: string; booked: boolean }[];
    }[],
    duration: number,
    month: number,
    year: number,
    timeSlotInterval: number = 15,
    minimumNotice?: number,
    minimumNoticeUnit?: string
): ScheduleData => {
    const data: ScheduleData = {};
    
    if (!availability || availability.length === 0) {
        return data;
    }

    // Calculate the minimum notice cutoff time
    const minimumNoticeCutoffMs = calculateMinimumNoticeCutoff(minimumNotice, minimumNoticeUnit);

    // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayNameToNumber: { [key: string]: number } = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
    };

    // Get current date/time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Identify which days of the week we need to find availability for
    // and track how many occurrences we've found for each.
    const targetDaysValues: number[] = [];
    const foundCounts: { [dayOfWeek: number]: number } = {};
    
    availability.forEach(avail => {
        const dNum = dayNameToNumber[avail.day.toLowerCase()];
        if (dNum !== undefined && !targetDaysValues.includes(dNum)) {
            targetDaysValues.push(dNum);
            foundCounts[dNum] = 0;
        }
    });

    // We want at least 4 occurrences for each available weekday
    const REQUESTED_OCCURRENCES = 4;
    
    // Safety break to prevent infinite loops (e.g. searching for 100 days)
    const MAX_DAYS_TO_CHECK = 120; // ~4 months

    const currentDate = new Date(today);
    let daysChecked = 0;

    // Loop until we've found enough occurrences for all target days or hit safety limit
    while (daysChecked < MAX_DAYS_TO_CHECK) {
        // Check if we have satisfied all days
        const allSatisfied = targetDaysValues.every(d => foundCounts[d] >= REQUESTED_OCCURRENCES);
        if (allSatisfied) {
            break;
        }

        const dayOfWeek = currentDate.getDay();
        
        // Is this a day we have availability config for?
        const dayAvailability = availability.find(avail => {
            const availDayNum = dayNameToNumber[avail.day.toLowerCase()];
            return availDayNum === dayOfWeek;
        });

        // Use a dateKey format YYYY-MM-DD
        const currentYearLocal = currentDate.getFullYear();
        const currentMonthLocal = currentDate.getMonth() + 1;
        const currentDayLocal = currentDate.getDate();
        const dateKey = `${currentYearLocal}-${String(currentMonthLocal).padStart(2, '0')}-${String(currentDayLocal).padStart(2, '0')}`;

        if (dayAvailability) {
            // Convert 12-hour format to 24-hour format
            let startHour24 = dayAvailability.startHour;
            if (dayAvailability.startMeridiem.toLowerCase() === 'pm' && startHour24 !== 12) {
                startHour24 += 12;
            } else if (dayAvailability.startMeridiem.toLowerCase() === 'am' && startHour24 === 12) {
                startHour24 = 0;
            }
            
            let endHour24 = dayAvailability.endHour;
            if (dayAvailability.endMeridiem.toLowerCase() === 'pm' && endHour24 !== 12) {
                endHour24 += 12;
            } else if (dayAvailability.endMeridiem.toLowerCase() === 'am' && endHour24 === 12) {
                endHour24 = 0;
            }
            
            // Create start and end times for this specific date
            const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour24, dayAvailability.startMinute);
            const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHour24, dayAvailability.endMinute);
            
            // Generate time slots
            const slots: TimeSlot[] = [];
            
            // Check if we have API slots for this specific date
            const apiSlotsForDate = dayAvailability.slots?.filter(apiSlot => apiSlot.date === dateKey) || [];
            
            if (apiSlotsForDate.length > 0) {
                // Use API slots directly - they contain the actual times from the backend
                apiSlotsForDate.forEach(apiSlot => {
                    // Parse the startTime from API (format: "HH:MM:SS")
                    const [hours, minutes] = apiSlot.startTime.split(':').map(Number);
                    const slotDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
                    
                    // Only include slots that are in the future
                    if (slotDateTime > now) {
                        // Check if there's enough time for a full tour duration
                        const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000);
                        
                        if (slotEndTime <= endTime) {
                            // Check if slot meets minimum notice requirement
                            const meetsMinNotice = meetsMinimumNoticeRequirement(slotDateTime, minimumNoticeCutoffMs);
                            
                            if (meetsMinNotice) {
                                const timeStr = slotDateTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit', 
                                    hour12: true 
                                });
                                
                                slots.push({ 
                                    time: timeStr, 
                                    available: !apiSlot.booked,  // Set to false if booked
                                    dateTime: new Date(slotDateTime),
                                    availabilityId: apiSlot.availabilityId
                                });
                            }
                        }
                    }
                });
                
                // Sort slots by time
                slots.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
            } else {
                // Fallback: Generate slots algorithmically if no API slots exist
                let currentSlotTime = new Date(startTime);
                
                while (currentSlotTime < endTime) {
                    // Check if there's enough time for a full tour duration
                    const slotEndTime = new Date(currentSlotTime.getTime() + duration * 60000);
                    
                    if (slotEndTime <= endTime) {
                        // Only include slots that are in the future
                        if (currentSlotTime > now) {
                            // Check if slot meets minimum notice requirement
                            const meetsMinNotice = meetsMinimumNoticeRequirement(currentSlotTime, minimumNoticeCutoffMs);
                            
                            if (meetsMinNotice) {
                                const timeStr = currentSlotTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit', 
                                    hour12: true 
                                });
                                
                                slots.push({ 
                                    time: timeStr, 
                                    available: true,
                                    dateTime: new Date(currentSlotTime),
                                    availabilityId: undefined
                                });
                            }
                        }
                    }
                    
                    // Move to next slot
                    currentSlotTime = new Date(currentSlotTime.getTime() + timeSlotInterval * 60000);
                }
            }
            
            // Only add if we generated slots (meaning there are future slots for today, or it's a future date)
            if (slots.length > 0) {
                data[dateKey] = slots;
                
                // Only increment count if we haven't already satisfied this day
                if (foundCounts[dayOfWeek] < REQUESTED_OCCURRENCES) {
                     foundCounts[dayOfWeek]++;
                }
            }
        }

        // Advance to next day
        currentDate.setDate(currentDate.getDate() + 1);
        daysChecked++;
    }
    
    return data;
};