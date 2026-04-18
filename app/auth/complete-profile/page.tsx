import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Completa tu perfil · Mostacho",
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle<{ full_name: string | null; phone: string | null }>();

  return (
    <AuthShell
      title="Un paso más"
      subtitle="Completa tu perfil para acumular puntos y recibir premios."
    >
      <Suspense fallback={null}>
        <CompleteProfileForm
          defaultFullName={profile?.full_name ?? ""}
          defaultPhone={profile?.phone ?? ""}
        />
      </Suspense>
    </AuthShell>
  );
}
