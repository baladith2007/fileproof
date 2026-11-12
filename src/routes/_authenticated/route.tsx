import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/auth" });
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? s.session.user;
    return { user };
  },
  component: () => <Outlet />,
});
