
import React, { useState, useEffect } from "react";
import { Playlist, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Plus, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlaylistCard from "../components/playlists/PlaylistCard";

export default function MyPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadPlaylists();
    loadCurrentUser();
  }, []);

  const loadPlaylists = async () => {
    const user = await User.me();
    const data = await Playlist.filter({ created_by: user.email }, "-created_date");
    setPlaylists(data);
  };

  const loadCurrentUser = async () => {
    const user = await User.me();
    setCurrentUser(user);
  };

  const handlePlaylistDeleted = () => {
    loadPlaylists();
  };

  return (
    <div className="min-h-screen md:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              My Playlists
            </h1>
            <p className="text-white/70">
              Your personal music collections
            </p>
          </div>
          <Link to={createPageUrl("CreatePlaylist")}>
            <Button className="bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white gap-2 rounded-lg">
              <Plus className="w-4 h-4" />
              New Playlist
            </Button>
          </Link>
        </div>

        {playlists.length > 0 ?
        <div className="rounded-[4px_4px_0px_4px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) =>
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onUpdate={loadPlaylists}
            onDelete={handlePlaylistDeleted}
            currentUser={currentUser} />

          )}
          </div> :

        <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
              <Music2 className="w-12 h-12 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Playlists Yet
            </h3>
            <p className="text-white/60 mb-6">
              Create your first playlist to share your vibe
            </p>
            <Link to={createPageUrl("CreatePlaylist")}>
              <Button className="bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </Link>
          </div>
        }
      </div>
    </div>);

}