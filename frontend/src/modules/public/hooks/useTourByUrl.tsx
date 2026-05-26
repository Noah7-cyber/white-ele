import { useQuery } from "@tanstack/react-query";
import { tourDynamicEndpoints, Tours } from "@/services/tour.service";
import client from "@/utils/client";

export const useTourByUrl = (url: string) => {
  return useQuery<Tours>({
    queryKey: ["tour", url],
    queryFn: async () => {
      const endpoint = tourDynamicEndpoints.getTourByUrl(url);
      const response = await client.request({
        path: endpoint.path,
        method: endpoint.method,
      });
      return response as Tours;
    },
    enabled: !!url,
  });
};
