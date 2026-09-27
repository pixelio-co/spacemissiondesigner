import React from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import WhatIfLabClient from './WhatIfLabClient';

export const metadata = {
  title: 'What-If Lab — ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ',
  description: 'Test an alternative mission configuration and compare the trade-offs objectively.',
};

export default function WhatIfLabPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <WhatIfLabClient />
      </main>
      <AppFooter />
    </div>
  );
}
