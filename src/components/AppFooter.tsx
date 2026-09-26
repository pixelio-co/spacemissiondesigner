import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Rocket, Info } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AppLogo size={32} />
              <span className="font-bold text-sm tracking-wider text-foreground">
                ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Design. Plan. Explore.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              An independent educational space mission simulation created for the NASA Space Apps Challenge 2026.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Navigation</h3>
            <div className="space-y-2">
              {[
                { label: 'Home', href: '/', icon: Rocket },
                { label: 'Mission Designer', href: '/mission-designer', icon: Rocket },
                { label: 'Learn', href: '/learn', icon: Rocket },
                { label: 'About & Data Sources', href: '/about', icon: Rocket },
              ]?.map((item) => {
                const Icon = item?.icon;
                return (
                  <Link
                    key={`footer-nav-${item?.label}`}
                    href={item?.href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon size={12} />
                    {item?.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">About</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Built by{' '}
                <span className="text-accent font-semibold">Ralph Sean</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Built for{' '}
                <span className="text-foreground font-medium">NASA Space Apps Challenge 2026</span>
              </p>
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <Info size={12} className="text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This is an independent educational project and is not an official NASA website.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ — Built by{' '}
            <span className="text-accent font-semibold">Ralph Sean</span>
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Independent educational project · Not affiliated with or endorsed by NASA
          </p>
        </div>
      </div>
    </footer>
  );
}