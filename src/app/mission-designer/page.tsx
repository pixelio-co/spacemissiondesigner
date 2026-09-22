import React from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import MissionDesignerClient from './components/MissionDesignerClient';

export default function MissionDesignerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <MissionDesignerClient />
      </main>
      <AppFooter />
    </div>
  );
}