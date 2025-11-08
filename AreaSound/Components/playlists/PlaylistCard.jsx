import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Music, Trash2, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/all";
import DeletePlaylistDialog from "./DeletePlaylistDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

export default function PlaylistCard({ playlist, onUpdate, onDelete, currentUser, isReadOnly = false }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePlay = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (playlist.song_count > 0 && currentUser) {
      await User.updateMyUserData({
        current_playlist_id: playlist.id,
        is_listening: true
      });
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Link to={createPageUrl(`PlaylistDetail?id=${playlist.id}`)}>
        <Card className="bg-black/50 text-card-foreground rounded-none shadow backdrop-blur-md border-2 cyber-border hover:border-emerald-500 transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
          <div className="bg-center rounded-none h-48 flex items-center justify-center relative"

          style={{
            backgroundColor: playlist.cover_color,
            backgroundImage: playlist.cover_image_url ? `url(${playlist.cover_image_url})` : 'none'
          }}>

            {!playlist.cover_image_url && <Music className="w-16 h-16 text-white/30" />}
            {currentUser &&
            <Button
              onClick={handlePlay}
              size="icon"
              className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 text-black opacity-0 group-hover:opacity-100 transition-opacity shadow-lg rounded-lg">

                <Play className="w-5 h-5" />
              </Button>
            }
            {onDelete && !isReadOnly &&
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-black/50 text-white/70 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg w-8 h-8">

                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black border-white/20 text-white rounded-lg">
                  <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="hover:bg-red-500/20 text-red-400 cursor-pointer rounded-lg">

                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          </div>
          <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
                <h3 className="font-semibold text-white mb-1 truncate">{playlist.name}</h3>
                {playlist.description &&
              <p className="text-white/60 text-sm mb-2 line-clamp-2">{playlist.description}</p>
              }
            </div>
            <div className="flex items-center justify-between text-white/50 text-xs mt-2">
              <span>{playlist.song_count} songs</span>
              {playlist.is_public && <span>Public</span>}
            </div>
          </div>
        </Card>
      </Link>
      {onDelete && !isReadOnly &&
      <DeletePlaylistDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        playlist={playlist}
        onDeleted={onDelete} />

      }
    </>);

}