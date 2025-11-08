import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Trash2, User as UserIcon, Ghost, Bot, Star, Sun, Moon, ExternalLink, ThumbsUp, ThumbsDown, Pencil, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS = { User: UserIcon, Ghost, Bot, Star, Sun, Moon };

export default function SongItem({ 
  song, 
  index, 
  onDelete, 
  onPlay, 
  isPublic, 
  currentUserEmail, 
  songCreator, 
  onVote, 
  currentVote,
  onEdit
}) {
  const canDelete = !isPublic || (isPublic && song.created_by === currentUserEmail);
  const canVote = isPublic && onVote && song.created_by !== currentUserEmail;
  const canEdit = onEdit && song.created_by === currentUserEmail;

  const CreatorIcon = songCreator && ICONS[songCreator.map_icon] ? ICONS[songCreator.map_icon] : UserIcon;

  const voteColor = song.vote_count > 0 
    ? "text-emerald-400" 
    : song.vote_count < 0 
    ? "text-red-400" 
    : "text-white/60";

  const hasActions = (canEdit || canDelete || song.source_url);

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-emerald-500/10 transition-colors border-b border-white/10 last:border-b-0 group">
      <div className="flex-shrink-0 w-6 text-center">
        <span className="text-white/40 text-sm">{index + 1}</span>
      </div>
      
      {onPlay && (
        <Button
            onClick={onPlay}
            size="icon"
            variant="ghost"
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full"
        >
            <Play className="w-4 h-4" />
        </Button>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{song.title}</p>
        <div className="flex items-center gap-2">
            <p className="text-white/60 text-sm truncate">{song.artist}</p>
            {isPublic && songCreator && (
                <div className="flex items-center gap-1 text-xs text-white/40">
                    <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: songCreator.map_icon_color || '#8B5CF6' }}
                    >
                        <CreatorIcon className="w-2.5 h-2.5 text-white"/>
                    </div>
                    <span>{songCreator.full_name || 'Anonymous'}</span>
                </div>
            )}
            {isPublic && !songCreator && <p className="text-xs text-white/40">Added by {song.created_by ? song.created_by.split('@')[0] : 'Anonymous'}</p>}
        </div>
      </div>

      {song.album && (
        <div className="hidden md:block text-white/60 text-sm truncate max-w-48">
          {song.album}
        </div>
      )}

      {song.duration && (
        <div className="text-white/60 text-sm">{song.duration}</div>
      )}

      {canVote && (
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onVote(song, 'like')}
            size="icon"
            variant="ghost"
            className={`transition-opacity flex-shrink-0 rounded-full ${
              currentVote === 'like' 
                ? "text-emerald-500" 
                : "text-white/40 opacity-0 group-hover:opacity-100 hover:text-emerald-400"
            }`}
            disabled={currentVote === 'like'}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <span className={`text-sm font-medium min-w-[2rem] text-center ${voteColor}`}>
            {song.vote_count > 0 ? '+' : ''}{song.vote_count}
          </span>
          <Button
            onClick={() => onVote(song, 'dislike')}
            size="icon"
            variant="ghost"
            className={`transition-opacity flex-shrink-0 rounded-full ${
              currentVote === 'dislike' 
                ? "text-red-500" 
                : "text-white/40 opacity-0 group-hover:opacity-100 hover:text-red-400"
            }`}
            disabled={currentVote === 'dislike'}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {hasActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-full"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black border-white/20 text-white rounded-lg">
            {song.source_url && (
              <DropdownMenuItem
                onClick={() => window.open(song.source_url, '_blank')}
                className="hover:bg-white/10 cursor-pointer rounded-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in {song.platform || 'Browser'}
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(song)}
                className="hover:bg-white/10 cursor-pointer rounded-lg"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Song
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(song.id)}
                className="hover:bg-red-500/20 text-red-400 cursor-pointer rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}