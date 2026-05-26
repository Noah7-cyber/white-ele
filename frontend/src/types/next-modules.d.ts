/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "next/link" {
  const Link: any;
  export default Link;
}

declare module "next/navigation" {
  export const useRouter: any;
  export const usePathname: any;
  export const useParams: any;
  export const useSearchParams: any;
  export const redirect: any;
  export const notFound: any;
}

declare module "next/image" {
  const Image: any;
  export default Image;
}

