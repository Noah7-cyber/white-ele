import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModalRoute } from "../../routes/modalRoutes";

export const useModalRoute = (clearParams?: boolean) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const newParams = new URLSearchParams(clearParams ? '' : searchParams?.toString());

  const openModal = (
    route: ModalRoute,
    otherParams?: Record<string, string>
  ) => {
    const modalRoute = newParams.get("modal");

    if (modalRoute) {
      newParams.set("modal", route);
    } else {
      newParams.append("modal", route);
    }

    if (otherParams) {
      Object.keys(otherParams).forEach((key) => {
        const keyParam = newParams.get(key);

        if (keyParam) {
          newParams.set(key, otherParams[key]);
        } else {
          newParams.append(key, otherParams[key]);
        }
      });
    }

    router.push(`${pathname}?${newParams.toString()}`);
  };

  const closeModal = (clearParams: boolean = true ) => {
    newParams.delete("modal");
    if (clearParams) {
      router.replace(pathname);
    } else {
      router.replace(`${pathname}?${newParams}`);
    }
  };

  return { openModal, closeModal };
};
