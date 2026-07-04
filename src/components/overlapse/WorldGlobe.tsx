'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Layers, RotateCw, Plus, Minus, Plane, Mountain, Map as MapIcon, Satellite, Moon } from 'lucide-react';
import { resolveZoomLabel, searchCities, type CameraPosition } from '@/lib/overlapse/zoom-label';
import { getPinColor, isGoldenHour } from '@/lib/overlapse/sun-position';
import { useFlightTracking, povToBounds } from '@/lib/opensky/use-flight-tracking';

// ============================================================
// Types
// ============================================================

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  altitude?: number; // extrusion height (0-1)
  timezone?: string;
}

export interface FlightAircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  lat: number;
  lng: number;
  altitude: number; // meters
  velocity: number; // m/s
  heading: number; // degrees
}

export interface WorldGlobeProps {
  pins?: Pin[];
  height?: number;
  className?: string;
  onPinClick?: (pin: Pin) => void;
  onLocationChange?: (label: string, lat: number, lng: number) => void;
  initialFocus?: { lat: number; lng: number; altitude?: number };
  autoRotate?: boolean;
  onAutoRotateChange?: (enabled: boolean) => void;
  aircraft?: FlightAircraft[];
  showAircraft?: boolean;
  aircraftStyle?: 'svg' | '3d';
}

// ============================================================
// Layer definitions — all FREE, no API keys, no credit card
// ============================================================

export interface MapLayer {
  id: string;
  name: string;
  icon: React.ReactNode;
  recommended?: boolean;
  // For globe.gl tile layers
  tileUrl?: string;
  // For static globe textures
  globeImageUrl?: string;
  bumpImageUrl?: string;
  description: string;
}

const LAYERS: MapLayer[] = [
  {
    id: 'esri-satellite',
    name: 'Esri Satellite',
    icon: <Satellite className="w-3 h-3" />,
    recommended: true,
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    description: 'Free satellite imagery — Google-Earth-quality progressive zoom. No API key.',
  },
  {
    id: 'nasa-black-marble',
    name: 'NASA Black Marble',
    icon: <Moon className="w-3 h-3" />,
    recommended: true,
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    description: 'NASA night-lights Earth texture. Default mission-control look.',
  },
  {
    id: 'nasa-blue-marble',
    name: 'NASA Blue Marble',
    icon: <Satellite className="w-3 h-3" />,
    globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
    description: 'NASA daytime Earth texture — classic blue marble view.',
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    icon: <MapIcon className="w-3 h-3" />,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    description: 'Free community-driven street map. No API key.',
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    icon: <Mountain className="w-3 h-3" />,
    tileUrl: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    description: 'Topographic map with contour lines. Free, no API key.',
  },
  {
    id: 'esri-street',
    name: 'Esri Streets',
    icon: <MapIcon className="w-3 h-3" />,
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    description: 'Street map from Esri. Free, no API key.',
  },
  {
    id: 'esri-topo',
    name: 'Esri Topographic',
    icon: <Mountain className="w-3 h-3" />,
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    description: 'Topographic basemap from Esri. Free, no API key.',
  },
];

const DEFAULT_LAYER_ID = 'nasa-black-marble';

// ============================================================
// Component
// ============================================================

export function WorldGlobe({
  pins = [],
  height = 520,
  className,
  onPinClick,
  onLocationChange,
  initialFocus,
  autoRotate = false,
  onAutoRotateChange,
  aircraft = [],
  showAircraft = false,
  aircraftStyle = 'svg',
}: WorldGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const autoRotateRef = useRef(autoRotate);
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const [hoveredAircraft, setHoveredAircraft] = useState<FlightAircraft | null>(null);
  const [currentLabel, setCurrentLabel] = useState('The World');
  const [currentZoom, setCurrentZoom] = useState('World');
  const [currentLayer, setCurrentLayer] = useState<MapLayer>(LAYERS[1]); // NASA Black Marble default
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pin[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [flightCount, setFlightCount] = useState(0);
  const [flightsEnabled, setFlightsEnabled] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [flightStale, setFlightStale] = useState(false);
  const labelUpdateTimer = useRef<number | null>(null);
  const currentPovRef = useRef<{lat:number, lng:number, altitude:number}>({lat:20, lng:0, altitude:2.5});

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.35;
    }
  }, [autoRotate]);

  // Build 3D pin geometry: a small cone + cylinder "pin" shape
  const buildPinMesh = useCallback((pin: Pin): THREE.Object3D => {
    const group = new THREE.Group();

    // Use sun-position-based color if pin.color not provided
    const colorHex = pin.color || getPinColor(pin.lat, pin.lng);
    const color = new THREE.Color(colorHex);

    // Cone (the pin head)
    const coneGeometry = new THREE.ConeGeometry(0.8, 2.5, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.5,
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 1.25;
    cone.rotation.x = Math.PI; // point down to globe
    group.add(cone);

    // Cylinder (the pin stick)
    const cylGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
    const cylMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x444444,
      emissiveIntensity: 0.2,
      metalness: 0.5,
      roughness: 0.4,
    });
    const cyl = new THREE.Mesh(cylGeometry, cylMaterial);
    cyl.position.y = -0.75;
    group.add(cyl);

    // Glow halo (transparent sphere)
    const haloGeom = new THREE.SphereGeometry(1.2, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.position.y = 1.25;
    group.add(halo);

    // Pulsing animation — store original scale for ping-pong
    group.userData = { pulse: true, baseScale: 1, color: colorHex };

    return group;
  }, []);

  // Build aircraft marker — 3D plane (cone pointing in heading direction)
  const buildAircraftMesh = useCallback((ac: FlightAircraft): THREE.Object3D => {
    const group = new THREE.Group();

    // Altitude color: green=low, amber=mid, red=high
    const alt = ac.altitude;
    let colorHex: string;
    if (alt < 3000) colorHex = '#7cffb0'; // green
    else if (alt < 7000) colorHex = '#ffd166'; // amber
    else colorHex = '#ff4444'; // red

    const color = new THREE.Color(colorHex);

    // Plane body — elongated cone pointing forward
    const bodyGeom = new THREE.ConeGeometry(0.4, 2, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.rotation.x = Math.PI / 2; // point along +Z (forward)
    body.rotation.y = 0;
    group.add(body);

    // Wings — flat box
    const wingsGeom = new THREE.BoxGeometry(2.4, 0.05, 0.5);
    const wingsMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const wings = new THREE.Mesh(wingsGeom, wingsMat);
    group.add(wings);

    // Tail
    const tailGeom = new THREE.BoxGeometry(0.05, 0.6, 0.4);
    const tail = new THREE.Mesh(tailGeom, wingsMat);
    tail.position.set(0, 0.3, -0.8);
    group.add(tail);

    // Rotate to heading (0 = north, 90 = east)
    group.rotation.y = (-ac.heading * Math.PI) / 180;

    group.userData = { isAircraft: true, icao24: ac.icao24, color: colorHex };

    return group;
  }, []);

  // ============================================================
  // Globe initialization
  // ============================================================

  useEffect(() => {
    let alive = true;
    let globe: any;
    let animationFrame: number;
    let pulseStart = Date.now();

    (async () => {
      if (!mountRef.current) return;

      const GlobeModule = await import('globe.gl');
      const Globe = GlobeModule.default;

      if (!mountRef.current || !alive) return;

      const container = mountRef.current;
      const width = container.clientWidth;
      const h = height;

      globe = new (Globe as any)(container)
        .width(width)
        .height(h)
        .backgroundColor('rgba(0,0,0,0)')
        .showGraticules(true)
        .showAtmosphere(true)
        .atmosphereColor('#00e0ff')
        .atmosphereAltitude(0.18)
        .pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

      // Apply initial layer
      applyLayer(globe, currentLayer);

      // Pins via custom 3D objects
      if (pins.length > 0) {
        globe
          .customLayerData(pins)
          .customThreeObject((d: any) => buildPinMesh(d))
          .customThreeObjectUpdate((obj: any, d: any) => {
            // Position on globe surface — Object3D position is set via globe.gl's lat/lng accessors
            if (!obj) return;
            // Position is managed by globe.gl's coordinate accessor — we set the position here
            Object.assign(obj.position, globe.getCoords(d.lat, d.lng, (d.altitude || 0.04)));
          })
          .onCustomLayerHover((p: any) => setHoveredPin(p as Pin))
          .onCustomLayerClick((p: any) => onPinClick?.(p));
      }

      // Aircraft via custom 3D objects (only if showAircraft)
      if (showAircraft && aircraft.length > 0) {
        globe
          .customLayerData([...pins, ...aircraft.map(a => ({ ...a, isAircraft: true }))])
          .customThreeObject((d: any) => {
            if (d.isAircraft) return buildAircraftMesh(d);
            return buildPinMesh(d);
          });
      }

      globeRef.current = globe;

      // Controls
      const controls = globe.controls();
      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
      controls.minDistance = 105; // very close zoom (~30 km altitude)
      controls.maxDistance = 500;

      // Camera-change listener — updates zoom label
      const updateLabel = () => {
        if (labelUpdateTimer.current) {
          window.clearTimeout(labelUpdateTimer.current);
        }
        labelUpdateTimer.current = window.setTimeout(() => {
          if (!globeRef.current) return;
          const pov = globeRef.current.pointOfView();
          const camera: CameraPosition = { lat: pov.lat, lng: pov.lng, altitude: pov.altitude };
          const labelInfo = resolveZoomLabel(camera);
          setCurrentLabel(labelInfo.full);
          setCurrentZoom(labelInfo.zoom);
          onLocationChange?.(labelInfo.full, pov.lat, pov.lng);
        }, 200);
      };

      controls.addEventListener('change', updateLabel);
      // Also update the current POV ref for flight tracking bounds
      const updatePov = () => {
        if (globeRef.current) {
          const pov = globeRef.current.pointOfView();
          currentPovRef.current = { lat: pov.lat, lng: pov.lng, altitude: pov.altitude };
        }
      };
      controls.addEventListener('change', updatePov);
      updateLabel();
      updatePov();

      // Pulse animation loop for pins
      const pulse = () => {
        if (!alive || !globeRef.current) return;
        const t = (Date.now() - pulseStart) / 1000;
        const pulseScale = 1 + Math.sin(t * 2) * 0.1;
        const scene = globeRef.current.scene();
        if (scene) {
          scene.traverse((obj: any) => {
            if (obj.userData?.pulse) {
              obj.scale.setScalar(pulseScale);
            }
          });
        }
        animationFrame = requestAnimationFrame(pulse);
      };
      pulse();

      // Initial focus
      if (initialFocus) {
        globe.pointOfView(
          { lat: initialFocus.lat, lng: initialFocus.lng, altitude: initialFocus.altitude ?? 1.5 },
          1500
        );
      }

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (container && globeRef.current) {
          globeRef.current.width(container.clientWidth).height(height);
        }
      });
      ro.observe(container);

      return () => {
        ro.disconnect();
        controls.removeEventListener('change', updateLabel);
        controls.removeEventListener('change', updatePov);
      };
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(animationFrame);
      if (mountRef.current) mountRef.current.innerHTML = '';
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, currentLayer.id, showAircraft, aircraftStyle]);

  // Flight tracking
  const getBounds = useCallback(() => {
    const pov = currentPovRef.current;
    return povToBounds(pov.lat, pov.lng, pov.altitude);
  }, []);

  const { aircraft: trackedAircraft, error: acError, isStale: acStale } = useFlightTracking({
    enabled: flightsEnabled,
    getBounds,
    intervalMs: 15000,
  });

  useEffect(() => {
    setFlightCount(trackedAircraft.length);
    setFlightError(acError);
    setFlightStale(acStale);

    // Update globe with combined pins + aircraft
    if (globeRef.current) {
      const aircraftAsPins = flightsEnabled
        ? trackedAircraft.map((a) => ({
            ...a,
            isAircraft: true,
            label: a.callsign || a.icao24,
          }))
        : [];
      globeRef.current.customLayerData([...pins, ...aircraftAsPins]);
    }
  }, [trackedAircraft, acError, acStale, flightsEnabled, pins]);

  // ============================================================
  // Layer switching
  // ============================================================

  function applyLayer(globe: any, layer: MapLayer) {
    if (layer.tileUrl) {
      // Use globe.gl's tile layer — wraps XYZ tile pyramid in 3D
      // Falls back to a textured sphere if tile layer not available
      try {
        globe.globeImageUrl(null).globeTileLayer({
          tileUrl: layer.tileUrl,
          tileSize: 256,
          maxZoom: 18,
          opacity: 1,
        });
      } catch {
        // globeTileLayer not available — fall back to NASA texture
        globe.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
      }
    } else if (layer.globeImageUrl) {
      try {
        globe.globeTileLayer(null);
      } catch {}
      globe
        .globeImageUrl(layer.globeImageUrl)
        .bumpImageUrl(layer.bumpImageUrl || null);
    }
  }

  const handleLayerSwitch = (layer: MapLayer) => {
    setCurrentLayer(layer);
    if (globeRef.current) {
      applyLayer(globeRef.current, layer);
    }
    // Persist to localStorage
    try {
      localStorage.setItem('overlapse:globe-layer', layer.id);
    } catch {}
    setShowLayerPanel(false);
  };

  // Restore last layer from localStorage on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('overlapse:globe-layer');
      if (savedId) {
        const saved = LAYERS.find((l) => l.id === savedId);
        if (saved) setCurrentLayer(saved);
      }
    } catch {}
  }, []);

  // ============================================================
  // Search (the "Search The World" pill)
  // ============================================================

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchCities(searchQuery, 8);
    setSearchResults(
      results.map((c, i) => ({
        id: `search-${i}`,
        lat: c.lat,
        lng: c.lng,
        label: c.name,
        timezone: c.tz,
        color: '#ff6a1a',
      }))
    );
  }, [searchQuery]);

  const handleSearchSelect = (pin: Pin) => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: pin.lat, lng: pin.lng, altitude: 1.3 }, 1200);
    }
    setShowSearch(false);
    setSearchQuery('');
    onPinClick?.(pin);
  };

  // ============================================================
  // Auto-rotate toggle
  // ============================================================

  const handleAutoRotateToggle = () => {
    const newVal = !autoRotateRef.current;
    autoRotateRef.current = newVal;
    onAutoRotateChange?.(newVal);
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={className} style={{ fontFamily: '"Fragment Mono", monospace' }}>
      {/* Top row — label + search + controls */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 px-1 uppercase tracking-widest gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="whitespace-nowrap">
            Zoomed in on: <span className="text-[#ff6a1a]">{currentLabel}</span>
          </span>
          {currentZoom !== 'World' && (
            <span className="text-zinc-500 hidden md:inline">• {currentZoom} level</span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            placeholder="⌕ Search The World"
            className="w-[180px] md:w-[220px] bg-white/[0.03] border border-white/[0.09] rounded-full px-3 py-[6px] text-[11px] text-zinc-300 placeholder-zinc-500 outline-none focus:border-[#00e0ff]/50"
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-[260px] bg-[#0a0d14]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSearchSelect(r)}
                  className="w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] transition-colors border-b border-white/[0.04] last:border-0"
                >
                  <div className="text-white font-medium">{r.label}</div>
                  <div className="text-zinc-500 text-[10px]">{r.timezone}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFlightsEnabled(!flightsEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all ${
              flightsEnabled
                ? 'bg-[#00e0ff]/20 text-[#00e0ff] border border-[#00e0ff]/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
            title="Toggle live flight tracking"
          >
            <Plane className={`w-3 h-3 ${flightsEnabled && flightCount > 0 ? 'animate-pulse' : ''}`} />
            <span className="hidden md:inline">{flightsEnabled ? (flightCount > 0 ? `${flightCount} ✈` : 'FLIGHTS') : 'OFF'}</span>
          </button>
          <button
            onClick={handleAutoRotateToggle}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all ${
              autoRotate
                ? 'bg-[#ff6a1a]/20 text-[#ff6a1a] border border-[#ff6a1a]/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
            aria-pressed={autoRotate}
            title="Toggle auto-rotate"
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">ROTATE</span>
          </button>
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-white transition-all"
            title="Switch map layer"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">LAYERS</span>
          </button>
        </div>
      </div>

      {/* Globe viewport */}
      <div
        ref={mountRef}
        className="relative rounded-[28px] overflow-hidden border border-white/[0.07] bg-[#06070b] shadow-[0_0_80px_rgba(0,224,255,0.04),inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ height, width: '100%' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '72px 56px',
          }}
        />

        {/* Layer panel */}
        {showLayerPanel && (
          <div className="absolute top-3 right-3 z-20 w-72 bg-[#0a0d14]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#ff6a1a] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Map Layers
              </h3>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="text-zinc-500 hover:text-white text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 mb-2 px-1">⭐ = recommended</div>
            <div className="space-y-1 max-h-[360px] overflow-y-auto">
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => handleLayerSwitch(layer)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                    currentLayer.id === layer.id
                      ? 'bg-[#ff6a1a]/15 border-[#ff6a1a]/40 text-white'
                      : 'border-white/[0.06] text-zinc-300 hover:bg-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#00e0ff]">{layer.icon}</span>
                    <span className="text-xs font-medium flex-1">{layer.name}</span>
                    {layer.recommended && <span className="text-[#ff6a1a]">⭐</span>}
                    {currentLayer.id === layer.id && <span className="text-[#ff6a1a]">●</span>}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">{layer.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pin hover card */}
        {hoveredPin && (
          <div className="absolute left-4 top-4 z-10 text-[11px] bg-black/80 backdrop-blur-md border border-[#00e0ff]/30 rounded-xl px-3 py-2 text-zinc-200 shadow-xl max-w-[260px]">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: hoveredPin.color || '#ff6a1a' }}
              />
              <div className="text-[#ff6a1a] font-bold">{hoveredPin.label}</div>
              {hoveredPin.timezone && (
                <span className="text-[9px] text-zinc-500 ml-auto">{hoveredPin.timezone}</span>
              )}
            </div>
            <div className="text-zinc-400 mt-1 text-[10px]">
              {hoveredPin.lat.toFixed(3)}, {hoveredPin.lng.toFixed(3)}
            </div>
            {hoveredPin.timezone && (
              <div className="text-[10px] text-zinc-500 mt-1">
                Local: {new Intl.DateTimeFormat('en-US', {
                  timeZone: hoveredPin.timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }).format(new Date())}
                {isGoldenHour(hoveredPin.lat, hoveredPin.lng) && (
                  <span className="text-[#ffd166] ml-2">★ Golden hour</span>
                )}
              </div>
            )}
            <div className="text-[9px] text-zinc-500 mt-1">Click to focus</div>
          </div>
        )}

        {/* Aircraft hover card */}
        {hoveredAircraft && (
          <div className="absolute left-4 top-4 z-10 text-[11px] bg-black/80 backdrop-blur-md border border-[#ff6a1a]/30 rounded-xl px-3 py-2 text-zinc-200 shadow-xl">
            <div className="text-[#ff6a1a] font-bold">✈ {hoveredAircraft.callsign || hoveredAircraft.icao24}</div>
            <div className="text-zinc-400 mt-1">{hoveredAircraft.origin_country}</div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Alt: {(hoveredAircraft.altitude).toFixed(0)} m • Vel: {(hoveredAircraft.velocity * 3.6).toFixed(0)} km/h
            </div>
            <div className="text-[10px] text-zinc-500">Heading: {hoveredAircraft.heading.toFixed(0)}°</div>
          </div>
        )}

        {/* Bottom-right attribution */}
        <div className="absolute right-3 bottom-3 text-[9px] text-zinc-500 tracking-wider pointer-events-none">
          GLOBE.GL • {currentLayer.name.toUpperCase()} • OPENSKY
        </div>

        {/* Loading state */}
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs pointer-events-none opacity-50" id="globe-loading">
          Initializing globe…
        </div>
      </div>
    </div>
  );
}

export default WorldGlobe;
