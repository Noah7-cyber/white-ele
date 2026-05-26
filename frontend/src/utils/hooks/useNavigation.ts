"use client";

import { useRouter } from "next/navigation";

// export const useNavigation = () => {
//   const router = useRouter();

//   const handleNavigation = (data: string) => router.push(data);

//   return {
//     handleNavigation,
//   };
// };

export const useNavigation = () => {
  const router = useRouter();
  return {
    push: router.push,
    back: router.back,
    refresh: router.refresh,
  };
};
