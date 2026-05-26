import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import {
  accountDynamicEndpoints,
  accountServices,
  BankAccount,
  AcceptPaystackKeysRequest,
  GetBankAccountsResponse,
  GetBanksResponse,
  VerifyBankAccountResponse,
} from "@/services/account.service";
import { schoolDynamicEndpoints, GetSchoolResponse } from "@/services/school.service";
import { showToast } from "@/modules/shared/component/Toast";
import { useState, useRef, useMemo, useEffect } from "react";
import Clover1Icon from "@/modules/shared/assets/svgs/clover1.svg";
import Clover2Icon from "@/modules/shared/assets/svgs/clover2.svg";
import Clover3Icon from "@/modules/shared/assets/svgs/clover3.svg";
import Clover4Icon from "@/modules/shared/assets/svgs/clover4.svg";
import Clover5Icon from "@/modules/shared/assets/svgs/clover5.svg";
type PaymentMethod = "bankTransfer" | "paystack";

export const useDashboardPaymentSettings = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bankTransfer");
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");

  const [isSecretKeyEditable, setIsSecretKeyEditable] = useState(false);
  const [isPublicKeyEditable, setIsPublicKeyEditable] = useState(false);
  const [hasInitialKeysSet, setHasInitialKeysSet] = useState(false);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("new");
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [selectedBankSlug, setSelectedBankSlug] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [verifiedAccountName, setVerifiedAccountName] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const lastVerifiedKeyRef = useRef<string>("");

  const fallbackCopyToClipboard = (text: string) => {
    if (typeof document === "undefined") return;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch {
      // ignore
    }
    document.body.removeChild(textArea);
  };

  const {
    data: bankAccountsResponse,
    isLoading: isLoadingBankAccounts,
    refetch: refetchBankAccounts,
  } = useQueryService<Record<string, never>, GetBankAccountsResponse>({
    service: accountServices.getBankAccounts,
    options: {
      keys: ["bankAccounts"],
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const {
    data: banksResponse,
    isLoading: isLoadingBanks,
    refetch: refetchBanks,
  } = useQueryService<Record<string, never>, GetBanksResponse>({
    service: accountServices.getBanks,
    options: {
      keys: ["banks"],
      enabled: isBankModalOpen,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const { data: schoolResponse, isLoading: isLoadingSchool } = useQueryService<
    Record<string, never>,
    GetSchoolResponse
  >({
    service: schoolDynamicEndpoints.getParticularSchool(),
    options: {
      keys: ["particularSchool"],
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (!hasInitialKeysSet && schoolResponse?.school) {
      if (schoolResponse.school.PaystackPublicKey) {
        setPublicKey(schoolResponse.school.PaystackPublicKey);
        setIsPublicKeyEditable(false);
      } else {
        setIsPublicKeyEditable(true);
      }

      if (schoolResponse.school.PaystackSecretKey) {
        setSecretKey(schoolResponse.school.PaystackSecretKey);
        setIsSecretKeyEditable(false);
      } else {
        setIsSecretKeyEditable(true);
      }
      setHasInitialKeysSet(true);
    }
  }, [schoolResponse, hasInitialKeysSet]);

  const bankAccounts = useMemo(
    () => bankAccountsResponse?.bankAccounts ?? [],
    [bankAccountsResponse],
  );
  const primaryBankAccount = bankAccounts[0] ?? null;
  const bankAccountOptions = useMemo(() => {
    return [
      { value: "new", label: "New bank account" },
      ...bankAccounts.map((a) => ({
        value: String(a.id),
        label:
          `${a.bankName} • ${a.accountNumber}  • ${a.accountName}  ${a.isDefault ? "(Default)" : ""} `.trim(),
      })),
    ];
  }, [bankAccounts]);
  const bankDropdownOptions = useMemo(
    () =>
      (banksResponse?.banks ?? [])
        .filter((b) => b.active)
        .map((b) => ({ value: b.code, label: b.name, bank: b })),
    [banksResponse],
  );

  const { mutateAsync: verifyBankAccountAsync, isPending: isVerifyingBankAccount } =
    useMutationService<
      {
        bankCode: string;
        bankName: string;
        accountNumber: string;
      },
      VerifyBankAccountResponse
    >({
      service: accountServices.verifyBankAccount,
      options: {
        disableToast: true,
      },
    });

  const { mutateAsync: createBankAccountAsync, isPending: isCreatingBankAccount } =
    useMutationService<
      {
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
        isDefault: boolean;
      },
      unknown
    >({
      service: accountServices.createBankAccount,
      options: {
        successTitle: "Bank account saved",
        successMessage: "Bank account was added successfully.",
        invalidateKeys: ["bankAccounts"],
      },
    });

  const { mutateAsync: updateBankAccountAsync, isPending: isUpdatingBankAccount } =
    useMutationService<
      {
        id: number;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
        isDefault: boolean;
      },
      unknown
    >({
      service: ({ id }) => accountDynamicEndpoints.updateBankAccount(id),
      options: {
        successTitle: "Bank account updated",
        successMessage: "Bank account was updated successfully.",
        invalidateKeys: ["bankAccounts"],
      },
    });

  const { mutateAsync: deleteBankAccountAsync, isPending: isDeletingBankAccount } =
    useMutationService<{ id: number }, unknown>({
      service: ({ id }) => accountDynamicEndpoints.deleteBankAccount(id),
      options: {
        successTitle: "Bank account deleted",
        successMessage: "Bank account was deleted successfully.",
        invalidateKeys: ["bankAccounts"],
      },
    });

  const { mutateAsync: acceptPaystackKeysAsync, isPending: isSavingPaystackKeys } =
    useMutationService<AcceptPaystackKeysRequest, unknown>({
      service: accountServices.acceptPaystackKeys,
      options: {
        successTitle: "Configuration saved",
        successMessage: "Paystack keys saved successfully.",
        invalidateKeys: ["particularSchool"],
      },
    });

  const resetBankModalState = () => {
    setSelectedBankAccountId("new");
    setEditingBankAccount(null);
    setSelectedBankCode("");
    setSelectedBankName("");
    setSelectedBankSlug("");
    setAccountNumberInput("");
    setVerifiedAccountName("");
    // New bank accounts should not default to "default" automatically
    setIsDefault(false);
    lastVerifiedKeyRef.current = "";
  };

  const openBankModal = async () => {
    const bankToEdit = primaryBankAccount ?? null;
    setSelectedBankAccountId(bankToEdit?.id ? String(bankToEdit.id) : "new");
    setEditingBankAccount(bankToEdit);
    setSelectedBankCode(bankToEdit?.bankCode ?? "");
    setSelectedBankName(bankToEdit?.bankName ?? "");
    setSelectedBankSlug("");
    setAccountNumberInput(bankToEdit?.accountNumber ?? "");
    setVerifiedAccountName(bankToEdit?.accountName ?? "");
    setIsDefault(bankToEdit?.isDefault ?? true);
    lastVerifiedKeyRef.current = "";
    setIsBankModalOpen(true);
    await refetchBanks();
  };

  const closeBankModal = () => {
    setIsBankModalOpen(false);
    resetBankModalState();
  };

  const handleSelectBankAccount = (id: string) => {
    setSelectedBankAccountId(id);
    if (id === "new") {
      setEditingBankAccount(null);
      setSelectedBankCode("");
      setSelectedBankName("");
      setSelectedBankSlug("");
      setAccountNumberInput("");
      setVerifiedAccountName("");
      // When explicitly choosing "New bank account", start with default unchecked
      setIsDefault(false);
      lastVerifiedKeyRef.current = "";
      return;
    }
    const account = bankAccounts.find((a) => String(a.id) === String(id)) ?? null;
    setEditingBankAccount(account);
    setSelectedBankCode(account?.bankCode ?? "");
    setSelectedBankName(account?.bankName ?? "");
    setSelectedBankSlug("");
    setAccountNumberInput(account?.accountNumber ?? "");
    setVerifiedAccountName(account?.accountName ?? "");
    setIsDefault(account?.isDefault ?? false);
    lastVerifiedKeyRef.current = "";
  };

  const handleSelectBank = (code: string) => {
    const selected = bankDropdownOptions.find((b) => b.value === code);
    setSelectedBankCode(code);
    setSelectedBankName(selected?.label ?? "");
    setSelectedBankSlug(selected?.bank?.slug ?? "");
    setVerifiedAccountName("");
    lastVerifiedKeyRef.current = "";
  };

  const handleAccountNumberChange = async (rawValue: string) => {
    const sanitized = rawValue.replace(/\D/g, "").slice(0, 10);
    setAccountNumberInput(sanitized);
    setVerifiedAccountName("");

    if (!selectedBankCode || !selectedBankSlug || sanitized.length !== 10) return;

    const verificationKey = `${selectedBankCode}-${sanitized}`;
    if (lastVerifiedKeyRef.current === verificationKey) return;
    lastVerifiedKeyRef.current = verificationKey;

    try {
      const response = await verifyBankAccountAsync({
        bankCode: selectedBankCode,
        // API expects "bankName" field, but value should be the bank slug
        bankName: selectedBankSlug,
        accountNumber: sanitized,
      });
      setVerifiedAccountName(response?.data?.accountName ?? "");
    } catch {
      setVerifiedAccountName("");
      lastVerifiedKeyRef.current = "";
    }
  };

  const isSavingBankAccount = isCreatingBankAccount || isUpdatingBankAccount;
  const isEditingExisting = Boolean(editingBankAccount?.id);
  const canConfirmBankAccount = !isSavingBankAccount && !isVerifyingBankAccount && (() => {
    if (!selectedBankCode || !selectedBankName || accountNumberInput.length !== 10) return false;
    // For a brand-new account, require verification via slug + resolved account name.
    if (!isEditingExisting) {
      return Boolean(selectedBankSlug) && Boolean(verifiedAccountName);
    }
    // When editing an existing account, allow confirm without re-verification so
    // the user can change only the default flag or keep existing details.
    return true;
  })();

  const handleCopyAccountNumber = () => {
    if (!primaryBankAccount?.accountNumber) return;
    const value = String(primaryBankAccount.accountNumber);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => fallbackCopyToClipboard(value));
    } else {
      fallbackCopyToClipboard(value);
    }
  };

  // const handleCopyWebhookUrl = () => {
  //   if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
  //     navigator.clipboard.writeText(webhookUrl).catch(() => fallbackCopyToClipboard(webhookUrl));
  //   } else {
  //     fallbackCopyToClipboard(webhookUrl);
  //   }
  //   showToast({
  //     message: "Webhook URL copied to clipboard",
  //     severity: "success",
  //   });
  // };

  const handleCopySecretKey = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(secretKey).catch(() => fallbackCopyToClipboard(secretKey));
    } else {
      fallbackCopyToClipboard(secretKey);
    }
    showToast({
      message: "Paystack Secret Key copied to clipboard",
      severity: "success",
    });
  };

  const handleCopyPublicKey = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(publicKey).catch(() => fallbackCopyToClipboard(publicKey));
    } else {
      fallbackCopyToClipboard(publicKey);
    }
    // showToast({
    //   message: "Paystack Public Key copied to clipboard",
    //   severity: "success",
    // });
  };

  const steps = [
    { description: "Create account on https://paystack.com", icon: <Clover1Icon /> },
    { description: "Login to your Paystack dashboard", icon: <Clover2Icon /> },
    { description: "Go to Settings under API Keys & Webhooks section", icon: <Clover3Icon /> },
    { description: "Paste your secret key in the above field", icon: <Clover4Icon /> },
    {
      description: "Generate and copy your webhook url and paste it on Paystack platform",
      icon: <Clover5Icon />,
    },
  ];

  const handleConfirmBankAccount = async () => {
    if (!canConfirmBankAccount) return;
    const payload = {
      bankName: selectedBankName,
      bankCode: selectedBankCode,
      accountNumber: accountNumberInput,
      accountName: verifiedAccountName,
      isDefault,
    };

    if (editingBankAccount?.id) {
      await updateBankAccountAsync({
        id: editingBankAccount.id,
        ...payload,
      });
    } else {
      await createBankAccountAsync(payload);
    }

    await refetchBankAccounts();
    closeBankModal();
  };

  const handleDeleteBankAccount = async () => {
    if (!editingBankAccount?.id) return;
    await deleteBankAccountAsync({ id: editingBankAccount.id });
    await refetchBankAccounts();
    closeBankModal();
  };

  const canSavePaystackKeys = Boolean(publicKey.trim()) && Boolean(secretKey.trim());

  const handleSavePaystackKeys = async () => {
    if (!canSavePaystackKeys) return;
    await acceptPaystackKeysAsync({ publicKey: publicKey.trim(), secretKey: secretKey.trim() });
    setIsSecretKeyEditable(false);
    setIsPublicKeyEditable(false);
  };

  return {
    paymentMethod,
    secretKey,
    publicKey,
    callbackUrl,
    // webhookUrl,
    isBankModalOpen,
    selectedBankAccountId,
    editingBankAccount,
    selectedBankCode,
    selectedBankName,
    selectedBankSlug,
    accountNumberInput,
    verifiedAccountName,
    isDefault,
    setIsDefault,
    lastVerifiedKeyRef,
    bankAccounts,
    bankAccountOptions,
    primaryBankAccount,
    bankDropdownOptions,
    isLoadingBankAccounts,
    isLoadingBanks,
    isVerifyingBankAccount,
    isCreatingBankAccount,
    isUpdatingBankAccount,
    isDeletingBankAccount,
    isSavingBankAccount,
    canConfirmBankAccount,
    handleCopyAccountNumber,
    // handleCopyWebhookUrl,
    handleCopySecretKey,
    handleCopyPublicKey,
    handleConfirmBankAccount,
    handleDeleteBankAccount,
    openBankModal,
    closeBankModal,
    handleSelectBankAccount,
    handleSelectBank,
    handleAccountNumberChange,
    resetBankModalState,
    steps,
    setPaymentMethod,
    setSecretKey,
    setPublicKey,
    setCallbackUrl,
    canSavePaystackKeys,
    isSavingPaystackKeys,
    handleSavePaystackKeys,
    isLoadingSchool,
    school: schoolResponse?.school,
    isSecretKeyEditable,
    setIsSecretKeyEditable,
    isPublicKeyEditable,
    setIsPublicKeyEditable,
  };
};
