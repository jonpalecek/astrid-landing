import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import ChatWidget from '@/components/ChatWidget';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get instance info for chat widget
  const { data: instance } = await supabase
    .from('instances')
    .select('assistant_name, assistant_emoji, status')
    .eq('user_id', user.id)
    .single();

  const showChat = instance?.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {showChat && (
        <ChatWidget 
          assistantName={instance?.assistant_name || 'Astrid'} 
          assistantEmoji={instance?.assistant_emoji || '✨'} 
        />
      )}
    </div>
  );
}
