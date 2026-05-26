"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function NoAccess() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[75vh] p-6 bg-dashboard-bg/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-border/80 p-8 text-center"
      >
        {/* Animated Icon Wrapper */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100"
        >
          <ShieldAlert className="w-10 h-10" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">
          Access Restricted
        </h1>

        {/* Description */}
        <p className="text-grey-5 text-sm leading-relaxed mb-8">
          You don&apos;t have permission to view this resource. If you believe this is an error, please contact your school administrator.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border-light text-text-primary text-sm font-medium hover:bg-gray-card transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

        </div>
      </motion.div>
    </div>
  );
}
