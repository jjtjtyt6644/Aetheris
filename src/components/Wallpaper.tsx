"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Curated list of verified high-quality Unsplash photo IDs
// Full URL format: https://images.unsplash.com/photo-{id}
export const BACKGROUNDS = [
  { id: "1519681393784-d120267933ba", name: "Rainy Window",          theme: "dark"   },
  { id: "1511920170033-f8396924c348", name: "Lofi Café",             theme: "warm"   },
  { id: "1507003211169-0a1dd7228f2d", name: "Dark Academia Library", theme: "dark"   },
  { id: "1480714378408-67cf0d13bc1b", name: "Neon City Night",       theme: "dark"   },
  { id: "1441974231531-c6227db76b6e", name: "Forest Path",           theme: "nature" },
  { id: "1472214103451-9374bd1c798e", name: "Sunset Horizon",        theme: "warm"   },
  { id: "1493246507139-91e8fad9978e", name: "Alpine Peak",           theme: "light"  },
  { id: "1434725039720-af0c2294c5b1", name: "Ocean Waves",           theme: "nature" },
  { id: "1516912481800-cdfab95d7ee5", name: "Cherry Blossoms",       theme: "light"  },
  { id: "1470252649378-9c29740c9fa8", name: "Mountain Lake",         theme: "nature" },
  { id: "1508739773434-c26b3d09e071", name: "Tokyo Street",          theme: "dark"   },
  { id: "1541746972996-4e0b0f43e02a", name: "Cozy Study Room",       theme: "warm"   },
];

// A minimal base64 blurred gray placeholder to prevent layout shifts while loading
const BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEB//EAB8QAAICAQUBAAAAAAAAAAAAAAECAwQREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCroNdqNDxnG1FpWJWCgtISSSSSTz8kkmAADShWm//Z";

interface WallpaperProps {
  currentBgId: string;
}

export default function Wallpaper({ currentBgId }: WallpaperProps) {
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(currentBgId);

  useEffect(() => {
    setActiveId(currentBgId);
    setLoaded(false);
  }, [currentBgId]);

  // Optimized Unsplash URL: auto=format (serves WebP), w=1920, q=80
  const imageUrl = `https://images.unsplash.com/photo-${activeId}?auto=format&w=1920&q=80`;

  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-neutral-900">
      <Image
        key={activeId}
        src={imageUrl}
        alt="Aetheris Background"
        fill
        priority
        className={`object-cover transition-opacity duration-1000 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
      />
      {/* Subtle dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
    </div>
  );
}
