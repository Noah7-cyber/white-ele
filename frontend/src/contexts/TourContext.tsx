"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CreateTourRequest } from "@/services/tour.service";

interface TourContextType {
  requestBody: CreateTourRequest | null;
  setRequestBody: React.Dispatch<React.SetStateAction<CreateTourRequest | null>>;
  updateRequestBody: (data: CreateTourRequest) => void;
  clearTourData: () => void;
}

export const TourContext = createContext<TourContextType | undefined>(undefined);

const STORAGE_KEY = "tour_request_body";
const STORAGE_TIMESTAMP_KEY = "tour_request_body_timestamp";
const STORAGE_EXPIRY_HOURS = 24; // Clear data after 24 hours

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requestBody, setRequestBody] = useState<CreateTourRequest | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (stored && timestamp) {
        try {
          // Check if data has expired (older than 24 hours)
          const storedTime = parseInt(timestamp, 10);
          const now = Date.now();
          const hoursSinceStored = (now - storedTime) / (1000 * 60 * 60);
          
          if (hoursSinceStored > STORAGE_EXPIRY_HOURS) {
            // Data expired, clear it
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
            return null;
          }
          
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored tour data:", e);
          // Clear corrupted data
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    }
    return null;
  });

  // Persist to localStorage whenever requestBody changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (requestBody) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(requestBody));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    }
  }, [requestBody]);

  const updateRequestBody = useCallback((data: CreateTourRequest) => {
    setRequestBody(data);
  }, []);

  const clearTourData = useCallback(() => {
    setRequestBody(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }
  }, []);

  return (
    <TourContext.Provider value={{ requestBody, setRequestBody, updateRequestBody, clearTourData }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTourContext must be used within a TourProvider");
  }
  return context;
};
