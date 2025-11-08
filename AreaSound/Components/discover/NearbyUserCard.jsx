import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music2, MapPin, Zap, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NearbyUserCard({ user, playlist, song, distance, isVibeMatch }) {
  const navigate = useNavigate();

  const handleViewPlaylists = () => {
    navigate(createPageUrl(`UserPlaylists?email=${user.email}`));
  };

  return (
    <Card 
      className={`bg-white/10 backdrop-blur-md border hover:bg-white/15 transition-all duration-300 overflow-hidden group cursor-pointer ${
        isVibeMatch ? 'border-yellow-400/50' : 'border-white/20'
      }`}
      onClick={handleViewPlaylists}
    >
      {isVibeMatch && (
        <div className="bg-gradient-to-r from-yellow-400/30 to-amber-500/30 px-3 py-1 flex items-center gap-2 text-xs font-medium text-white">
          <Zap className="w-3 h-3 text-yellow-300" />
          Vibe Match
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{user.full_name}</h3>
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <MapPin className="w-3 h-3" />
                <span>{distance?.toFixed(1)} km away</span>
              </div>
              {user.total_likes_received > 0 && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{user.total_likes_received} likes</span>
                </div>
              )}
            </div>
          </div>
          {user.is_listening && (
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </div>

        {user.bio && (
          <p className="text-white/70 text-sm mb-4 line-clamp-2">{user.bio}</p>
        )}

        {user.favorite_genres && user.favorite_genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {user.favorite_genres.slice(0, 3).map((genre) => (
              <Badge
                key={genre}
                variant="secondary"
                className="bg-white/10 text-white/80 text-xs border-white/20"
              >
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {user.is_listening && song ? (
          <div className={`rounded-xl p-3 group-hover:bg-emerald-500/30 transition-colors ${
            isVibeMatch ? 'bg-yellow-400/20 border border-yellow-400/30' : 'bg-emerald-500/20 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Music2 className={`w-4 h-4 ${isVibeMatch ? 'text-yellow-400' : 'text-emerald-400'}`} />
              <span className={`text-xs font-medium ${isVibeMatch ? 'text-yellow-400' : 'text-emerald-400'}`}>Now Playing</span>
            </div>
            <p className="text-white font-medium text-sm">{song.title}</p>
            <p className="text-white/60 text-xs">{song.artist}</p>
            {playlist && (
              <p className="text-white/50 text-xs mt-1">from "{playlist.name}"</p>
            )}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/40 text-xs">Not listening right now</p>
          </div>
        )}
      </div>
    </Card>
  );
}