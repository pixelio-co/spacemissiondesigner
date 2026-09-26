import React from 'react';
import type { Metadata } from 'next';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'About this independent educational project and the data sources it uses.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <AboutClient />
      </main>
      <AppFooter />
    </div>
  );
}
