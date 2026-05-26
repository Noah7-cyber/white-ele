"use client";

import { Box, Typography, Radio, RadioGroup, CircularProgress, IconButton } from "@mui/material";
import React, { useEffect } from "react";
import { Button } from "@/modules/shared/component/Button";
import { Button as CustomButton } from "@/modules/shared/component/Button";
import CopyIcon from "@/modules/shared/assets/svgs/copy.svg";
import CloseIcon from "@/modules/shared/assets/svgs/closeIcon.svg";
import { Modal } from "@/modules/shared/component/modal";
import { useForm } from "react-hook-form";
import { CWDropdown } from "@/modules/shared/component/FormFields/CWDropdown";
import { CWTextField } from "@/modules/shared/component/FormFields/CWTextField";
import DeleteIcon from "@/modules/shared/assets/svgs/red-thrash.svg";
import ConfirmModal from "@/components/ConfirmModal/confirmModal";
import EditIcon from "@/modules/shared/assets/svgs/editColored.svg";

import { useDashboardPaymentSettings } from "./hooks/useDashboardPaymentSettings";
import { capitalizeFirstLetter } from "@/utils/helpers";
type PaymentMethod = "bankTransfer" | "paystack";

const DashboardPaymentSetting = () => {
  const {
    paymentMethod,
    setPaymentMethod,
    secretKey,
    setSecretKey,
    publicKey,
    setPublicKey,
    // webhookUrl,
    isBankModalOpen,
    selectedBankAccountId,
    editingBankAccount,
    selectedBankCode,
    accountNumberInput,
    verifiedAccountName,
    isDefault,
    setIsDefault,
    bankAccounts,
    bankAccountOptions,
    primaryBankAccount,
    bankDropdownOptions,
    isLoadingBankAccounts,
    isLoadingBanks,
    isVerifyingBankAccount,
    isDeletingBankAccount,
    isSavingBankAccount,
    canConfirmBankAccount,
    handleCopyAccountNumber,
    handleCopySecretKey,
    handleCopyPublicKey,
    handleConfirmBankAccount,
    handleDeleteBankAccount,
    openBankModal,
    closeBankModal,
    handleSelectBankAccount,
    handleSelectBank,
    handleAccountNumberChange,
    steps,
    canSavePaystackKeys,
    isSavingPaystackKeys,
    handleSavePaystackKeys,
    isSecretKeyEditable,
    setIsSecretKeyEditable,
    isPublicKeyEditable,
    setIsPublicKeyEditable,
    school,
  } = useDashboardPaymentSettings();

  const [hasCopiedAccountNumber, setHasCopiedAccountNumber] = React.useState(false);
  const [hasCopiedSecretKey, setHasCopiedSecretKey] = React.useState(false);
  const [hasCopiedPublicKey, setHasCopiedPublicKey] = React.useState(false);
  const [showDeleteBankConfirm, setShowDeleteBankConfirm] = React.useState(false);

  // Local RHF bridge so we can use CW components (which expect RHF control).
  const paystackForm = useForm<{
    secretKey: string;
    publicKey: string;
    callbackUrl: string;
    webhookUrl: string;
  }>({
    defaultValues: { secretKey, publicKey },
  });
  // Keep webhook in sync for the read-only CWTextField
  // useEffect(() => {
  //   paystackForm.setValue("webhookUrl", webhookUrl);
  // }, [paystackForm, webhookUrl]);
  const bankForm = useForm<{ bankAccountId: string; bankCode: string; accountNumber: string }>({
    defaultValues: {
      bankAccountId: selectedBankAccountId,
      bankCode: selectedBankCode,
      accountNumber: accountNumberInput,
    },
  });

  useEffect(() => {
    paystackForm.setValue("secretKey", secretKey);
    paystackForm.setValue("publicKey", publicKey);
    // paystackForm.setValue("callbackUrl", callbackUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretKey, publicKey]);

  useEffect(() => {
    bankForm.setValue("bankAccountId", selectedBankAccountId);
    bankForm.setValue("bankCode", selectedBankCode);
    bankForm.setValue("accountNumber", accountNumberInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBankAccountId, selectedBankCode, accountNumberInput]);

  return (
    <Box className="rounded-lg bg-white flex flex-col gap-5 p-4 sm:p-5">
      {/* Payment Method Selection */}
      <Box className="flex flex-col gap-3">
        <Typography className="text-sm! font-medium! text-[#001F1FB2]!">
          Select Your Preferred Payment Method
        </Typography>
        <RadioGroup
          row
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          className="gap-3 sm:gap-4"
        >
          <Box
            className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-border-lightGray bg-white px-4 py-4 transition-all hover:border-gray-300 sm:flex-none sm:px-6 lg:w-1/4"
            onClick={() => setPaymentMethod("bankTransfer")}
          >
            <Typography className="text-sm! font-medium! text-[#022F2F]!">Bank Transfer</Typography>
            <Radio
              checked={paymentMethod === "bankTransfer"}
              value="bankTransfer"
              sx={{
                color: "#D0D5DD",
                "&.Mui-checked": {
                  color: "#008080",
                },
              }}
            />
          </Box>

          <Box
            className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-border-lightGray bg-white px-4 py-4 transition-all hover:border-gray-300 sm:flex-none sm:px-6 lg:w-1/4"
            onClick={() => setPaymentMethod("paystack")}
          >
            <Typography className="text-sm! font-medium! text-[#022F2F]!">Paystack</Typography>
            <Radio
              checked={paymentMethod === "paystack"}
              value="paystack"
              sx={{
                color: "#D0D5DD",
                "&.Mui-checked": {
                  color: "#008080",
                },
              }}
            />
          </Box>
        </RadioGroup>
      </Box>

      {/* Conditional Content Based on Selected Payment Method */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payment Configuration */}
        <Box
          className={`${paymentMethod === "bankTransfer" ? "lg:col-span-2" : "lg:col-span-2"} flex flex-col gap-5`}
        >
          {paymentMethod === "bankTransfer" ? (
            /* Bank Transfer Details */
            <Box className="rounded-lg border border-border-lightGray bg-white p-4 flex flex-col gap-4">
              <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Typography className="text-sm! font-semibold! text-[#022F2F]!">
                  Default Bank Account
                </Typography>
                <CustomButton
                  onClick={openBankModal}
                  className="!rounded-md !px-5 !py-2 !w-full sm:!w-fit"
                >
                  {primaryBankAccount ? "Edit Bank Details" : "Add Bank Account"}
                </CustomButton>
              </Box>

              {isLoadingBankAccounts ? (
                <Box className="py-8 flex justify-center">
                  <CircularProgress size={24} />
                </Box>
              ) : primaryBankAccount ? (
                <>
                  <Box className="flex flex-col gap-1">
                    <Typography className="text-xs! text-[#001F1FB2]!">Account Name</Typography>
                    <Typography className="text-md! font-medium! text-[#022F2F]!">
                      {capitalizeFirstLetter(primaryBankAccount.accountName)}
                    </Typography>
                  </Box>
                  <Box className="flex flex-col gap-1">
                    <Typography className="text-xs! text-[#001F1FB2]!">Bank Name</Typography>
                    <Typography className="text-md! font-medium! text-[#022F2F]! uppercase">
                      {capitalizeFirstLetter(primaryBankAccount?.bankName)}
                    </Typography>
                  </Box>
                  <Box className="flex flex-col w-full gap-1">
                    <Typography className="text-xs! text-[#001F1FB2]!">
                      Bank Account Number
                    </Typography>
                    <Box className="flex flex-row flex-wrap items-center gap-2">
                      <Typography className="text-md! font-medium! text-[#022F2F]!">
                        {primaryBankAccount?.accountNumber}
                      </Typography>
                      <Box className="relative">
                        <Button
                          onClick={() => {
                            handleCopyAccountNumber();
                            setHasCopiedAccountNumber(true);
                            setTimeout(() => setHasCopiedAccountNumber(false), 1500);
                          }}
                          sx={{
                            minWidth: "auto",
                            width: 20,
                            height: 20,
                            padding: 0,
                          }}
                          className="!p-1 !w-fit !h-fit !bg-transparent !border-none !shadow-none"
                        >
                          <CopyIcon />
                        </Button>
                        {hasCopiedAccountNumber && (
                          <Box className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#022F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
                            Copied
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography className="text-sm! text-[#667085]!">
                  No bank account found. Click &quot;Add Bank Account&quot; to create one.
                </Typography>
              )}
            </Box>
          ) : (
            /* Paystack Configuration */
            <Box className="rounded-lg border border-border-lightGray bg-white p-4 sm:p-6 flex flex-col gap-8 lg:flex-row lg:gap-10">
              {/* Left Column - Form */}
              <Box className="flex-1 flex flex-col gap-6">
                {/* Payment Secret Key */}
                <Box className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    Payment Secret Key (Required)
                  </Typography>
                  <Typography className="text-xs! text-[#667085]! mb-1!">
                    Input your Paystack Secret Key below to set up your payment processes with one
                    single click.
                  </Typography>
                  <Box className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Box className="flex-1 min-w-0">
                      <CWTextField
                        control={paystackForm.control}
                        name="secretKey"
                        placeholder="Enter your paystack secret key here"
                        labelOnTop
                        label=" "
                        disabled={!isSecretKeyEditable}
                        labelClassName="!text-sm !font-medium !text-input-gray"
                        inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                        onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSecretKey(e.target.value)
                        }
                        onBlurCapture={() => {
                          if (school?.PaystackSecretKey) setIsSecretKeyEditable(false);
                        }}
                      />
                    </Box>
                    {!isSecretKeyEditable && school?.PaystackSecretKey && (
                      <Box className="flex items-center gap-2 mt-1 relative">
                        <IconButton
                          onClick={() => {
                            handleCopySecretKey();
                            setHasCopiedSecretKey(true);
                            setTimeout(() => setHasCopiedSecretKey(false), 1500);
                          }}
                          size="small"
                          className=""
                        >
                          <CopyIcon className="w-6 h-6 text-[#667085]" />
                        </IconButton>
                        <IconButton
                          onClick={() => setIsSecretKeyEditable(true)}
                          size="small"
                          className=""
                        >
                          <EditIcon className="w-5 h-5" />
                        </IconButton>
                        {hasCopiedSecretKey && (
                          <Box className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#022F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
                            Copied
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Public Key */}
                <Box className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    Public Key
                  </Typography>
                  <Box className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Box className="flex-1 min-w-0">
                      <CWTextField
                        control={paystackForm.control}
                        name="publicKey"
                        placeholder="Enter your public key here"
                        labelOnTop
                        label=" "
                        disabled={!isPublicKeyEditable}
                        labelClassName="!text-sm !font-medium !text-input-gray"
                        inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                        onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPublicKey(e.target.value)
                        }
                        onBlurCapture={() => {
                          if (school?.PaystackPublicKey) setIsPublicKeyEditable(false);
                        }}
                      />
                    </Box>
                    {!isPublicKeyEditable && school?.PaystackPublicKey && (
                      <Box className="flex items-center gap-2 mt-1 relative">
                        <IconButton
                          onClick={() => {
                            handleCopyPublicKey();
                            setHasCopiedPublicKey(true);
                            setTimeout(() => setHasCopiedPublicKey(false), 1500);
                          }}
                          size="small"
                          className="!p-1"
                        >
                          <CopyIcon className="w-6 h-6 text-[#667085]" />
                        </IconButton>
                        <IconButton
                          onClick={() => setIsPublicKeyEditable(true)}
                          size="small"
                          className=""
                        >
                          <EditIcon className="w-5 h-5" />
                        </IconButton>
                        {hasCopiedPublicKey && (
                          <Box className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#022F2F] text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
                            Copied
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Callback URL */}
                {/* <Box className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    Callback URL
                  </Typography>
                  <CWTextField
                    control={paystackForm.control}
                    name="callbackUrl"
                    placeholder="Enter your callback url here"
                    labelOnTop
                    label=" "
                    labelClassName="!text-sm !font-medium !text-input-gray"
                    inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                    onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCallbackUrl(e.target.value)
                    }
                  />
                </Box> */}

                {/* Webhook URL */}
                {/* <Box className="flex flex-col gap-2">
                  <Typography className="text-sm! font-medium! text-[#022F2F]!">
                    Your Unique Webhook URL
                  </Typography>
                  <Box className="flex flex-row gap-2 items-center">
                    <CWTextField
                      control={paystackForm.control}
                      name="webhookUrl"
                      labelOnTop
                      label=" "
                      disabled
                      inputClasses="!text-xs !h-12 !rounded-md !bg-gray-50"
                      placeholder=""
                    />
                    <Box
                      onClick={handleCopyWebhookUrl}
                      className="p-3 border border-[#D0D5DD] rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-center h-12 w-12"
                    >
                      <CopyIcon className="text-[#667085]" />
                    </Box>
                  </Box>
                </Box> */}

                <Button
                  variant="contained"
                  className="!bg-[#008080] !text-white !font-semibold !py-3 !px-8 !rounded-lg !w-full sm:!w-fit !text-sm !normal-case !shadow-none hover:!bg-[#006666]"
                  onClick={() => void handleSavePaystackKeys()}
                  disabled={!canSavePaystackKeys || isSavingPaystackKeys}
                >
                  {isSavingPaystackKeys ? (
                    <span className="flex items-center gap-2">
                      <CircularProgress size={18} className="!text-white" /> Saving...
                    </span>
                  ) : (
                    "Save configuration"
                  )}
                </Button>
              </Box>

              {/* Right Column - Guide */}
              <Box className="lg:w-1/3 flex flex-col gap-5">
                <Typography className="text-lg! font-bold! text-[#022F2F]!">
                  How to find your secret key.
                </Typography>
                <Box className="flex flex-col gap-5">
                  {steps.map((step, index) => (
                    <Box key={index} className="flex flex-row gap-4 items-start">
                      <Box className="shrink-0 mt-0.5">{step.icon}</Box>
                      <Typography className="text-sm! text-[#344054]! font-medium! leading-tight">
                        {step.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Modal
        isOpen={isBankModalOpen}
        onClose={closeBankModal}
        className="w-[calc(100vw-32px)] max-w-[640px] rounded-lg p-4 sm:p-6"
      >
        <Box className="flex flex-col h-full">
          <Box className="flex items-center justify-between border-b border-[#E4E7EC] pb-4 mb-6">
            <Typography className="text-xl! font-semibold! text-[#022F2F]!">
              {editingBankAccount ? "Edit Bank Account" : "Add Bank Account"}
            </Typography>
            <IconButton onClick={closeBankModal} size="small" className="!p-1" aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box className="flex flex-col gap-5 flex-1">
            {bankAccounts.length > 0 && (
              <Box className="flex flex-col gap-2">
                <CWDropdown
                  control={bankForm.control}
                  name="bankAccountId"
                  options={bankAccountOptions.map((o) => ({ name: o.label, value: o.value }))}
                  isForm
                  textFieldProps={{
                    label: "Bank Account",
                    labelOnTop: true,
                    placeholder: "Select bank account",
                    labelClassName: "!text-sm !font-medium !text-[#022F2F]!",
                    inputClasses:
                      "mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray",
                  }}
                  onChangeValue={(val) => handleSelectBankAccount(String(val))}
                />
              </Box>
            )}

            <Box className="flex flex-col gap-2">
              <CWDropdown
                control={bankForm.control}
                name="bankCode"
                options={(bankDropdownOptions || []).map((b) => ({
                  name: b.label,
                  value: b.value,
                }))}
                isForm
                hasSearch
                disabled={isLoadingBanks}
                textFieldProps={{
                  label: "Select Bank",
                  labelOnTop: true,
                  placeholder: "Choose bank",
                  labelClassName: "!text-sm !font-medium !text-[#022F2F]!",
                  inputClasses: "mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray",
                }}
                onChangeValue={(val) => handleSelectBank(String(val))}
              />
            </Box>

            <Box className="flex flex-col gap-2">
              <CWTextField
                control={bankForm.control}
                name="accountNumber"
                label="Account Number"
                labelOnTop
                placeholder="Enter 10-digit account number"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                labelClassName="!text-sm !font-medium !text-input-gray"
                inputClasses="mt-1 !text-xs !h-10 !text-input-gray placeholder:!text-input-gray"
                onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) =>
                  void handleAccountNumberChange(e.target.value)
                }
              />
              {isVerifyingBankAccount && (
                <Typography className="text-xs! text-[#008080]!">Verifying account...</Typography>
              )}
              {verifiedAccountName && (
                <Typography className="text-xs! font-medium! text-[#027A48]!">
                  Account Name: {verifiedAccountName}
                </Typography>
              )}
            </Box>

            <Box className="flex items-center gap-2">
              <Radio
                checked={isDefault}
                onChange={() => setIsDefault((prev) => !prev)}
                sx={{
                  color: "#D0D5DD",
                  "&.Mui-checked": { color: "#008080" },
                }}
              />
              <Typography className="text-sm! text-[#344054]!">Set as default account</Typography>
            </Box>
          </Box>

          <Box className="flex flex-col gap-4 mt-6 pt-4 border-t border-[#E4E7EC] sm:flex-row sm:justify-between">
            <Box>
              {editingBankAccount?.id ? (
                <CustomButton
                  variant="outlined"
                  onClick={() => setShowDeleteBankConfirm(true)}
                  className="!rounded-lg !px-0 !py-0 !border-0 !bg-transparent !text-[#B42318]"
                >
                  <DeleteIcon />
                </CustomButton>
              ) : null}
            </Box>

            <Box className="grid grid-cols-2 gap-3 sm:flex">
              <CustomButton
                type="button"
                onClick={closeBankModal}
                variant="outlined"
                className="!rounded-lg !px-6 !py-2 !border !border-[#D0D5DD] !bg-white !text-[#344054]"
                disabled={isSavingBankAccount || isDeletingBankAccount}
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={() => void handleConfirmBankAccount()}
                loading={isSavingBankAccount}
                disabled={!canConfirmBankAccount}
                className="!rounded-lg !px-6 !py-2 !bg-[#008080] !text-white"
              >
                Confirm
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Modal>
      <ConfirmModal
        open={showDeleteBankConfirm}
        onClose={() => setShowDeleteBankConfirm(false)}
        onConfirm={async () => {
          await handleDeleteBankAccount();
          setShowDeleteBankConfirm(false);
        }}
        loading={isDeletingBankAccount}
        icon={<DeleteIcon />}
        title="Delete bank account?"
        description="This bank account will be removed. This action cannot be undone."
        confirmLabel="Delete"
        confirmLabelClassName="!bg-[#B42318] hover:!bg-[#7F1D1D]"
      />
    </Box>
  );
};

export default DashboardPaymentSetting;
