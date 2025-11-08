
import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Music, Zap } from "lucide-react";
import NearbyUserCard from "../discover/NearbyUserCard";

export default function NearbyUsersList({
  currentUser,
  nearbyUsers,
  vibeMatches,
  usersData,
  isRefreshing,
  onRefresh,
  calculateDistance
}) {

  const vibeMatchUsers = useMemo(() => {
    return nearbyUsers.filter(u => vibeMatches.includes(u.id));
  }, [nearbyUsers, vibeMatches]);
  
  const otherUsers = useMemo(() => {
    return nearbyUsers.filter(u => !vibeMatches.includes(u.id));
  }, [nearbyUsers, vibeMatches]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          People Nearby ({nearbyUsers.length})
        </h2>
        <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="bg-transparent border-white/50 text-white/80 hover:bg-white/10"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Refresh"
            )}
        </Button>
      </div>

      {vibeMatchUsers.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            Vibe Matches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vibeMatchUsers.map((user) => (
              <NearbyUserCard
                key={user.id}
                user={user}
                playlist={usersData[user.id]?.playlist}
                song={usersData[user.id]?.song}
                distance={calculateDistance(
                  currentUser?.latitude, currentUser?.longitude,
                  user.latitude, user.longitude
                )}
                isVibeMatch={true}
              />
            ))}
          </div>
        </section>
      )}

      {otherUsers.length > 0 ? (
        <section>
          <h3 className="text-lg font-bold text-white mb-4">
            Everyone Else
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherUsers.map((user) => (
              <NearbyUserCard
                key={user.id}
                user={user}
                playlist={usersData[user.id]?.playlist}
                song={usersData[user.id]?.song}
                distance={calculateDistance(
                  currentUser?.latitude, currentUser?.longitude,
                  user.latitude, user.longitude
                )}
                isVibeMatch={false}
              />
            ))}
          </div>
        </section>
      ) : vibeMatchUsers.length === 0 && (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Music className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="font-semibold text-white mb-2">
            No One Nearby
          </h3>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            Try refreshing your location or check back later to find people listening around you.
          </p>
        </div>
      )}
    </div>
  );
}
