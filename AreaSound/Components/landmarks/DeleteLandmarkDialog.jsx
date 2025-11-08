import React, { useState } from 'react';
import { Landmark, Song, LandmarkSongContribution, LandmarkCreationRecord, SongLike } from '@/entities/all';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function DeleteLandmarkDialog({ open, onOpenChange, landmark, onDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!landmark) return;
        setIsDeleting(true);
        try {
            // Find and delete all songs, contributions, and likes associated with the landmark
            const songs = await Song.filter({ landmark_id: landmark.id });
            if (songs.length > 0) {
                const songIds = songs.map(s => s.id);
                // This can be slow if there are many records.
                // In a real app, this would be a single backend transaction.
                const contributions = await LandmarkSongContribution.filter({ landmark_id: landmark.id });
                const likes = await SongLike.filter({ landmark_id: landmark.id });
                
                await Promise.all([
                    ...songs.map(song => Song.delete(song.id)),
                    ...contributions.map(c => LandmarkSongContribution.delete(c.id)),
                    ...likes.map(l => SongLike.delete(l.id))
                ]);
            }
            
            // Delete landmark creation record
            const creationRecord = await LandmarkCreationRecord.filter({ landmark_id: landmark.id });
            if (creationRecord.length > 0) {
                await LandmarkCreationRecord.delete(creationRecord[0].id);
            }

            // Delete the landmark itself
            await Landmark.delete(landmark.id);

            onDeleted();
        } catch (error) {
            console.error("Failed to delete landmark:", error);
            // Optionally, show an error to the user
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
                        This action cannot be undone. This will permanently delete the landmark "{landmark?.name}" and all of its songs and contributions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 rounded-lg">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}