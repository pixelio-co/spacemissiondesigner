import React from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import MissionResultClient from './MissionResultClient';

export const metadata = {
  title: 'Mission Result — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'Review the result of the mission simulation you completed in this session.',
};

export default function MissionResultPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <MissionResultClient />
      </main>
      <AppFooter />
    </div>
  );
}
