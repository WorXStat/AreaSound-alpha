
import React, { useState } from "react";
import { Playlist, Song } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Link as LinkIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvokeLLM } from "@/integrations/Core";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const COLORS = [
  '#0ea5e9', '#0e7490', '#0f766e', '#059669', 
  '#10b981', '#3b82f6', '#2563eb', '#0369a1'
];

const playlistSchema = {
  "type": "object",
  "properties": {
    "name": { "type": "string", "description": "The name of the playlist." },
    "description": { "type": "string", "description": "A brief description of the playlist." },
    "songs": {
      "type": "array",
      "description": "A list of songs in the playlist.",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "artist": { "type": "string" }
        },
        "required": ["title", "artist"]
      }
    }
  },
  "required": ["name", "songs"]
};

export default function CreatePlaylist() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover_color: "#0ea5e9",
    is_public: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newPlaylist = await Playlist.create({
        ...formData,
        song_count: 0
      });
      
      navigate(createPageUrl(`PlaylistDetail?id=${newPlaylist.id}`));
    } catch (error) {
      console.error("Error creating playlist:", error);
      setError("Failed to create the playlist. Please try again.");
    }
    
    setIsSubmitting(false);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importUrl) return;
    
    setIsImporting(true);
    setError(null);

    try {
      const result = await InvokeLLM({
        prompt: `Extract playlist data from this URL: ${importUrl}. Provide the playlist name, a short description, and a list of songs with title and artist.`,
        add_context_from_internet: true,
        response_json_schema: playlistSchema
      });

      if (result && result.name && result.songs) {
        const newPlaylist = await Playlist.create({
          name: result.name,
          description: result.description || "Imported from " + new URL(importUrl).hostname,
          cover_color: COLORS[Math.floor(Math.random() * COLORS.length)],
          is_public: true,
          song_count: result.songs.length
        });
        
        const songsToCreate = result.songs.map(song => ({
          ...song,
          playlist_id: newPlaylist.id
        }));

        if (songsToCreate.length > 0) {
          await Song.bulkCreate(songsToCreate);
        }

        navigate(createPageUrl(`PlaylistDetail?id=${newPlaylist.id}`));
      } else {
        throw new Error("Could not parse playlist data from the URL.");
      }
    } catch (err) {
      console.error("Error importing playlist:", err);
      setError("Failed to import playlist. Please check the URL and try again. Supported platforms include Apple Music, LINE Music, Spotify, YouTube Music, and Amazon Music.");
    }

    setIsImporting(false);
  };

  return (
    <div className="min-h-screen md:ml-64">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("MyPlaylists"))}
          className="text-white/80 hover:text-emerald-400 mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Playlists
        </Button>

        <div className="bg-black/50 backdrop-blur-md border-2 cyber-border p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-white mb-6">Create New Playlist</h1>
          
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/50 rounded-lg">
              <TabsTrigger value="manual" className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-black rounded-lg">Create Manually</TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-black rounded-lg">Import from Link</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Manual form fields */}
                <div>
                  <Label htmlFor="name" className="text-white text-sm font-medium mb-2 block">
                    Playlist Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Playlist"
                    required
                    className="bg-gray-900 border-white/20 text-white placeholder:text-white/40 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white text-sm font-medium mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your playlist..."
                    className="bg-gray-900 border-white/20 text-white placeholder:text-white/40 h-24 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-white text-sm font-medium mb-3 block">
                    Cover Color
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, cover_color: color })}
                        className={`h-12 rounded-lg transition-all ${
                          formData.cover_color === color
                            ? "ring-4 ring-offset-2 ring-offset-black ring-white/50 scale-105"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-black/30 p-4">
                  <div>
                    <Label htmlFor="public" className="text-white text-sm font-medium">
                      Share with nearby users
                    </Label>
                    <p className="text-white/60 text-xs mt-1">
                      Let people around you see this playlist
                    </p>
                  </div>
                  <Switch
                    id="public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl("MyPlaylists"))}
                    className="flex-1 bg-transparent border-white/50 text-white hover:bg-white/20 rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white rounded-lg"
                  >
                    {isSubmitting ? "Creating..." : "Create Playlist"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="import" className="pt-6">
              <form onSubmit={handleImport} className="space-y-6">
                 {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Import Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="importUrl" className="text-white text-sm font-medium mb-2 block">
                    Playlist URL
                  </Label>
                  <p className="text-white/60 text-xs mb-3">
                    Paste a link from Apple Music, LINE Music, Spotify, etc.
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
                <Button
                  type="submit"
                  disabled={isImporting || !importUrl}
                  className="w-full bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white gap-2 rounded-lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Import Playlist
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
