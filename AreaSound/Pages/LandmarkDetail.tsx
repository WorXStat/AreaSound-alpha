import React, { useState, useEffect, useCallback, useRef } from "react";
import { Landmark, Song, User, LandmarkSongContribution, SongVote } from "@/entities/all";
import { InvokeLLM, UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, MapPin, Trash2, Pencil, Save, X as XIcon, Image as ImageIcon, Loader2, Link as LinkIcon, Share2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SongItem from "../components/playlists/SongItem";
import AddSongDialog from "../components/playlists/AddSongDialog";
import DeleteLandmarkDialog from "../components/landmarks/DeleteLandmarkDialog";
import EditSongDialog from "../components/playlists/EditSongDialog";

export default function LandmarkDetail() {
  const navigate = useNavigate();
  const [landmark, setLandmark] = useState(null);
  const [creator, setCreator] = useState(null);
  const [songs, setSongs] = useState([]);
  const [showAddSong, setShowAddSong] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [canContribute, setCanContribute] = useState(false);
  const [currentVotes, setCurrentVotes] = useState({});
  const [isEditingLandmark, setIsEditingLandmark] = useState(false);
  const [editedLandmark, setEditedLandmark] = useState(null);
  const [isUpdatingLandmark, setIsUpdatingLandmark] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const thumbnailInputRef = useRef(null);

  const landmarkId = new URLSearchParams(window.location.search).get("id");

  const checkContributionLimit = useCallback(async (user) => {
    if (!user || !landmarkId) {
      setCanContribute(false);
      return false;
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const contributions = await LandmarkSongContribution.filter({
        user_email: user.email,
        landmark_id: landmarkId,
        created_date: { '$gte': startOfDay }
    });

    const baseLimit = 2;
    const bonus = user.bonus_contributions || 0;
    const can = contributions.length < (baseLimit + bonus);
    setCanContribute(can);
    return can;
  }, [landmarkId]);

  const loadData = useCallback(async () => {
    if (landmarkId) {
      const user = await User.me();
      setCurrentUser(user);

      const [landmarkData, songsData, allUsers, userVotes] = await Promise.all([
        Landmark.filter({ id: landmarkId }),
        Song.filter({ landmark_id: landmarkId }, "-created_date"),
        User.list(),
        user ? SongVote.filter({ voter_email: user.email }) : []
      ]);

      if (landmarkData.length > 0) {
        const currentLandmark = landmarkData[0];
        setLandmark(currentLandmark);
        setEditedLandmark({ 
          name: currentLandmark.name, 
          description: currentLandmark.description, 
          is_public: currentLandmark.is_public !== false,
          latitude: currentLandmark.latitude,
          longitude: currentLandmark.longitude
        });
        if (currentLandmark.created_by) {
            const landmarkCreator = await User.filter({ email: currentLandmark.created_by });
            if(landmarkCreator.length > 0) {
                setCreator(landmarkCreator[0]);
            }
        }
      }
      setSongs(songsData);

      const userMap = allUsers.reduce((acc, u) => {
        acc[u.email] = u;
        return acc;
      }, {});
      setUsersMap(userMap);

      const votes = userVotes.reduce((acc, vote) => {
        acc[vote.song_id] = vote.vote_type;
        return acc;
      }, {});
      setCurrentVotes(votes);

      checkContributionLimit(user);
    }
  }, [landmarkId, checkContributionLimit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlayLandmark = async () => {
    if (!currentUser || songs.length === 0) return;
    
    await User.updateMyUserData({
      is_listening: true,
      current_song_id: songs[0].id,
      current_playlist_id: null
    });
    
    loadData();
  };

  const onSongAdded = async (newSongs) => {
    if (currentUser) {
      const baseLimit = 2;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      const contributions = await LandmarkSongContribution.filter({
        user_email: currentUser.email,
        landmark_id: landmarkId,
        created_date: { '$gte': startOfDay }
      });

      const newContributionsCount = newSongs.length;
      const totalContributionsToday = contributions.length + newContributionsCount;

      if (totalContributionsToday > baseLimit && currentUser.bonus_contributions > 0) {
        const bonusUsed = Math.min(currentUser.bonus_contributions, totalContributionsToday - baseLimit);
        await User.updateMyUserData({ bonus_contributions: currentUser.bonus_contributions - bonusUsed });
      }
    }
    loadData();
  };

  const handleVote = async (song, voteType) => {
    if (!currentUser || !song) return;
    if (song.created_by === currentUser.email) return;
    if (currentVotes[song.id] === voteType) return;

    const previousVote = currentVotes[song.id];
    setCurrentVotes(prev => ({ ...prev, [song.id]: voteType }));

    try {
      if (previousVote) {
        const oldVotes = await SongVote.filter({ song_id: song.id, voter_email: currentUser.email });
        if (oldVotes.length > 0) {
          await SongVote.delete(oldVotes[0].id);
        }
      }

      await SongVote.create({
        song_id: song.id,
        voter_email: currentUser.email,
        vote_type: voteType
      });

      const allVotes = await SongVote.filter({ song_id: song.id });
      const voteCount = allVotes.reduce((acc, v) => {
        return acc + (v.vote_type === 'like' ? 1 : -1);
      }, 0);

      await Song.update(song.id, { vote_count: voteCount });

      const allLikes = await SongVote.filter({ vote_type: 'like' });
      const creatorLikeCount = allLikes.filter(v => {
        const likedSong = songs.find(s => s.id === v.song_id);
        return likedSong && likedSong.created_by === song.created_by;
      }).length;

      const songCreatorUser = await User.filter({ email: song.created_by });
      if (songCreatorUser.length > 0) {
        await User.update(songCreatorUser[0].id, { total_likes_received: creatorLikeCount });
      }

      if (voteCount <= -20) {
        await handleDeleteSong(song.id);
      } else {
        loadData();
      }
    } catch (error) {
      console.error("Error voting:", error);
      setCurrentVotes(prev => ({ ...prev, [song.id]: previousVote }));
    }
  };

  const handleLandmarkEdit = async () => {
    if (!editedLandmark || !landmark) return;
    setIsUpdatingLandmark(true);

    try {
      await Landmark.update(landmark.id, {
        name: editedLandmark.name,
        description: editedLandmark.description,
        is_public: editedLandmark.is_public,
        latitude: parseFloat(editedLandmark.latitude),
        longitude: parseFloat(editedLandmark.longitude)
      });
      setIsEditingLandmark(false);
      loadData();
    } catch (error) {
      console.error("Error updating landmark:", error);
    }

    setIsUpdatingLandmark(false);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !landmark) return;

    setIsUploadingThumbnail(true);
    try {
      const { file_url } = await UploadFile({ file });
      await Landmark.update(landmark.id, { thumbnail_url: file_url });
      loadData();
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };

  const copyLandmarkLink = () => {
    const url = `${window.location.origin}${createPageUrl(`LandmarkDetail?id=${landmark.id}`)}`;
    navigator.clipboard.writeText(url);
  };

  const handleLandmarkDeleted = () => {
    navigate(createPageUrl("Discover"));
  };

  const handleDeleteSong = async (songId) => {
    await Song.delete(songId);
    if(currentUser) {
        const contribution = await LandmarkSongContribution.filter({ song_id: songId, user_email: currentUser.email });
        if(contribution.length > 0) {
            await LandmarkSongContribution.delete(contribution[0].id);
        }
    }
    loadData();
  };

  if (!landmark) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading Landmark...</div>
      </div>
    );
  }

  const canEditLandmark = currentUser?.email === landmark?.created_by;

  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Discover"))}
          className="text-white/80 hover:text-emerald-400 mb-6 -ml-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Map
        </Button>

        <div className="bg-black/50 backdrop-blur-md border-2 cyber-border p-8 mb-6 rounded-lg">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group w-48 h-48 flex-shrink-0">
                <div
                  className="w-full h-full rounded-lg bg-cover bg-center flex items-center justify-center"
                  style={{
                      background: landmark.thumbnail_url
                        ? `url(${landmark.thumbnail_url})`
                        : 'linear-gradient(135deg, #0e7490 0%, #059669 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                  }}
                >
                    {!landmark.thumbnail_url && <MapPin className="w-24 h-24 text-emerald-400 opacity-50"/>}
                </div>
                {canEditLandmark && (
                  <>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      onClick={() => thumbnailInputRef.current?.click()}
                      variant="outline"
                      disabled={isUploadingThumbnail}
                      className="absolute inset-0 w-full h-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg"
                    >
                      {isUploadingThumbnail ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                      <span className="text-xs">Change Thumbnail</span>
                    </Button>
                  </>
                )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-400 mb-1">
                {landmark.is_public !== false ? "Public Landmark" : "Private Landmark"}
              </p>

              {isEditingLandmark && canEditLandmark ? (
                <div className="space-y-3 mb-4">
                  <Input
                    value={editedLandmark.name}
                    onChange={(e) => setEditedLandmark({ ...editedLandmark, name: e.target.value })}
                    className="text-2xl font-bold bg-gray-900 border-white/20 text-white"
                  />
                  <Textarea
                    value={editedLandmark.description || ""}
                    onChange={(e) => setEditedLandmark({ ...editedLandmark, description: e.target.value })}
                    className="bg-gray-900 border-white/20 text-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="latitude" className="text-white/80 text-xs mb-1 block">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={editedLandmark.latitude}
                        onChange={(e) => setEditedLandmark({ ...editedLandmark, latitude: e.target.value })}
                        className="bg-gray-900 border-white/20 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-white/80 text-xs mb-1 block">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={editedLandmark.longitude}
                        onChange={(e) => setEditedLandmark({ ...editedLandmark, longitude: e.target.value })}
                        className="bg-gray-900 border-white/20 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="landmark-public"
                      checked={editedLandmark.is_public}
                      onChange={(e) => setEditedLandmark({ ...editedLandmark, is_public: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="landmark-public" className="text-white/80">Public (visible to all users)</Label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">{landmark.name}</h1>
                    {canEditLandmark && (
                      <Button
                        onClick={() => setIsEditingLandmark(true)}
                        size="icon"
                        variant="ghost"
                        className="text-white/60 hover:text-sky-400"
                      >
                        <Pencil className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                  {landmark.description && (
                    <p className="text-white/70 mb-4">{landmark.description}</p>
                  )}
                  <p className="text-white/50 text-xs mb-4 font-mono">
                    📍 {landmark.latitude.toFixed(6)}, {landmark.longitude.toFixed(6)}
                  </p>
                </>
              )}

              <div className="flex items-center gap-4 text-white/60 text-sm mb-6">
                <span>{songs.length} songs</span>
                <span>Created by {creator?.full_name || landmark.created_by.split('@')[0]}</span>
              </div>

              <div className="flex gap-3 flex-wrap">
                {isEditingLandmark && canEditLandmark ? (
                  <>
                    <Button
                      onClick={handleLandmarkEdit}
                      disabled={isUpdatingLandmark || !editedLandmark.name}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 rounded-lg"
                    >
                      {isUpdatingLandmark ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingLandmark(false);
                        setEditedLandmark({ 
                          name: landmark.name, 
                          description: landmark.description, 
                          is_public: landmark.is_public !== false,
                          latitude: landmark.latitude,
                          longitude: landmark.longitude
                        });
                      }}
                      variant="outline"
                      className="bg-transparent border-white/50 hover:bg-white/10 gap-2 rounded-lg"
                    >
                      <XIcon className="w-4 h-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handlePlayLandmark}
                      disabled={songs.length === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 rounded-lg"
                      title="Play this landmark's BGM"
                    >
                      <Play className="w-4 h-4" />
                      Play BGM
                    </Button>
                    <Button
                      onClick={() => setShowAddSong(true)}
                      size="icon"
                      className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg"
                      disabled={!canContribute}
                      title={!canContribute ? "You have reached your daily contribution limit for this landmark." : "Contribute a song"}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={copyLandmarkLink}
                      size="icon"
                      variant="outline"
                      className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg"
                      title="Share Landmark"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    {currentUser?.email === landmark?.created_by && (
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="destructive"
                        className="bg-red-500/80 border-red-400 hover:bg-red-500 gap-2 rounded-lg"
                        title="Delete this landmark"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md border-2 cyber-border overflow-hidden rounded-lg">
          {songs.length > 0 ? (
            <div>
              {songs.map((song, index) => (
                <SongItem
                  key={song.id}
                  song={song}
                  index={index}
                  onDelete={handleDeleteSong}
                  isPublic={true}
                  currentUserEmail={currentUser?.email}
                  songCreator={usersMap[song.created_by]}
                  onVote={handleVote}
                  currentVote={currentVotes[song.id]}
                  onEdit={song.created_by === currentUser?.email ? setEditingSong : null}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">No songs in this landmark's playlist yet</p>
              <Button
                onClick={() => setShowAddSong(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg"
                disabled={!canContribute}
                title={!canContribute ? "You have reached your daily contribution limit." : "Be the first to contribute"}
              >
                <Plus className="w-4 h-4 mr-2" />
                Be the first to contribute
              </Button>
            </div>
          )}
        </div>
      </div>

      <AddSongDialog
        open={showAddSong}
        onClose={() => setShowAddSong(false)}
        landmarkId={landmark.id}
        onSongAdded={onSongAdded}
        contributionCheck={() => checkContributionLimit(currentUser)}
        userBonusContributions={currentUser?.bonus_contributions || 0}
      />

      <EditSongDialog
        open={!!editingSong}
        song={editingSong}
        onClose={() => setEditingSong(null)}
        onSaved={loadData}
      />

      <DeleteLandmarkDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        landmark={landmark}
        onDeleted={handleLandmarkDeleted}
      />
    </div>
  );
}