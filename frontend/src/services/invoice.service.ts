/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiMethods } from "@/utils/client";

// ========================
// Subject ROOT
// ========================
const invoiceRoot = "/api/v1/invoices";


// ========================
// CONFIG: Endpoints & Methods
// ========================
const invoiceEndpoints = {
  createInvoice: { path: `${invoiceRoot}`, method: ApiMethods.POST },
  getAllInvoice: { path: `${invoiceRoot}`, method: ApiMethods.GET },
  generateInvoiceNumber: { path: `${invoiceRoot}/generate-number`, method: ApiMethods.POST },
};

// Dynamic endpoints (require SubjectId)
export const invoiceDynamicEndpoints = {
  getInvoiceById: (invoiceId: string | number) => ({
    path: `${invoiceRoot}/${invoiceId}`,
    method: ApiMethods.GET,
  }),
  deleteInvoice: (invoiceId: string | number) => ({
    path: `${invoiceRoot}/${invoiceId}`,
    method: ApiMethods.DELETE,
  }),
  updateInvoice: (invoiceId: string | number) => ({
    path: `${invoiceRoot}/${invoiceId}`,
    method: ApiMethods.PUT,
  }),
  downloadInvoicePdf: (invoiceId: string | number) => ({
    path: `${invoiceRoot}/${invoiceId}/pdf`,
    method: ApiMethods.GET,
  }),
  recordPayment: (invoiceId: string | number) => ({
    path: `${invoiceRoot}/${invoiceId}/payments`,
    method: ApiMethods.POST,
  }),
};

// ========================
// SERVICE GENERATOR
// ========================
type ServiceInterface = {
  path: string;
  method: ApiMethods;
};

function generateServices<T extends Record<string, { path: string; method: ApiMethods }>>(
  endpoints: T,
) {
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
// EXPORTS
// ========================
export const invoiceServices = generateServices(invoiceEndpoints);
