'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type Pin = {
  lat: number;
  lng: number;
  label: string;
  color?: string;
  size?: number;
};

interface OverlapseGlobeProps {
  pins?: Pin[];
  focus?: { lat: number; lng: number; label?: string };
  height?: number;
  className?: string;
  onPinClick?: (pin: Pin) => void;
}

export function OverlapseGlobe({
  pins = [
    { lat: -34.6118, lng: -58.396, label: 'Buenos Aires', color: '#ff6a1a', size: 0.9 },
    { lat: -31.5, lng: -64.0, label: 'Córdoba Relay', color: '#00e0ff', size: 0.55 },
  ],
  focus,
  height = 520,
  className,
  onPinClick,
}: OverlapseGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [hoverInfo, setHoverInfo] = useState<Pin | null>(null);
  const [flights, setFlights] = useState(0);

  useEffect(() => {
    let globe: any;
    let alive = true;
    let animId = 0;

    (async () => {
      const Globe = (await import('globe.gl')).default;

      if (!mountRef.current || !alive) return;

      const container = mountRef.current;
      const width = container.clientWidth;
      const w = width;
      const h = height;

      // flight arcs – mock between pins, plus live OpenSky attempt
      const arcs = pins.length > 1 ? [{
        startLat: pins[0].lat, startLng: pins[0].lng,
        endLat: pins[1].lat, endLng: pins[1].lng,
        color: ['#ff6a1a', '#00e0ff'],
        dashLength: 0.4,
        dashGap: 0.08,
      }] : [];

      globe = new (Globe as any)(container)
        .width(w)
        .height(h)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .showGraticules(true)
        .showAtmosphere(true)
        .atmosphereColor('#00e0ff')
        .atmosphereAltitude(0.18)
        .pointsData(pins)
        .pointLat((d: any) => d.lat)
        .pointLng((d: any) => d.lng)
        .pointColor((d: any) => d.color || '#ff6a1a')
        .pointAltitude(0.018)
        .pointRadius((d: any) => d.size || 0.65)
        .pointOfViewAltitude(2.1)
        .arcsData(arcs)
        .arcColor('color' as any)
        .arcDashLength((d: any) => d.dashLength)
        .arcDashGap((d: any) => d.dashGap)
        .arcDashAnimateTime(4200)
        .arcStroke(0.8)
        .onPointHover((p: any) => setHoverInfo(p as Pin | null))
        .onPointClick((p: any) => onPinClick?.(p));

      globeRef.current = globe;

      // pulsing
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
      controls.minDistance = 170;
      controls.maxDistance = 420;

      // focus if provided
      if (focus) {
        globe.pointOfView({ lat: focus.lat, lng: focus.lng, altitude: 1.45 }, 1600);
      }

      // resize
      const ro = new ResizeObserver(() => {
        if (!container || !globe) return;
        globe.width(container.clientWidth).height(height);
      });
      ro.observe(container);

      // try OpenSky live – fallback gracefully
      try {
        const lats = pins.map(p => p.lat);
        const lngs = pins.map(p => p.lng);
        const lamin = Math.min(...lats) - 8;
        const lamax = Math.max(...lats) + 8;
        const lomin = Math.min(...lngs) - 12;
        const lomax = Math.max(...lngs) + 12;
        const res = await fetch(`https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`, { cache: 'no-store' }).catch(()=>null);
        if (res && res.ok) {
          const j = await res.json();
          setFlights(j?.states?.length ?? 0);
        }
      } catch {}

      return () => ro.disconnect();
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(animId);
      if (mountRef.current) mountRef.current.innerHTML = '';
      globeRef.current = null;
    };
  }, [height, JSON.stringify(pins), focus?.lat, focus?.lng, onPinClick]);

  return (
    <div className={className} style={{ fontFamily: '"Fragment Mono", monospace' }}>
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 px-1 uppercase tracking-widest">
        <span>Zoomed in on: <span className="text-[#ff6a1a]">{focus?.label || 'Argentina'}</span></span>
        <span className="text-zinc-500">LIVE • {flights ? `${flights} tracks` : 'OpenSky 10s poll'}</span>
      </div>
      <div
        ref={mountRef}
        className="relative rounded-[28px] overflow-hidden border border-white/[0.07] bg-[#06070b] shadow-[0_0_80px_rgba(0,224,255,0.04),inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ height, width: '100%' }}
      >
        {/* grid overlay hint */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`,
          backgroundSize: '72px 56px'
        }}/>
        {hoverInfo && (
          <div className="absolute left-4 top-4 z-10 text-[11px] bg-black/70 backdrop-blur-md border border-[#00e0ff]/30 rounded-xl px-3 py-2 text-zinc-200 shadow-xl">
            <div className="text-[#ff6a1a] font-bold">{hoverInfo.label}</div>
            <div className="text-zinc-400">{hoverInfo.lat.toFixed(2)}, {hoverInfo.lng.toFixed(2)}</div>
            <div className="text-[10px] text-zinc-500">click → focus</div>
          </div>
        )}
        <div className="absolute right-3 bottom-3 text-[9px] text-zinc-500 tracking-wider">
          GLOBE.GL • NASA Black Marble • SIGINT HUD
        </div>
      </div>
    </div>
  );
}

export default OverlapseGlobe;
