import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Disc3, ListMusic, User, Waves } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Discover", path: "Discover", icon: Waves },
    { name: "Playlists", path: "MyPlaylists", icon: ListMusic },
    { name: "Profile", path: "Profile", icon: User },
  ];

  const isActive = (pageName) => {
    const pageUrl = createPageUrl(pageName);
    if (pageName === 'Discover' && location.pathname.includes('LandmarkDetail')) {
      return true;
    }
    return location.pathname === pageUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <style>{`
        :root {
          --accent: #34d399; /* emerald-400 */
          --accent-hover: #10b981; /* emerald-500 */
          --secondary-accent: #22d3ee; /* cyan-400 */
        }
        .cyber-border {
          border-image-slice: 1;
          border-image-source: linear-gradient(to right, var(--secondary-accent), var(--accent));
        }
        .leaflet-container { background-color: #111; }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out { background: rgba(0,0,0,0.5) !important; color: var(--accent) !important; border: 1px solid var(--accent) !important; border-radius: 0 !important; }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip { background-color: rgba(10, 10, 10, 0.8) !important; backdrop-filter: blur(8px); color: white !important; border: 1px solid var(--accent) !important; border-radius: 0 !important; box-shadow: 0 0 15px var(--accent); }
      `}</style>
      
      <div className="md:flex">
        {/* Sidebar Navigation - Desktop */}
        <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-black border-r-2 border-transparent cyber-border p-6 z-40">
           <Link to={createPageUrl("Discover")} className="flex items-center gap-3 group mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform cyber-glow-sm">
                <Disc3 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">AreaSound</span>
            </Link>
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 transition-all border-l-4 ${
                    active
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-400"
                      : "text-white/70 hover:bg-white/5 hover:text-white border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="w-full pb-20 md:pb-0 md:ml-64">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t-2 border-transparent cyber-border md:hidden z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-all p-2 w-20 ${
                  active ? "text-emerald-400" : "text-white/60 hover:text-emerald-400"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? "drop-shadow-[0_0_5px_var(--accent)]" : ""}`} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}