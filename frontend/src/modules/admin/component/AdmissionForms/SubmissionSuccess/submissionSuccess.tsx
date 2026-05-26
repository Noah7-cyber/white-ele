import React, { ReactNode } from "react";

const SubmissionSuccess = ({
  formTitle,
  onSubmitAnother,
  schoolLogo,
}: {
  formTitle: string;
  schoolLogo?: ReactNode;
  onSubmitAnother: () => void;
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-160">
        {/* Logo */}
        {schoolLogo}

        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-brandColor-active mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Your response has been recorded
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for submitting the &quot;{formTitle}&quot; form.
          </p>
          <button
            onClick={onSubmitAnother}
            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            Submit another response
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
