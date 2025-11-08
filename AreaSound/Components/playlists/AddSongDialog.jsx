
import React, { useState, useEffect } from "react";
import { Song, LandmarkSongContribution, User } from "@/entities/all";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvokeLLM } from "@/integrations/Core";

const singleSongSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    artist: { type: "string" },
  },
  required: ["title", "artist"],
};

const songsSchema = {
  type: "object",
  properties: {
    songs: {
      type: "array",
      description: "A list of songs.",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          artist: { type: "string" }
        },
        required: ["title", "artist"]
      }
    }
  },
  required: ["songs"]
};

// Expanded platform detection
const detectPlatform = (url) => {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (hostname.includes('spotify')) return 'Spotify';
        if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'YouTube';
        if (hostname.includes('apple') || hostname.includes('music.apple')) return 'Apple Music';
        if (hostname.includes('line') || hostname.includes('music.line')) return 'LINE Music';
        if (hostname.includes('suno')) return 'Suno';
        if (hostname.includes('udio')) return 'Udio';
        if (hostname.includes('nicovideo') || hostname.includes('ニコニコ')) return 'ニコニコ動画';
        if (hostname.includes('ravedj')) return 'Rave.DJ';
        if (hostname.includes('awa')) return 'AWA';
        return 'Unknown';
    } catch {
        return 'Unknown';
    }
};

const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
};

export default function AddSongDialog({ open, onClose, playlistId, landmarkId, onSongAdded, contributionCheck }) {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
    duration: "",
    source_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Auto-detect URL in title or artist fields
  useEffect(() => {
    const url = extractUrl(formData.title) || extractUrl(formData.artist);
    if (url && url !== formData.source_url) {
      setFormData(prev => ({ ...prev, source_url: url }));
    }
  }, [formData.title, formData.artist, formData.source_url]); // Added formData.source_url to dependency array to prevent infinite loop if url matches existing source_url

  const resetForm = () => {
    setFormData({ title: "", artist: "", album: "", duration: "", source_url: "" });
    setImportUrl("");
    setError(null);
    setIsSubmitting(false);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
        if(landmarkId && contributionCheck) {
            const canContribute = await contributionCheck();
            if (!canContribute) {
                setError("You have reached your daily contribution limit for this landmark.");
                setIsSubmitting(false);
                return;
            }
        }

        const songData = {
            ...formData,
            playlist_id: playlistId || null,
            landmark_id: landmarkId || null,
            vote_count: 0
        }

        if(formData.source_url) {
            songData.platform = detectPlatform(formData.source_url);
        }

      const newSong = await Song.create(songData);

      if (landmarkId) {
        // This is not perfect, assumes user can't race condition this.
        // A backend function would be better to atomically create song and contribution record.
        await LandmarkSongContribution.create({
            landmark_id: landmarkId,
            song_id: newSong.id
            // user_email is automatically added by the backend
        })
        onSongAdded([newSong]);
      } else {
        onSongAdded();
      }

      handleClose();
    } catch (err) {
      console.error("Error adding song:", err);
      setError("Failed to add song. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importUrl) return;

    setIsImporting(true);
    setError(null);

    try {
      if (landmarkId) { // Single song import for landmarks
        if (contributionCheck) {
            const canContribute = await contributionCheck();
            if (!canContribute) {
                setError("You have reached your daily contribution limit for this landmark.");
                setIsImporting(false);
                return;
            }
        }
        const result = await InvokeLLM({
          prompt: `Extract the song title and artist from this URL: ${importUrl}. Provide accurate information.`,
          add_context_from_internet: true,
          response_json_schema: singleSongSchema
        });

        if (result && result.title && result.artist) {
            const newSong = await Song.create({
              ...result,
              landmark_id: landmarkId,
              source_url: importUrl,
              platform: detectPlatform(importUrl),
              vote_count: 0
            });
            await LandmarkSongContribution.create({
              landmark_id: landmarkId,
              song_id: newSong.id
            });
            onSongAdded([newSong]);
        } else {
            throw new Error("Could not parse song data from the URL.");
        }

      } else { // Bulk song import for user playlists
          const result = await InvokeLLM({
            prompt: `Extract a list of songs (title and artist) from this playlist URL: ${importUrl}. Be thorough and accurate.`,
            add_context_from_internet: true,
            response_json_schema: songsSchema
          });

          if (result && result.songs) {
            const songRecords = result.songs.map(song => ({
                ...song, 
                playlist_id: playlistId,
                platform: detectPlatform(importUrl),
                source_url: importUrl,
                vote_count: 0
            }));
            if (songRecords.length > 0) {
              await Song.bulkCreate(songRecords);
              onSongAdded();
            } else {
              setError("No songs were found to import from the URL.");
              setIsImporting(false);
              return;
            }
          } else {
            throw new Error("Could not parse any songs from the URL.");
          }
      }
      
      handleClose();

    } catch (err) {
      console.error("Error importing songs:", err);
      setError(`Failed to import. Reason: ${err.message}. Supported: Spotify, YouTube, Apple Music, LINE Music, Suno, Udio, ニコニコ動画, Rave.DJ, AWA.`);
      setIsImporting(false);
    }
  };

  const importTabTitle = landmarkId ? "Import from URL" : "Import from Link";
  const importTabDescription = landmarkId
    ? "Paste a link to a single song from a supported platform. Your contribution limit will apply."
    : "Paste a playlist link from Apple Music, Spotify, etc.";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-2 cyber-border text-white rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-emerald-400 text-2xl">Add Songs</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/50 rounded-lg">
              <TabsTrigger value="manual" className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-black rounded-lg">Add Manually</TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-black rounded-lg">{importTabTitle}</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <Alert variant="destructive" className="rounded-lg"><AlertDescription>{error}</AlertDescription></Alert>}
                    <div>
                        <Label htmlFor="title" className="text-white/80">Song Title *</Label>
                        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg focus:ring-emerald-500" />
                    </div>
                    <div>
                        <Label htmlFor="artist" className="text-white/80">Artist *</Label>
                        <Input id="artist" value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} required className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg focus:ring-emerald-500" />
                    </div>
                    <div>
                        <Label htmlFor="album" className="text-white/80">Album</Label>
                        <Input id="album" value={formData.album} onChange={(e) => setFormData({ ...formData, album: e.target.value })} className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg focus:ring-emerald-500" />
                    </div>
                    <div>
                        <Label htmlFor="duration" className="text-white/80">Duration</Label>
                        <Input id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 3:45" className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg focus:ring-emerald-500" />
                    </div>
                    {/* The original condition for source_url was !landmarkId. This will be visible for all unless manually added for landmarks too */}
                    <div>
                        <Label htmlFor="source_url" className="text-white/80">Song URL</Label>
                        <Input id="source_url" value={formData.source_url} onChange={(e) => setFormData({ ...formData, source_url: e.target.value })} placeholder="https://..." className="bg-gray-900 border-white/20 text-white mt-1 rounded-lg focus:ring-emerald-500" />
                    </div>
                    <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Adding..." : "Add Song"}
                            </Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            <TabsContent value="import" className="pt-6">
               <form onSubmit={handleImport} className="space-y-6">
                 {error && (
                  <Alert variant="destructive" className="rounded-lg">
                    <AlertTitle>Import Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="importUrl" className="text-white text-sm font-medium mb-2 block">
                    {landmarkId ? "Song URL" : "Playlist URL"}
                  </Label>
                  <p className="text-white/60 text-xs mb-3">
                    {importTabDescription}
                  </p>
                  <Input
                    id="importUrl"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://music.apple.com/..."
                    required
                    type="url"
                    className="bg-gray-900 border-white/20 text-white placeholder:text-white/40 rounded-lg"
                  />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">Cancel</Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={isImporting || !importUrl}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 rounded-lg"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Import
                        </>
                      )}
                    </Button>
                </DialogFooter>
              </form>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
