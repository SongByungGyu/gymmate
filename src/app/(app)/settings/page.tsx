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
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">설정</h1>
      <SettingsForm profile={profile} />
    </main>
  );
}
