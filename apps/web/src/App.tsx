import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "./api/client.js";
import { LoginGate } from "./components/LoginGate.js";
import { Workspace } from "./components/Workspace.js";

export function App() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    retry: false,
  });

  if (meQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  const unauthenticated =
    meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;

  if (unauthenticated || !meQuery.data?.authenticated) {
    return <LoginGate />;
  }

  return <Workspace />;
}
