
import React, { useState, useEffect } from "react";
import { User, Playlist } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Music, Award, User as UserIcon, Ghost, Bot, Star, Sun, Moon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ICONS = [
{ name: "User", component: UserIcon },
{ name: "Ghost", component: Ghost },
{ name: "Bot", component: Bot },
{ name: "Star", component: Star },
{ name: "Sun", component: Sun },
{ name: "Moon", component: Moon }];


const ICON_COLORS = [
"#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
"#10B981", "#06B6D4", "#6366F1", "#EF4444"];


const GENRES = [
"Pop", "Rock", "Hip-Hop", "R&B", "Jazz", "Classical",
"Electronic", "Country", "Indie", "Metal", "Folk", "Blues"];


export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [playlistCount, setPlaylistCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await User.me();
    setUser(userData);
    setEditedUser({
      full_name: userData.full_name || "",
      bio: userData.bio || "",
      favorite_genres: userData.favorite_genres || [],
      map_icon: userData.map_icon || "User",
      map_icon_color: userData.map_icon_color || "#8B5CF6",
      is_public_profile: userData.is_public_profile !== false
    });

    const playlists = await Playlist.filter({ created_by: userData.email });
    setPlaylistCount(playlists.length);
  };

  const handleSave = async () => {
    await User.updateMyUserData(editedUser);
    setIsEditing(false);
    loadUser();
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const toggleGenre = (genre) => {
    const current = editedUser.favorite_genres || [];
    if (current.includes(genre)) {
      setEditedUser({
        ...editedUser,
        favorite_genres: current.filter((g) => g !== genre)
      });
    } else {
      setEditedUser({
        ...editedUser,
        favorite_genres: [...current, genre]
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>);

  }

  const SelectedIcon = ICONS.find((i) => i.name === (editedUser?.map_icon || "User"))?.component || UserIcon;

  return (
    <div className="min-h-screen md:ml-64">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black/50 backdrop-blur-md border-2 cyber-border p-8 rounded-lg mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white"
                style={{ backgroundColor: editedUser?.map_icon_color || "#8B5CF6" }}>

                <SelectedIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                {isEditing ?
                <Input
                  value={editedUser.full_name}
                  onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                  className="text-2xl font-bold bg-gray-900 border-white/20 text-white mb-2" /> :


                <h1 className="text-white text-xl font-bold">{user.full_name}</h1>
                }
                <p className="text-white/60 text-xs">{user.email}</p>
              </div>
            </div>
            {!isEditing ?
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="bg-transparent border-white/50 hover:bg-white/10 gap-2 rounded-lg">

                <Pencil className="w-4 h-4" />
                Edit Profile
              </Button> :

            <div className="flex gap-2">
                <Button
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 rounded-lg">

                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditedUser({
                    full_name: user.full_name || "",
                    bio: user.bio || "",
                    favorite_genres: user.favorite_genres || [],
                    map_icon: user.map_icon || "User",
                    map_icon_color: user.map_icon_color || "#8B5CF6",
                    is_public_profile: user.is_public_profile !== false
                  });
                }}
                variant="outline"
                className="bg-transparent border-white/50 hover:bg-white/10 rounded-lg">

                  <X className="w-4 h-4" />
                </Button>
              </div>
            }
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg text-center">
              <Music className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{playlistCount}</p>
              <p className="text-white/60 text-sm">Playlists</p>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-lg text-center cursor-pointer hover:bg-sky-500/20 transition-colors" onClick={() => navigate(createPageUrl("MyContributions"))}>
              <Award className="w-8 h-8 text-sky-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{user.total_likes_received || 0}</p>
              <p className="text-white/60 text-sm">Total Likes</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{user.bonus_contributions || 0}</p>
              <p className="text-white/60 text-sm">Bonus Contributions</p>
            </div>
          </div>

          {isEditing ?
          <div className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Bio</Label>
                <Textarea
                value={editedUser.bio}
                onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                placeholder="Tell us about your musical taste..."
                className="bg-gray-900 border-white/20 text-white h-24 rounded-lg" />

              </div>

              <div>
                <Label className="text-white mb-3 block">Map Icon</Label>
                <div className="grid grid-cols-6 gap-3">
                  {ICONS.map(({ name, component: Icon }) =>
                <button
                  key={name}
                  type="button"
                  onClick={() => setEditedUser({ ...editedUser, map_icon: name })}
                  className={`h-16 rounded-lg flex items-center justify-center transition-all ${
                  editedUser.map_icon === name ?
                  "ring-2 ring-emerald-400 bg-emerald-500/20" :
                  "bg-white/10 hover:bg-white/20"}`
                  }>

                      <Icon className="w-6 h-6 text-white" />
                    </button>
                )}
                </div>
              </div>

              <div>
                <Label className="text-white mb-3 block">Icon Color</Label>
                <div className="grid grid-cols-8 gap-3">
                  {ICON_COLORS.map((color) =>
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditedUser({ ...editedUser, map_icon_color: color })}
                  className={`h-12 rounded-lg transition-all ${
                  editedUser.map_icon_color === color ?
                  "ring-2 ring-offset-2 ring-offset-black ring-white/50 scale-105" :
                  "hover:scale-105"}`
                  }
                  style={{ backgroundColor: color }} />

                )}
                </div>
              </div>

              <div>
                <Label className="text-white mb-3 block">Favorite Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) =>
                <Badge
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`cursor-pointer transition-all ${
                  (editedUser.favorite_genres || []).includes(genre) ?
                  "bg-emerald-500 text-black hover:bg-emerald-600" :
                  "bg-white/10 text-white/80 hover:bg-white/20"}`
                  }>

                      {genre}
                    </Badge>
                )}
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg">
                <div>
                  <Label className="text-white">Public Profile</Label>
                  <p className="text-white/60 text-sm mt-1">
                    Allow others to see your profile and location on the map
                  </p>
                </div>
                <Switch
                checked={editedUser.is_public_profile}
                onCheckedChange={(checked) => setEditedUser({ ...editedUser, is_public_profile: checked })} />

              </div>
            </div> :

          <div className="space-y-4">
              {user.bio &&
            <div>
                  <Label className="text-white/60 text-sm">Bio</Label>
                  <p className="text-white mt-1">{user.bio}</p>
                </div>
            }

              {user.favorite_genres && user.favorite_genres.length > 0 &&
            <div>
                  <Label className="text-white/60 text-sm mb-2 block">Favorite Genres</Label>
                  <div className="flex flex-wrap gap-2">
                    {user.favorite_genres.map((genre) =>
                <Badge key={genre} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        {genre}
                      </Badge>
                )}
                  </div>
                </div>
            }

              <div className="flex items-center gap-2 text-white/60 text-sm">
                <span className={`w-2 h-2 rounded-full ${user.is_public_profile !== false ? "bg-emerald-400" : "bg-gray-400"}`} />
                <span>{user.is_public_profile !== false ? "Public Profile" : "Private Profile"}</span>
              </div>
            </div>
          }
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate(createPageUrl("MyContributions"))}
            variant="outline"
            className="w-full bg-transparent border-2 cyber-border hover:bg-white/10 text-white rounded-lg">

            View My Contributions
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-transparent border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg gap-2">

            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>);

}