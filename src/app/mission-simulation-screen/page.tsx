import React, { Suspense } from 'react';
import AppNav from '@/components/AppNav';
import AppFooter from '@/components/AppFooter';
import SimulationClient from './components/SimulationClient';

export default function MissionSimulationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 pt-16">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Initializing Mission Control...</p>
            </div>
          </div>
        }>
          <SimulationClient />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}