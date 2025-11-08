import React, { useState, useEffect } from "react";
import { Song } from "@/entities/all";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function EditSongDialog({ open, song, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
    duration: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || "",
        artist: song.artist || "",
        album: song.album || "",
        duration: song.duration || ""
      });
    }
  }, [song]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!song) return;
    
    setIsSubmitting(true);
    
    try {
      await Song.update(song.id, formData);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error updating song:", error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-2 cyber-border text-white rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">Edit Song</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title" className="text-white/80">Song Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="edit-artist" className="text-white/80">Artist *</Label>
            <Input
              id="edit-artist"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              required
              className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="edit-album" className="text-white/80">Album</Label>
            <Input
              id="edit-album"
              value={formData.album}
              onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="edit-duration" className="text-white/80">Duration</Label>
            <Input
              id="edit-duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. 3:45"
              className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg"
            />
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}