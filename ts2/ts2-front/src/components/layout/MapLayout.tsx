import React from 'react';
import { Sidebar } from '../map/Sidebar';
import { TopControls } from '../map/TopControls';
import { LayerSwitcher } from '../map/LayerSwitcher';

interface MapLayoutProps {
  children: React.ReactNode;
}

export function MapLayout({ children }: MapLayoutProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      {/* Background Map Container */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Floating UI Overlays */}
      <Sidebar />
      <TopControls />
      <LayerSwitcher />
    </div>
  );
}
