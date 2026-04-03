import { createFileRoute } from "@tanstack/react-router";
import { $api } from "@/utils/api";

export const Route = createFileRoute("/_authed/scan")({
  wrapInSuspense: true,
  loader: async ({ context: { queryClient } }) => {
    // Await API generation and implementation, for now we will stub it out
    // queryClient.ensureQueryData($api.queryOptions("get", "/scans"));
  },
});
