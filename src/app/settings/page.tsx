'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth';
import { Clock, Map, Bell, User, Save, Check, AlertCircle, Globe, Plane } from 'lucide-react';
import { WorldClock } from '@/components/overlapse/world-clock';
import { PushNotificationManager } from '@/components/overlapse/push-notification-manager';
import { getAllCities } from '@/lib/overlapse/zoom-label';

type Tab = 'profile' | 'world-clock' | 'map' | 'notifications' | 'danger';

export default function SettingsPage() {
  const { user, profile, updateProfile, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [showWorldClock, setShowWorldClock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local form state
  const [displayName, setDisplayName] = useState('');
  const [homeTimezone, setHomeTimezone] = useState('');
  const [showWorldClockWidget, setShowWorldClockWidget] = useState(true);
  const [defaultGlobeLayer, setDefaultGlobeLayer] = useState('nasa-black-marble');
  const [aircraftStyle, setAircraftStyle] = useState<'svg' | '3d'>('svg');
  const [searchProvider, setSearchProvider] = useState<'cities' | 'esri'>('cities');
  const [enableFlightOverlay, setEnableFlightOverlay] = useState(true);
  const [enableAutoRotate, setEnableAutoRotate] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Load profile into form state
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHomeTimezone(profile.home_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    // Restore UI prefs from localStorage
    try {
      setShowWorldClockWidget(localStorage.getItem('overlapse:show-world-clock') !== 'false');
      setDefaultGlobeLayer(localStorage.getItem('overlapse:globe-layer') || 'nasa-black-marble');
      setAircraftStyle((localStorage.getItem('overlapse:aircraft-style') as 'svg' | '3d') || 'svg');
      setSearchProvider((localStorage.getItem('overlapse:search-provider') as 'cities' | 'esri') || 'cities');
      setEnableFlightOverlay(localStorage.getItem('overlapse:flights') !== 'false');
      setEnableAutoRotate(localStorage.getItem('overlapse:auto-rotate') === 'true');
      setPushNotifications(localStorage.getItem('overlapse:push-notifications') === 'true');
    } catch {}
  }, [profile]);

  const allCities = getAllCities();
  const timezones = Array.from(new Set(allCities.map((c) => c.tz))).sort();

  const saveProfile = async () => {
    setSaving(true);
    setError(null);

    if (user) {
      const { error } = await updateProfile({
        display_name: displayName,
        home_timezone: homeTimezone,
      });
      if (error) {
        setError(error);
        setSaving(false);
        return;
      }
    }

    // Persist UI prefs to localStorage
    try {
      localStorage.setItem('overlapse:show-world-clock', String(showWorldClockWidget));
      localStorage.setItem('overlapse:aircraft-style', aircraftStyle);
      localStorage.setItem('overlapse:search-provider', searchProvider);
      localStorage.setItem('overlapse:flights', String(enableFlightOverlay));
      localStorage.setItem('overlapse:auto-rotate', String(enableAutoRotate));
      localStorage.setItem('overlapse:push-notifications', String(pushNotifications));
    } catch {}

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-300" style={{ fontFamily: '"Fragment Mono", monospace' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl text-white">Overlapse <span className="text-[#00e0ff]">Settings</span></h1>
            <p className="text-[11px] text-zinc-500 mt-1">Manage your profile, globe, and notifications</p>
          </div>
          <Link href="/dashboard" className="text-[11px] text-[#ff6a1a] hover:underline">→ Mission Control</Link>
        </div>

        {!user && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>You&apos;re not signed in. Sign in to sync settings across devices. Local settings still work.</span>
            <Link href="/auth/sign-in" className="ml-auto underline hover:text-yellow-300">Sign in</Link>
          </div>
        )}

        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          {/* Tab nav */}
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'world-clock', label: 'World Clock', icon: Clock },
              { id: 'map', label: 'Map & Globe', icon: Map },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'danger', label: 'Account', icon: AlertCircle },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] transition-colors ${
                    tab === t.id
                      ? 'bg-[#ff6a1a]/15 text-[#ff6a1a] border border-[#ff6a1a]/30'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Tab content */}
          <div className="bg-white/[0.015] border border-white/[0.08] rounded-2xl p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            {tab === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-[14px] text-white mb-3">Profile</h2>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'not signed in'}
                    className="w-full mt-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Home timezone</label>
                  <select
                    value={homeTimezone}
                    onChange={(e) => setHomeTimezone(e.target.value)}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                {profile?.is_premium && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-yellow-400 text-[11px] flex items-center gap-2">
                      <span>★ Premium</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Data retention: indefinite (90-day auto-delete bypassed)</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'world-clock' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] text-white">World Clock</h2>
                  <button
                    onClick={() => setShowWorldClock(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff6a1a]/15 border border-[#ff6a1a]/30 text-[#ff6a1a] text-[11px] uppercase tracking-wider hover:bg-[#ff6a1a]/25"
                  >
                    <Clock className="w-3.5 h-3.5" /> Open World Clock
                  </button>
                </div>
                <label className="flex items-center justify-between p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30">
                  <div>
                    <div className="text-[12px] text-zinc-200">Show world clock widget on dashboard</div>
                    <div className="text-[10px] text-zinc-500">When enabled, a small clock strip appears below the globe</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWorldClockWidget}
                    onChange={(e) => setShowWorldClockWidget(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6a1a] rounded"
                  />
                </label>
                <div className="text-[11px] text-zinc-500 leading-relaxed">
                  Time data is computed locally using your browser&apos;s IANA timezone database (via Intl.DateTimeFormat + Luxon).
                  No external API calls — works offline, no rate limits.
                </div>
              </div>
            )}

            {tab === 'map' && (
              <div className="space-y-5">
                <h2 className="text-[14px] text-white mb-3">Map & Globe</h2>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Default map layer</label>
                  <select
                    value={defaultGlobeLayer}
                    onChange={(e) => setDefaultGlobeLayer(e.target.value)}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  >
                    <option value="nasa-black-marble">⭐ NASA Black Marble (default)</option>
                    <option value="esri-satellite">⭐ Esri Satellite (zoomable)</option>
                    <option value="nasa-blue-marble">NASA Blue Marble</option>
                    <option value="osm">OpenStreetMap</option>
                    <option value="opentopomap">OpenTopoMap</option>
                    <option value="esri-street">Esri Streets</option>
                    <option value="esri-topo">Esri Topographic</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 mt-1">All layers are free. No API keys, no credit card.</p>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Aircraft pin style</label>
                  <select
                    value={aircraftStyle}
                    onChange={(e) => setAircraftStyle(e.target.value as 'svg' | '3d')}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  >
                    <option value="svg">SVG plane icon (recommended — supports 100+ planes)</option>
                    <option value="3d">3D aircraft model (cooler but caps at ~20 planes)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Search provider</label>
                  <select
                    value={searchProvider}
                    onChange={(e) => setSearchProvider(e.target.value as 'cities' | 'esri')}
                    className="w-full mt-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  >
                    <option value="cities">Bundled cities.json (offline, ~500 cities, no API)</option>
                    <option value="esri">Esri geocoding (online, more accurate, free)</option>
                  </select>
                </div>
                <label className="flex items-center justify-between p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30">
                  <div>
                    <div className="text-[12px] text-zinc-200">Show live flight overlay</div>
                    <div className="text-[10px] text-zinc-500">OpenSky Network — 4,000 req/day free</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableFlightOverlay}
                    onChange={(e) => setEnableFlightOverlay(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6a1a]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30">
                  <div>
                    <div className="text-[12px] text-zinc-200">Auto-rotate globe by default</div>
                    <div className="text-[10px] text-zinc-500">Slow rotation — toggle anytime from the dashboard</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAutoRotate}
                    onChange={(e) => setEnableAutoRotate(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6a1a]"
                  />
                </label>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="space-y-5">
                <h2 className="text-[14px] text-white mb-3">Notifications</h2>
                <PushNotificationManager variant="settings" />
                <div className="p-3 bg-black/20 rounded-lg border border-white/[0.05]">
                  <div className="text-[12px] text-zinc-200 mb-1">Email notifications — coming in v2</div>
                  <div className="text-[10px] text-zinc-500">Resend is integrated but requires a verified domain to send to other users. Defer to v2.</div>
                </div>
                <div className="text-[11px] text-zinc-500">
                  In-app toasts are always on — they appear when suggestions, errors, or system events occur.
                </div>
              </div>
            )}

            {tab === 'danger' && (
              <div className="space-y-5">
                <h2 className="text-[14px] text-white mb-3">Account</h2>
                {user ? (
                  <>
                    <div className="p-3 bg-black/20 rounded-lg">
                      <div className="text-[12px] text-zinc-200">Account ID</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1 break-all">{user.id}</div>
                    </div>
                    <div className="p-3 bg-black/20 rounded-lg">
                      <div className="text-[12px] text-zinc-200">Member since</div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {new Date(user.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={async () => { await signOut(); window.location.href = '/'; }}
                      className="w-full px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[12px] uppercase tracking-wider hover:bg-red-500/20"
                    >
                      Sign out
                    </button>
                    <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-lg">
                      <div className="text-[11px] text-red-400 mb-2">Danger zone</div>
                      <div className="text-[10px] text-zinc-500 mb-3">
                        Delete your account and all associated data. This cannot be undone.
                        (Requires Supabase dashboard action — not yet implemented in v1.)
                      </div>
                      <button
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] uppercase tracking-wider opacity-50 cursor-not-allowed"
                      >
                        Delete account (coming soon)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                    <p className="text-[12px] text-zinc-400 mb-4">Not signed in</p>
                    <Link
                      href="/auth/sign-in"
                      className="inline-block px-4 py-2 rounded-lg bg-[#ff6a1a] text-black text-[11px] uppercase tracking-wider hover:bg-[#ff7f3a]"
                    >
                      Sign in
                    </Link>
                  </div>
                )}
              </div>
            )}

            {tab !== 'danger' && (
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff6a1a] text-black text-[11px] uppercase tracking-wider font-bold hover:bg-[#ff7f3a] disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {saved && (
                  <span className="text-[11px] text-green-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <WorldClock isOpen={showWorldClock} onClose={() => setShowWorldClock(false)} />
    </div>
  );
}
