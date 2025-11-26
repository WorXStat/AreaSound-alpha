
import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Ghost, Bot, Star, Sun, Moon } from "lucide-react";

// Define SVGs for icons directly as strings
const landmarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="24" viewBox="0 0 16 24" fill="none">
  <rect x="2" y="2" width="12" height="20" rx="1" stroke="white" stroke-width="2" fill="rgba(16, 185, 129, 0.3)"/>
  <line x1="4" y1="7" x2="12" y2="7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="11" x2="12" y2="11" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="4" y1="15" x2="12" y2="15" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const iconSvgMap = {
    User: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    Zap: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    Music2: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="18" r="4"/><path d="M12 18V2l4-1v11.5"/><circle cx="20" cy="16" r="4"/><path d="M8 14s1.5-2 4-2 4 2 4 2"/></svg>`,
    Ghost: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 21l3 3V10a8 8 0 0 0-8-8z"/></svg>`,
    Bot: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    Star: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    Sun: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    Moon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
};

const createIconSvg = (iconName) => {
    return iconSvgMap[iconName] || iconSvgMap.User;
}

// Function to create HTML for markers without using react-dom/server
const createIconHtml = (color, svg, isPulsing = false, glowColor = '#f472b6') => {
    const pulseHtml = isPulsing ? `<style>@keyframes custom-ping { 75%, 100% { transform: scale(1.8); opacity: 0; } }</style><span style="animation: custom-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 9999px; background-color: ${glowColor}; opacity: 0.75;"></span>` : "";
    const markerHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${pulseHtml}
        <div style="position: relative; width: 32px; height: 32px; border-radius: 9999px; border: 2px solid white; display: flex; align-items: center; justify-content: center; background-color: ${color}; box-shadow: 0 0 8px ${color};">
          ${svg}
        </div>
      </div>
    `;
    return L.divIcon({
      html: markerHtml,
      className: "", // Use empty class to avoid default Leaflet styles
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
};

const MapEvents = ({ onMapClick, onMapMove, isPlacingPin }) => {
  useMapEvents({
    click: onMapClick,
    move: (e) => {
        if(isPlacingPin) {
            document.body.style.cursor = 'crosshair';
        }
        if(onMapMove) {
            onMapMove(e.target.getCenter());
        }
    },
    moveend: (e) => {
        if(onMapMove) {
            onMapMove(e.target.getCenter());
        }
    },
    zoom: (e) => {
        if(isPlacingPin) {
            document.body.style.cursor = 'crosshair';
        }
    }
  });

  useEffect(() => {
      if(isPlacingPin) {
          document.body.style.cursor = 'crosshair';
      } else {
          document.body.style.cursor = 'default';
      }
      return () => {
          document.body.style.cursor = 'default';
      }
  }, [isPlacingPin]);

  return null;
};

export default function UsersMap({ 
  currentUser, 
  nearbyUsers, 
  vibeMatches, 
  usersData, 
  landmarks, 
  mapRef, 
  onMapClick, 
  isPlacingPin, 
  onMapMove,
  showUsersLayer = true,
  showLandmarksLayer = true
}) {
  const navigate = useNavigate();

  // Memoize icons to avoid recreating them on every render
  const landmarkIcon = useMemo(() => createIconHtml("#10b981", landmarkSvg, true, '#10b981'), []);
  
  const getIconForUser = (user, isMatch) => {
      const iconName = user.map_icon || 'User';
      const color = user.map_icon_color || '#3B82F6'; // Default color for self, other default for others
      const isListening = user.is_listening;
      const svg = createIconSvg(iconName);

      // If it's the current user, use a specific default color if no custom color is set
      const effectiveColor = user.id === currentUser.id ? (user.map_icon_color || '#3B82F6') : (user.map_icon_color || '#8B5CF6');

      if (isMatch) {
          // Vibe match overrides user's color with a specific vibe match color
          return createIconHtml('#F59E0B', svg, isListening, '#F59E0B');
      }
      return createIconHtml(effectiveColor, svg, isListening, effectiveColor);
  };
  
  const center = useMemo(() => [currentUser.latitude, currentUser.longitude], [currentUser.latitude, currentUser.longitude]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, 13);
    }
  }, [center, mapRef]);

  const filteredNearbyUsers = showUsersLayer ? nearbyUsers : [];
  const filteredLandmarks = showLandmarksLayer ? landmarks : [];

  // Always show current user when landmarks layer is on (even if users layer is off)
  const showCurrentUser = showUsersLayer || showLandmarksLayer;

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full" ref={mapRef}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapEvents onMapClick={onMapClick} isPlacingPin={isPlacingPin} onMapMove={onMapMove} />

      {showCurrentUser && (
        <Marker position={center} icon={getIconForUser(currentUser, false)}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">You are here</p>
              {usersData[currentUser.id]?.song && currentUser.is_listening ? (
                <p>Listening to: {usersData[currentUser.id].song.title}</p>
              ) : (
                 <p>Not listening right now.</p>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {filteredNearbyUsers.map(user => {
        const isMatch = vibeMatches.includes(user.id);
        const icon = getIconForUser(user, isMatch);

        return (
          <Marker key={user.id} position={[user.latitude, user.longitude]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{user.full_name || 'Anonymous'}</p>
                {isMatch && <p className="text-yellow-400 font-semibold">Vibe Match!</p>}
                {usersData[user.id]?.song && user.is_listening ? (
                  <p>Listening to: {usersData[user.id].song.title}</p>
                ) : (
                  <p>Not listening right now.</p>
                )}
                {user.is_public_profile !== false && (
                  <>
                    <p className="text-xs text-white/60 mt-2">Total Likes: {user.total_likes_received || 0}</p>
                    <button 
                        onClick={() => navigate(createPageUrl(`UserPlaylists?email=${user.email}`))}
                        className="mt-2 w-full text-center bg-sky-500/50 p-1 rounded-lg hover:bg-sky-500/80 transition-colors text-xs"
                    >
                        View Playlists
                    </button>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {filteredLandmarks.map(landmark => (
        <Marker key={landmark.id} position={[landmark.latitude, landmark.longitude]} icon={landmarkIcon}>
            <Popup>
                <div className="text-sm">
                    <p className="font-bold text-emerald-400">{landmark.name}</p>
                    {landmark.description && <p className="mt-1">{landmark.description}</p>}
                    {landmark.is_public !== false ? (
                      <div className="text-xs text-emerald-400/70 mt-2 space-y-1">
                        <p>📍 Public Landmark</p>
                        <p className="font-mono">
                          {landmark.latitude.toFixed(6)}, {landmark.longitude.toFixed(6)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-yellow-400 mt-2">🔒 Private Landmark</p>
                    )}
                    <button 
                        onClick={() => navigate(createPageUrl(`LandmarkDetail?id=${landmark.id}`))}
                        className="mt-2 w-full text-center bg-emerald-500/50 p-1 rounded-lg hover:bg-emerald-500/80 transition-colors"
                    >
                        View BGM
                    </button>
                </div>
            </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}