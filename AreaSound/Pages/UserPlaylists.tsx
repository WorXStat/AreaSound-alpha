import React, { useState, useEffect } from "react";
import { Playlist, User } from "@/entities/all";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlaylistCard from "../components/playlists/PlaylistCard";

export default function UserPlaylists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  
  const userEmail = new URLSearchParams(window.location.search).get("email");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!userEmail) return;
    
    const users = await User.filter({ email: userEmail });
    if (users.length > 0) {
      setTargetUser(users[0]);
      const userPlaylists = await Playlist.filter({ 
        created_by: userEmail,
        is_public: true 
      }, "-created_date");
      setPlaylists(userPlaylists);
    }
  };

  if (!targetUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Discover"))}
          className="text-white/80 hover:text-emerald-400 mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {targetUser.full_name}'s Playlists
          </h1>
          {targetUser.bio && (
            <p className="text-white/70">{targetUser.bio}</p>
          )}
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onUpdate={loadData}
                currentUser={null}
                isReadOnly={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/60">This user hasn't shared any public playlists yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}