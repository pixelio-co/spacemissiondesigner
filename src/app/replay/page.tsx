import React from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import ReplayClient from './ReplayClient';

export const metadata = {
  title: 'Replay Mission — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'Replay your mission changing one major decision and compare outcomes.',
};

export default function ReplayPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <ReplayClient />
      </main>
      <AppFooter />
    </div>
  );
}
