/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// ROOTS
// ========================
const countryRoot = "/api/v1/countries";
const statesRoot = "/api/v1/states";
const citiesRoot = "/api/v1/cities";

// ========================
// TYPES
// ========================
export interface Country {
  countryCode: string;
  name: string;
  phoneCode: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  timeZones: string;
  region: string;
  flag: string;
  isActive: boolean;
  states?: any[];
}

// ---- Get All Countries ----
export interface GetAllCountriesResponse {
  success: boolean;
  message: string;
  countries: Country[];
}

// ---- Get Country By Code ----
export interface GetCountryByCodeResponse {
  success: boolean;
  message: string;
  country: Country;
}

// ---- State ----
export interface State {
  id?: number;
  name: string;
  code?: string;
  countryCode?: string;
  countryId?: number;
  [key: string]: any;
}

export interface GetStatesByCountryResponse {
  success?: boolean;
  message?: string;
  states: State[];
}

// ---- City ----
export interface City {
  id?: number;
  name: string;
  stateId?: number;
  [key: string]: any;
}

export interface GetCitiesByStateResponse {
  success?: boolean;
  message?: string;
  cities: City[];
}

export interface GetCityByIdResponse {
  success?: boolean;
  message?: string;
  city: City;
}

// ========================
// CONFIG: Endpoints
// ========================
const countryEndpoints = {
  getAllCountries: {
    path: `${countryRoot}`,
    method: ApiMethods.GET,
  },
};

// Dynamic endpoints (path built with id/code at call time)
export const countryDynamicEndpoints = {
  getCountryByCode: (code: string) => ({
    path: `${countryRoot}/${code}`,
    method: ApiMethods.GET,
  }),

  getCountriesByRegion: (region: string) => ({
    path: `${countryRoot}?region=${region}`,
    method: ApiMethods.GET,
  }),

  getStatesByCountryId: (countryId: number | string) => ({
    path: `${countryRoot}/${countryId}/states`,
    method: ApiMethods.GET,
  }),

  /** States by country code (e.g. NG). Use for cascading dropdowns. */
  getStatesByCountryCode: (countryCode: string) => ({
    path: `${statesRoot}?countryCode=${countryCode}`,
    method: ApiMethods.GET,
  }),

  getCitiesByStateId: (stateId: number | string) => ({
    path: `${statesRoot}/${stateId}/cities`,
    method: ApiMethods.GET,
  }),

  /** Cities by country code and state code (e.g. NG, FC). Use for cascading dropdowns. */
  getCitiesByCountryAndStateCode: (countryCode: string, stateCode: string) => ({
    path: `${citiesRoot}?countryCode=${countryCode}&stateCode=${stateCode}`,
    method: ApiMethods.GET,
  }),

  getCityById: (id: number | string) => ({
    path: `${citiesRoot}/${id}`,
    method: ApiMethods.GET,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, ServiceInterface>>(endpoints: T) {
  const services: Record<keyof T, ServiceInterface> = {} as any;

  for (const key in endpoints) {
    services[key] = {
      path: endpoints[key].path,
      method: endpoints[key].method,
    };
  }

  return services;
}

// ========================
// EXPORT
// ========================
export const countryServices = generateServices(countryEndpoints);
