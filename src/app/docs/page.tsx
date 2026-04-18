"use client";

import DocsContent from "@/components/DocsContent";
import Wallpaper, { BACKGROUNDS } from "@/components/Wallpaper";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function DocsPage() {
  const [bgId] = useLocalStorage("aetheris_bg_id", BACKGROUNDS[0].id);

  return (
    <main className="relative h-screen w-full overflow-hidden text-white font-sans">
      <div className="fixed inset-0 z-0">
        <Wallpaper currentBgId={bgId} />
      </div>
      
      <div className="relative z-10 min-h-screen">
        <DocsContent isPage={true} />
      </div>
    </main>
  );
}
