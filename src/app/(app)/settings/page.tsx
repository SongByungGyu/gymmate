import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/settings-form';

export default async function Settings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;
  return (
    <main className="px-5 pt-6 pb-8">
      <h1 className="text-[22px] font-bold text-[#17191F] mb-6">설정</h1>
      <SettingsForm profile={profile} />
    </main>
  );
}
