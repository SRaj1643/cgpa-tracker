import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/OfflineBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4">
      <div className="glass shadow-elegant rounded-2xl p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg gradient-bg px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-90 transition"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-lg gradient-bg px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GradeFlow AI — Track your academic journey beautifully" },
      { name: "description", content: "Premium CGPA & SGPA tracker for IIT and college students. Beautiful analytics, smart insights." },
      { property: "og:title", content: "GradeFlow AI — Track your academic journey beautifully" },
      { property: "og:description", content: "Premium CGPA & SGPA tracker for IIT and college students. Beautiful analytics, smart insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "GradeFlow AI — Track your academic journey beautifully" },
      { name: "twitter:description", content: "Premium CGPA & SGPA tracker for IIT and college students. Beautiful analytics, smart insights." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22519f41-7297-40b3-ae89-ddfa726dc68f/id-preview-a0994b74--e739beea-4bfb-4b20-8d24-a8d928279295.lovable.app-1778493575473.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/22519f41-7297-40b3-ae89-ddfa726dc68f/id-preview-a0994b74--e739beea-4bfb-4b20-8d24-a8d928279295.lovable.app-1778493575473.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
