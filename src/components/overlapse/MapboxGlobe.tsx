'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';

type Pin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  size?: number;
  altitude?: number;
};

type MapLayer = {
  id: string;
  name: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'raster' | 'hillshade' | 'background';
  source: string;
  'source-layer'?: string;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
};

interface MapboxGlobeProps {
  pins?: Pin[];
  focus?: { lat: number; lng: number; label?: string; zoom?: number };
  height?: number;
  className?: string;
  onPinClick?: (pin: Pin) => void;
  autoRotate?: boolean;
  onAutoRotateChange?: (enabled: boolean) => void;
  onLocationChange?: (location: { lat: number; lng: number; zoom: number; label: string }) => void;
}

const DEFAULT_CENTER: [number, number] = [-58.396, -34.6118];
const DEFAULT_ZOOM = 2;

const MAP_LAYERS: MapLayer[] = [
  {
    id: 'background',
    name: 'Background',
    type: 'background',
    source: '',
    paint: { 'background-color': '#06070b' },
  },
  {
    id: 'hillshade',
    name: 'Terrain (Hillshade)',
    type: 'hillshade',
    source: 'mapbox-dem',
    layout: { visibility: 'visible' },
    paint: { 'hillshade-exaggeration': 0.5, 'hillshade-shadow-color': '#000000' },
  },
  {
    id: 'satellite',
    name: 'Satellite',
    type: 'raster',
    source: 'mapbox-satellite',
    paint: { 'raster-opacity': 1 },
    layout: { visibility: 'none' },
  },
  {
    id: 'streets',
    name: 'Streets',
    type: 'line',
    source: 'mapbox-streets',
    'source-layer': 'road',
    paint: { 'line-color': '#00e0ff', 'line-width': 1, 'line-opacity': 0.6 },
    layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
  },
  {
    id: 'water',
    name: 'Water',
    type: 'fill',
    source: 'mapbox-streets',
    'source-layer': 'water',
    paint: { 'fill-color': '#003d5c', 'fill-opacity': 0.8 },
    layout: { visibility: 'visible' },
  },
  {
    id: 'landuse',
    name: 'Land Use',
    type: 'fill',
    source: 'mapbox-streets',
    'source-layer': 'landuse',
    paint: { 'fill-color': '#0a1a2a', 'fill-opacity': 0.5 },
    layout: { visibility: 'visible' },
  },
  {
    id: 'country-boundaries',
    name: 'Country Boundaries',
    type: 'line',
    source: 'mapbox-streets',
    'source-layer': 'admin',
    paint: { 'line-color': '#00e0ff', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [4, 4] },
    layout: { visibility: 'visible', 'line-cap': 'round', 'line-join': 'round' },
    filter: ['==', 'admin_level', 0],
  },
  {
    id: 'state-boundaries',
    name: 'State/Province Boundaries',
    type: 'line',
    source: 'mapbox-streets',
    'source-layer': 'admin',
    paint: { 'line-color': '#00e0ff', 'line-width': 1, 'line-opacity': 0.2, 'line-dasharray': [2, 4] },
    layout: { visibility: 'visible', 'line-cap': 'round', 'line-join': 'round' },
    filter: ['==', 'admin_level', 1],
  },
  {
    id: 'place-labels',
    name: 'Place Labels',
    type: 'symbol',
    source: 'mapbox-streets',
    'source-layer': 'place_label',
    layout: {
      visibility: 'visible',
      'text-field': ['get', 'name'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        2, 10,
        5, 12,
        10, 16,
        15, 20,
      ],
      'text-color': '#ffffff',
      'text-halo-color': '#06070b',
      'text-halo-width': 2,
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        2, 0.3,
        4, 0.6,
        8, 1,
      ],
    },
  },
  {
    id: 'poi-labels',
    name: 'POI Labels',
    type: 'symbol',
    source: 'mapbox-streets',
    'source-layer': 'poi_label',
    layout: {
      visibility: 'visible',
      'text-field': ['get', 'name'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 10,
        14, 12,
        18, 14,
      ],
      'text-color': '#ffffff',
      'text-halo-color': '#06070b',
      'text-halo-width': 1.5,
      'text-anchor': 'center',
      'icon-image': ['get', 'maki'],
      'icon-size': 0.8,
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
    },
    paint: {
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0,
        12, 0.5,
        15, 1,
      ],
      'icon-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0,
        12, 0.5,
        15, 1,
      ],
    },
  },
];

export function MapboxGlobe({
  pins = [],
  focus,
  height = 520,
  className,
  onPinClick,
  autoRotate = false,
  onAutoRotateChange,
  onLocationChange,
}: MapboxGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const animationFrameRef = useRef<number | null>(null);
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; zoom: number; label: string }>({
    lat: DEFAULT_CENTER[1],
    lng: DEFAULT_CENTER[0],
    zoom: DEFAULT_ZOOM,
    label: 'World',
  });
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set([
    'background', 'hillshade', 'water', 'landuse', 'country-boundaries', 'state-boundaries', 'place-labels',
  ]));
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [flights, setFlights] = useState(0);

  // Update autoRotate ref when prop changes
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken || mapboxToken === 'your-mapbox-token-here') {
      console.warn('Mapbox token not configured. Using fallback.');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'mapbox-dem': {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14,
          },
          'mapbox-satellite': {
            type: 'raster',
            url: 'mapbox://mapbox.satellite',
            tileSize: 256,
            maxzoom: 19,
          },
          'mapbox-streets': {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8',
          },
        },
        layers: MAP_LAYERS as any,
      },
      center: focus ? [focus.lng, focus.lat] : DEFAULT_CENTER,
      zoom: focus?.zoom ?? DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

    // Add scale control
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');

    // Handle map load
    map.on('load', () => {
      // Add pins as GeoJSON source
      if (pins.length > 0) {
        const pinFeatures = pins.map(pin => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [pin.lng, pin.lat],
          },
          properties: {
            id: pin.id,
            label: pin.label,
            color: pin.color || '#ff6a1a',
            size: pin.size || 1,
            altitude: pin.altitude || 0,
          },
        }));

        map.addSource('pins', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pinFeatures,
          },
        });

        // Add pin circles
        map.addLayer({
          id: 'pin-circles',
          type: 'circle',
          source: 'pins',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 4,
              10, 8,
              18, 16,
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });

        // Add pin labels
        map.addLayer({
          id: 'pin-labels',
          type: 'symbol',
          source: 'pins',
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-color': '#ffffff',
            'text-halo-color': '#06070b',
            'text-halo-width': 2,
            'text-anchor': 'top',
            'text-offset': [0, 1.2],
            'text-allow-overlap': true,
          },
          paint: {
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 0,
              4, 0.5,
              8, 1,
            ],
          },
        });

        // Add 3D pin extrusion (using fill-extrusion for 3D effect)
        map.addLayer({
          id: 'pin-3d',
          type: 'circle',
          source: 'pins',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2, 3,
              10, 6,
              18, 12,
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.7,
            'circle-translate': [0, -2],
          },
        });
      }

      // Focus on provided location
      if (focus) {
        map.flyTo({
          center: [focus.lng, focus.lat],
          zoom: focus.zoom ?? 4,
          duration: 1600,
          essential: true,
        });
      }

      // Initial location update
      updateLocationInfo(map);
    });

    // Handle map move/zoom events
    const handleMove = () => {
      if (mapRef.current) {
        updateLocationInfo(mapRef.current);
      }
    };

    map.on('move', handleMove);
    map.on('zoom', handleMove);
    map.on('rotate', handleMove);

    // Handle pin hover
    map.on('mousemove', 'pin-circles', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const pin: Pin = {
          id: feature.properties.id,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          label: feature.properties.label,
          color: feature.properties.color,
          size: feature.properties.size,
        };
        setHoveredPin(pin);
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.on('mouseleave', 'pin-circles', () => {
      setHoveredPin(null);
      map.getCanvas().style.cursor = '';
    });

    // Handle pin click
    map.on('click', 'pin-circles', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const pin: Pin = {
          id: feature.properties.id,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          label: feature.properties.label,
          color: feature.properties.color,
          size: feature.properties.size,
        };
        onPinClick?.(pin);
      }
    });

    // Start auto-rotate animation
    const startAutoRotate = () => {
      if (!mapRef.current) return;
      const animate = () => {
        if (!autoRotateRef.current || !mapRef.current) return;
        mapRef.current.rotateTo(mapRef.current.getBearing() + 0.05, { duration: 0 });
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    };

    if (autoRotate) {
      startAutoRotate();
    }

    // Fetch flights from OpenSky
    const fetchFlights = async () => {
      try {
        const bounds = map.getBounds();
        if (!bounds) return;
        const lamin = bounds.getSouth() - 2;
        const lamax = bounds.getNorth() + 2;
        const lomin = bounds.getWest() - 2;
        const lomax = bounds.getEast() + 2;
        const res = await fetch(
          `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`,
          { cache: 'no-store' }
        ).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setFlights(data?.states?.length ?? 0);
        }
      } catch (err) {
        console.debug('Flight fetch failed:', err);
      }
    };

    // Poll flights every 30 seconds
    const flightInterval = setInterval(fetchFlights, 30000);
    fetchFlights();

    // Cleanup
    return () => {
      clearInterval(flightInterval);
      map.off('move', handleMove);
      map.off('zoom', handleMove);
      map.off('rotate', handleMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [height, pins, focus, autoRotate, onPinClick]);

  // Update location info based on map center and zoom
  const updateLocationInfo = useCallback((map: mapboxgl.Map) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // Determine label based on zoom level
    let label = 'World';
    if (zoom >= 12) {
      label = 'Street Level';
    } else if (zoom >= 8) {
      label = 'City';
    } else if (zoom >= 5) {
      label = 'Region';
    } else if (zoom >= 3) {
      label = 'Country';
    }

    const location = {
      lat: center.lat,
      lng: center.lng,
      zoom,
      label,
    };

    setCurrentLocation(location);
    onLocationChange?.(location);
  }, [onLocationChange]);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    if (!mapRef.current) return;
    const newActiveLayers = new Set(activeLayers);
    if (newActiveLayers.has(layerId)) {
      newActiveLayers.delete(layerId);
      mapRef.current.setLayoutProperty(layerId, 'visibility', 'none');
    } else {
      newActiveLayers.add(layerId);
      mapRef.current.setLayoutProperty(layerId, 'visibility', 'visible');
    }
    setActiveLayers(newActiveLayers);
  };

  // Toggle auto-rotate
  const handleAutoRotateToggle = () => {
    const newValue = !autoRotateRef.current;
    autoRotateRef.current = newValue;
    onAutoRotateChange?.(newValue);
    if (newValue && mapRef.current) {
      const animate = () => {
        if (!autoRotateRef.current || !mapRef.current) return;
        mapRef.current.rotateTo(mapRef.current.getBearing() + 0.05, { duration: 0 });
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Fly to location
  const flyToLocation = (lat: number, lng: number, zoom: number) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      duration: 1500,
      essential: true,
    });
  };

  // Render layer panel
  const renderLayerPanel = () => (
    <div className="absolute top-12 right-4 z-20 w-64 bg-[#0a0d14]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#ff6a1a] uppercase tracking-wider">Map Layers</h3>
        <button
          onClick={() => setShowLayerPanel(false)}
          className="text-zinc-500 hover:text-white text-xl leading-none"
          aria-label="Close layer panel"
        >
          ×
        </button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {MAP_LAYERS.filter(l => l.id !== 'background').map((layer) => (
          <label key={layer.id} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={activeLayers.has(layer.id)}
              onChange={() => toggleLayer(layer.id)}
              className="w-4 h-4 accent-[#00e0ff] rounded border-zinc-700 bg-zinc-900"
            />
            <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">
              {layer.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  if (!mapContainerRef.current && !mapRef.current) {
    // Show loading state
    return (
      <div className={className} style={{ fontFamily: '"Fragment Mono", monospace' }}>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 px-1 uppercase tracking-widest">
          <span>Zoomed in on: <span className="text-[#ff6a1a]">{currentLocation.label}</span></span>
          <span className="text-zinc-500">Loading map...</span>
        </div>
        <div
          ref={mapContainerRef}
          className="relative rounded-[28px] overflow-hidden border border-white/[0.07] bg-[#06070b] shadow-[0_0_80px_rgba(0,224,255,0.04),inset_0_1px_0_rgba(255,255,255,0.04)]"
          style={{ height, width: '100%' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            Initializing Mapbox...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ fontFamily: '"Fragment Mono", monospace' }}>
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2 px-1 uppercase tracking-widest">
        <span>
          Zoomed in on: <span className="text-[#ff6a1a]">{currentLocation.label}</span>
          {currentLocation.label !== 'World' && (
            <>
              {' '}({currentLocation.lat.toFixed(2)}, {currentLocation.lng.toFixed(2)}) • Z{currentLocation.zoom.toFixed(1)}
            </>
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">LIVE • {flights ? `${flights} tracks` : 'OpenSky polling'}</span>
          <button
            onClick={handleAutoRotateToggle}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all ${
              autoRotateRef.current
                ? 'bg-[#ff6a1a]/20 text-[#ff6a1a] border border-[#ff6a1a]/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
            aria-pressed={autoRotateRef.current}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              autoRotateRef.current ? 'bg-[#ff6a1a] animate-pulse' : 'bg-zinc-600'
            }`} />
            AUTO-ROTATE
          </button>
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-white transition-all"
          >
            LAYERS
          </button>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        className="relative rounded-[28px] overflow-hidden border border-white/[0.07] bg-[#06070b] shadow-[0_0_80px_rgba(0,224,255,0.04),inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ height, width: '100%' }}
      >
        {showLayerPanel && renderLayerPanel()}
        {hoveredPin && (
          <div className="absolute left-4 top-4 z-10 text-[11px] bg-black/80 backdrop-blur-md border border-[#00e0ff]/30 rounded-xl px-3 py-2 text-zinc-200 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPin.color }} />
              <div className="text-[#ff6a1a] font-bold">{hoveredPin.label}</div>
            </div>
            <div className="text-zinc-400 mt-1">{hoveredPin.lat.toFixed(4)}, {hoveredPin.lng.toFixed(4)}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Click to focus</div>
          </div>
        )}
        <div className="absolute right-3 bottom-3 text-[9px] text-zinc-500 tracking-wider">
          MAPBOX GL • TERRAIN-RGB • OPENSKY NETWORK
        </div>
      </div>
    </div>
  );
}

export default MapboxGlobe;