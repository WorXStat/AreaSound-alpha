
import React, { useState } from 'react';
import { Playlist, Song } from '@/entities/all';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export default function DeletePlaylistDialog({ open, onOpenChange, playlist, onDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!playlist) return;
        setIsDeleting(true);
        try {
            // Find and delete all songs associated with the playlist
            const songs = await Song.filter({ playlist_id: playlist.id });
            if (songs.length > 0) {
                await Promise.all(songs.map(song => Song.delete(song.id)));
            }

            // Delete the playlist itself
            await Playlist.delete(playlist.id);

            onDeleted();
        } catch (error) {
            console.error("Failed to delete playlist:", error);
        } finally {
            setIsDeleting(false);
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-black border-2 cyber-border text-white rounded-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the playlist "{playlist?.name}" and all of its songs.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 rounded-lg">
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
