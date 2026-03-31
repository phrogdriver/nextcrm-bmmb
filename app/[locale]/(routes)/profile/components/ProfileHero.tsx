// app/[locale]/(routes)/profile/components/ProfileHero.tsx
import { Users } from "@prisma/client";
import { ProfileHeroAvatar } from "./ProfileHeroAvatar";
import { ROLE_LABELS } from "@/lib/permissions.shared";

type Props = {
  data: Users;
};

export async function ProfileHero({ data }: Props) {
  const displayName = [data.first_name, data.last_name].filter(Boolean).join(" ") || data.name || "User";
  const roleLabel = ROLE_LABELS[data.role] ?? data.role;

  return (
    <div className="px-7 py-6 flex items-center gap-4" style={{ background: "linear-gradient(to right, #1B2A4A, #2A3F6A)" }}>
      <ProfileHeroAvatar avatar={data.avatar} name={displayName} />
      <div>
        <div className="text-white text-lg font-bold leading-tight">
          {displayName}
        </div>
        <div className="text-white/75 text-sm">{data.email}</div>
        <span className="mt-1.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
          {roleLabel}
        </span>
      </div>
    </div>
  );
}
