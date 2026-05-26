import * as Yup from "yup";

const getTodayDate = () => new Date().toISOString().split("T")[0];

export interface InvoiceItemForm {
  description: string;
  quantity: string;
  rate: string;
  vat?: string;
  displayAmount: string;
}

export interface InvoiceFormData {
  notes: string;
  invoiceNumber: string;
  issueDate: null | string;
  dueDate: null | string;
  studentId: string[];
  classroomId: string;
  paymentMethod: PaymentMethod;
  bankAccountId: string;
  invoiceType: string | null;
  billingPeriod: string | null;
  items: InvoiceItemForm[];
  vatPercent: string;
  discount: string;
}

export enum PaymentMethod {
  CASH = "cash",
  ONLINE_PAYMENT = "card",
  TRANSFER = "transfer",
  CHEQUE = "cheque",
  OTHER = "other",
}

export const paymentMethodOptions = [
  { name: "Cash", value: PaymentMethod.CASH },
  { name: "Online Payment", value: PaymentMethod.ONLINE_PAYMENT },
  { name: "Transfer", value: PaymentMethod.TRANSFER },
  { name: "Cheque", value: PaymentMethod.CHEQUE },
  { name: "Other", value: PaymentMethod.OTHER },
];

export const initialValue: InvoiceFormData = {
  notes: "",
  invoiceNumber: "",
  issueDate: getTodayDate(),
  dueDate: getTodayDate(),
  studentId: [],
  classroomId: "",
  paymentMethod: PaymentMethod.TRANSFER,
  bankAccountId: "",
  invoiceType: "",
  billingPeriod: "",
  items: [{ description: "", quantity: "", rate: "", vat: "0", displayAmount: "" }],
  vatPercent: "",
  discount: "",
};

export const validationSchema = Yup.object({
  issueDate: Yup.string().nullable().required("Issue date is required"),

  dueDate: Yup.string()
    .nullable()
    .required("Due date is required")
    .test("is-after-issue-date", "Due date must be after issue date", function (value) {
      const { issueDate } = this.parent;
      if (!issueDate || !value) return true;
      return new Date(value) >= new Date(issueDate);
    }),

  studentId: Yup.array().of(Yup.string()).min(1, "At least one student is required").required(),

  classroomId: Yup.string().required("Classroom is required"),
  paymentMethod: Yup.string().required("Payment method is required"),

  notes: Yup.string().max(500, "Notes cannot exceed 500 characters"),

  items: Yup.array()
    .of(
      Yup.object({
        description: Yup.string().trim().required("Description is required"),
        quantity: Yup.string()
          .required("Please fill")
          .test("positive-quantity", "Quantity must be greater than 0", (value) => {
            const numeric = Number(String(value ?? "").replace(/,/g, ""));
            return numeric > 0;
          }),
        rate: Yup.string()
          .required("Please fill")
          .test("positive-rate", "Rate must be greater than 0", (value) => {
            const numeric = Number(String(value ?? "").replace(/,/g, ""));
            return numeric > 0;
          }),
        vat: Yup.string()
          .optional()
          .test("vat-max", "VAT cannot be more than 100", (value) => {
            if (!value) return true;
            return Number(value) <= 100;
          }),
      }),
    )
    .min(1, "At least one invoice item is required")
    .required(),
});

export const invoiceTypes = [
  {
    name: "Tuition fee",
    value: "Tuition fee",
  },
  {
    name: "Admission fee",
    value: "Admission fee",
  },
  {
    name: "Custom invoice",
    value: "Custom invoice",
  },
];

export const billingPeriods = [
  {
    name: "Daily",
    value: "Daily",
  },
  {
    name: "Weekly",
    value: "Weekly",
  },
  {
    name: "Monthly",
    value: "Monthly",
  },
  {
    name: "Termly",
    value: "Termly",
  },
  {
    name: "Yearly",
    value: "Yearly",
  },
];
