import React from 'react';
import type { Metadata } from 'next';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import LearnClient from './LearnClient';

export const metadata: Metadata = {
  title: 'Learn — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'The space-mission concepts behind the simulation: power, communication, trade-offs, and more.',
};

export default function LearnPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <LearnClient />
      </main>
      <AppFooter />
    </div>
  );
}
