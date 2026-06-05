import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@auth/create/react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function BanChecker({ children }) {
  const { data: session, status } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isBanned && location.pathname !== "/banned" && !location.pathname.startsWith('/secret-admin-areamokaomarnasr22im')) {
      navigate("/banned", { replace: true });
    }
  }, [session, status, navigate, location]);

  if (status === "authenticated" && session?.user?.isBanned && location.pathname !== "/banned" && !location.pathname.startsWith('/secret-admin-areamokaomarnasr22im')) {
    return null; // Don't render children if they are about to be redirected
  }

  return children;
}

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
        <BanChecker>{children}</BanChecker>
      </div>
    </QueryClientProvider>
  );
}
