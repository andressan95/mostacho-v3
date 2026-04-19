import { GlassCard } from "@/components/glass";
import { ProfileForm } from "@/components/client/ProfileForm";
import { PushNotificationsCard } from "@/components/client/PushNotificationsCard";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ClientProfilePage() {
  const session = await requireSession();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, birthday, email")
    .eq("id", session.profileId)
    .maybeSingle<{
      full_name: string | null;
      phone: string | null;
      birthday: string | null;
      email: string | null;
    }>();

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Perfil
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {profile?.email ?? session.email}
        </p>
      </div>

      <GlassCard variant="strong">
        <ProfileForm
          fullName={profile?.full_name ?? session.fullName}
          phone={profile?.phone ?? ""}
          birthday={profile?.birthday ?? null}
        />
      </GlassCard>

      <PushNotificationsCard />
    </div>
  );
}
