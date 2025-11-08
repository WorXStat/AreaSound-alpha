import React, { useState, useEffect, useRef, useCallback } from "react";
import { Playlist, Song, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SongItem from "../components/playlists/SongItem";
import AddSongDialog from "../components/playlists/AddSongDialog";
import EditSongDialog from "../components/playlists/EditSongDialog";
import { UploadFile } from "@/integrations/Core";

export default function PlaylistDetail() {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [showAddSong, setShowAddSong] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const fileInputRef = useRef(null);

  const playlistId = new URLSearchParams(window.location.search).get("id");

  const loadPlaylist = useCallback(async () => {
    if (playlistId) {
      const playlists = await Playlist.filter({ id: playlistId });
      if (playlists.length > 0) {
        setPlaylist(playlists[0]);
        const data = await Song.filter({ playlist_id: playlistId }, "-created_date");
        setSongs(data);
        if (playlists[0].song_count !== data.length) {
          await Playlist.update(playlistId, { song_count: data.length });
        }
      } else {
        setPlaylist(null);
        setSongs([]);
      }
    }
  }, [playlistId]);

  const loadCurrentUser = useCallback(async () => {
    const user = await User.me();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    loadPlaylist();
    loadCurrentUser();
  }, [loadPlaylist, loadCurrentUser]);

  const refreshPlaylist = async () => {
    await loadPlaylist();
  };

  const handlePlayPlaylist = async () => {
    if (!playlist || songs.length === 0) return;

    await User.updateMyUserData({
      current_playlist_id: playlist.id,
      current_song_id: songs[0].id,
      is_listening: true
    });

    const user = await User.me();
    setCurrentUser(user);
  };

  const handleDeleteSong = async (songId) => {
    await Song.delete(songId);
    refreshPlaylist();
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      if (playlist?.id) {
        await Playlist.update(playlist.id, { cover_image_url: file_url });
        await refreshPlaylist();
      }
    } catch (error) {
      console.error("Failed to upload cover image:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyPlaylistLink = () => {
    const url = `${window.location.origin}${createPageUrl(`PlaylistDetail?id=${playlistId}`)}`;
    navigator.clipboard.writeText(url);
  };

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>);

  }

  return (
    <div className="md:ml-64">
      <div className="bg-slate-950 mx-auto px-4 py-8 max-w-4xl sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("MyPlaylists"))}
          className="text-white/80 hover:text-emerald-400 mb-6 -ml-2 rounded-lg">

          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-black mb-6 p-8 rounded-none cyber-border border-2">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group w-48 h-48 flex-shrink-0">
                <div
                className="w-full h-full rounded-lg bg-cover bg-center"
                style={{
                  backgroundColor: playlist.cover_color,
                  boxShadow: `0 0 15px ${playlist.cover_color}`,
                  backgroundImage: playlist.cover_image_url ? `url(${playlist.cover_image_url})` : 'none'
                }} />

                <input
                type="file"
                ref={fileInputRef}
                onChange={handleCoverImageChange}
                className="hidden"
                accept="image/*" />

                <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isUploading}
                className="absolute inset-0 w-full h-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">

                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                  <span className="text-xs">Change Cover</span>
                </Button>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
              {playlist.description &&
              <p className="text-white/70 mb-4">{playlist.description}</p>
              }
              <div className="flex items-center gap-4 text-white/60 text-sm mb-6">
                <span>{songs.length} songs</span>
                {playlist.is_public && <span>• Public</span>}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePlayPlaylist}
                  disabled={songs.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 rounded-lg">

                  <Play className="w-4 h-4" />
                  Play
                </Button>
                <Button
                  onClick={() => setShowAddSong(true)}
                  size="icon"
                  variant="outline"
                  className="bg-transparent border-white/50 text-white hover:bg-white/20 rounded-lg"
                  title="Add Song">

                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  onClick={copyPlaylistLink}
                  size="icon"
                  variant="outline"
                  className="bg-transparent border-white/50 text-white hover:bg-white/20 rounded-lg"
                  title="Share Playlist">

                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border-2 cyber-border overflow-hidden rounded-lg">
          {songs.length > 0 ?
          <div>
              {songs.map((song, index) =>
            <SongItem
              key={song.id}
              song={song}
              index={index}
              onDelete={handleDeleteSong}
              currentUserEmail={currentUser?.email}
              isPublic={false}
              onPlay={async () => {
                await User.updateMyUserData({
                  current_song_id: song.id,
                  current_playlist_id: playlist.id,
                  is_listening: true
                });
                const user = await User.me();
                setCurrentUser(user);
              }}
              onEdit={setEditingSong} />

            )}
            </div> :

          <div className="text-center py-12">
              <p className="text-white/60 mb-4">No songs in this playlist yet</p>
              <Button
              onClick={() => setShowAddSong(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg">

                <Plus className="w-4 h-4 mr-2" />
                Add Your First Song
              </Button>
            </div>
          }
        </div>
      </div>

      <AddSongDialog
        open={showAddSong}
        onClose={() => setShowAddSong(false)}
        playlistId={playlist.id}
        onSongAdded={refreshPlaylist} />


      <EditSongDialog
        open={!!editingSong}
        song={editingSong}
        onClose={() => setEditingSong(null)}
        onSaved={refreshPlaylist} />

    </div>);

}