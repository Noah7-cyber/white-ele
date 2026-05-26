
import { ParentRoutes } from "@/routes/parent.routes";

export default function useSearchMenu() {
  const searchMenuItems = [
    { name: 'View Children', route: ParentRoutes.children },
    { name: 'View Invoices', route: ParentRoutes.invoicing },
    { name: 'View Messages', route: ParentRoutes.messaging },
    { name: 'View Activities', route: ParentRoutes.activities },
  ];
  return { searchMenuItems };
}
