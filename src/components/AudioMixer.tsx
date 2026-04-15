"use client";

import { useEffect, useState, useRef } from "react";
import { Howl } from "howler";
import { Volume2, VolumeX, CloudRain, Wind, Coffee } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Using placeholder URLs for demonstration - in production these would be local assets or a CDN
const AMBIENT_SOUNDS = [
  { id: "rain", name: "Rain", icon: CloudRain, url: "https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg" },
  { id: "wind", name: "Wind", icon: Wind, url: "https://actions.google.com/sounds/v1/weather/wind_howl.ogg" },
  { id: "cafe", name: "Café", icon: Coffee, url: "https://actions.google.com/sounds/v1/crowds/restaurant_ambience.ogg" },
];

export default function AudioMixer() {
  const [volumes, setVolumes] = useLocalStorage<Record<string, number>>("aetheris_mixer_volumes", {
    rain: 0,
    wind: 0,
    cafe: 0,
  });
  
  // Store Howl instances
  const howls = useRef<Record<string, Howl | null>>({
    rain: null,
    wind: null,
    cafe: null,
  });

  // Track if we've interacted to bypass auto-play policies
  const [isReady, setIsReady] = useState(false);

  // Initialize howls on first interaction
  const initAudio = () => {
    if (isReady) return;
    setIsReady(true);
    
    AMBIENT_SOUNDS.forEach((sound) => {
      howls.current[sound.id] = new Howl({
        src: [sound.url],
        loop: true,
        volume: volumes[sound.id] || 0,
        html5: true, // Force HTML5 Audio to allow large file streaming
      });
      
      // Only play if volume is > 0
      if (volumes[sound.id] > 0) {
        howls.current[sound.id]?.play();
      }
    });
  };

  // Update volume specifically
  const handleVolumeChange = (id: string, value: number) => {
    initAudio(); // Ensure audio is initialized
    
    const newVolumes = { ...volumes, [id]: value };
    setVolumes(newVolumes);
    
    const howl = howls.current[id];
    if (howl) {
      if (value > 0 && !howl.playing()) {
        howl.play();
        howl.fade(0, value, 1000); // Smooth fade in
      } else if (value === 0 && howl.playing()) {
        howl.fade(howl.volume(), 0, 1000); // Smooth fade out
        setTimeout(() => howl.pause(), 1000);
      } else {
        howl.volume(value);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Avoid fading on unmount, just halt
      Object.values(howls.current).forEach(howl => {
        if (howl) howl.unload();
      });
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-50 uppercase tracking-widest flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Ambient Mixer
        </h3>
      </div>

      <div className="space-y-6">
        {AMBIENT_SOUNDS.map((sound) => {
          const Icon = sound.icon;
          const currentVol = volumes[sound.id] || 0;
          
          return (
            <div key={sound.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between font-medium opacity-80 px-1">
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {sound.name}
                </span>
                <span className="text-sm font-mono">{Math.round(currentVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentVol}
                onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                onClick={initAudio}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-white/80"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
