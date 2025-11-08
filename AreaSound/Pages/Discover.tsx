
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { User, Song, Landmark, LandmarkCreationRecord } from "@/entities/all";
import UsersMap from "../components/discover/UsersMap";
import NearbyUsersList from "../components/discover/NearbyUsersList";
import CreateLandmarkPanel from "../components/discover/CreateLandmarkPanel";
import { Button } from "@/components/ui/button";
import { PlusSquare, X, Layers } from "lucide-react";
import SongSearch from "../components/discover/SongSearch";
import { InvokeLLM } from "@/integrations/Core";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const songSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        artist: { type: "string" },
    },
    required: ["title", "artist"],
};


export default function Discover() {
  const [allNearbyUsers, setAllNearbyUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [vibeMatches, setVibeMatches] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [isCreatingLandmark, setIsCreatingLandmark] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [canCreateLandmark, setCanCreateLandmark] = useState(false);
  const [showUsersLayer, setShowUsersLayer] = useState(true);
  const [showLandmarksLayer, setShowLandmarksLayer] = useState(true);

  const mapRef = useRef(null);

  const checkLandmarkCreationAbility = useCallback(async (user) => {
    if (!user) {
        setCanCreateLandmark(false);
        return;
    }
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

    const records = await LandmarkCreationRecord.filter({
      created_by: user.email,
      created_date: { '$gte': startOfDay }
    });
    
    const baseLimit = 1;
    const bonus = user.bonus_contributions || 0;
    setCanCreateLandmark(records.length < (baseLimit + bonus));
  }, []);

  const loadData = useCallback(async (updateGeo = false) => {
    setIsRefreshing(true);
    try {
      let user = await User.me();
      
      if (updateGeo || !user.latitude || !user.longitude) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          const { latitude, longitude } = position.coords;
          await User.updateMyUserData({ latitude, longitude });
          user = await User.me(); // re-fetch user after location update
        } catch (geoError) {
          console.error("Geolocation failed:", geoError);
          // Optional: handle error with a user notification
        }
      }

      setCurrentUser(user);
      checkLandmarkCreationAbility(user);
      if (user.latitude && user.longitude) { // Only set map center if coordinates are available
        setMapCenter([user.latitude, user.longitude]);
      }

      const [allUsers, allLandmarks] = await Promise.all([
        User.list(),
        Landmark.list(),
      ]);

      // Show all public landmarks to everyone, plus private landmarks created by current user
      const visibleLandmarks = allLandmarks.filter(l => 
        l.is_public !== false || l.created_by === user.email
      );
      setLandmarks(visibleLandmarks);
      
      // Only show users with public profiles (treat undefined as public)
      const publicUsers = allUsers.filter(u => u.is_public_profile !== false);

      const nearby = publicUsers.filter(u =>
        u.id !== user.id && u.latitude && u.longitude &&
        calculateDistance(user.latitude, user.longitude, u.latitude, u.longitude) < 5
      );
      setAllNearbyUsers(nearby);

      const allData = {};
      // Use the 'allUsers' fetched previously to build the userMap for efficiency
      const userMap = allUsers.reduce((acc, u) => {
          acc[u.email] = u;
          return acc;
      }, {});

      const songIds = [user.current_song_id, ...nearby.map(u => u.current_song_id)].filter(Boolean);

      const songs = songIds.length > 0 ? await Song.filter({ id: { '$in': songIds } }) : [];
      const songMap = songs.reduce((acc, song) => {
        acc[song.id] = song;
        return acc;
      }, {});
      
      for (const u of [user, ...nearby]) {
        allData[u.id] = { user: u };
        if (u.current_song_id && songMap[u.current_song_id]) {
            allData[u.id].song = songMap[u.current_song_id];
        }
      }
      allData.userMap = userMap;
      setUsersData(allData);

      const currentUserData = allData[user.id];
      if (currentUserData?.user.is_listening && currentUserData?.song) {
        const matches = nearby
          .map(nu => allData[nu.id])
          .filter(data => {
            if (!data?.user.is_listening || !data?.song) return false;
            if (data.song.id === currentUserData.song.id) return true;
            if (data.song.artist === currentUserData.song.artist) return true;
            return false;
          })
          .map(data => data.user.id);
        setVibeMatches(matches);
      } else {
        setVibeMatches([]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsRefreshing(false);
  }, [checkLandmarkCreationAbility]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSearch = async (query) => {
    if (!query) {
        setSearchQuery("");
        return;
    }
    setIsSearching(true);
    try {
        const result = await InvokeLLM({
            prompt: `Based on the following query, identify the song title and artist. The query could be a song title, artist name, or a snippet of lyrics. Query: "${query}"`,
            response_json_schema: songSchema,
        });
        if (result && result.title) {
            setSearchQuery(result.title.toLowerCase());
        } else {
            setSearchQuery(query.toLowerCase()); // Fallback to raw query
        }
    } catch (error) {
        console.error("Search failed:", error);
        setSearchQuery(query.toLowerCase()); // Fallback
    }
    setIsSearching(false);
  };
  
  const filteredNearbyUsers = useMemo(() => {
    if (!searchQuery) return allNearbyUsers;
    return allNearbyUsers.filter(user => {
        const userData = usersData[user.id];
        if (!userData || !userData.song) return false;
        return (
            userData.song.title.toLowerCase().includes(searchQuery) ||
            userData.song.artist.toLowerCase().includes(searchQuery)
        );
    });
  }, [searchQuery, allNearbyUsers, usersData]);

  const onLandmarkCreated = async (landmark) => {
    setIsCreatingLandmark(false);
    
    if (currentUser) {
      const baseLimit = 1;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const records = await LandmarkCreationRecord.filter({
        created_by: currentUser.email,
        created_date: { '$gte': startOfDay }
      });

      // If user has reached base limit and has bonus contributions, use one bonus
      if (records.length >= baseLimit && currentUser.bonus_contributions > 0) {
        // Decrement bonus contributions and update user data
        await User.updateMyUserData({ bonus_contributions: currentUser.bonus_contributions - 1 });
      }
      
      // Create a record for the newly created landmark
      await LandmarkCreationRecord.create({
        landmark_id: landmark.id,
        created_by: currentUser.email, // Fix: Changed user_email to created_by
      });
    }
    
    loadData(); // Reload all data including updated user data and landmarks
  };
  
  const handleMapMove = (center) => {
    if (isCreatingLandmark) {
      setMapCenter([center.lat, center.lng]);
    }
  }

  const handleCreateLandmarkClick = () => {
    if (!showLandmarksLayer) {
      // Auto-enable landmarks layer when creating landmark
      setShowLandmarksLayer(true);
    }
    setIsCreatingLandmark(!isCreatingLandmark);
  };

  return (
    <div className="h-full relative">
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
            <p className="text-white/70">Find new music and friends nearby.</p>
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
            <SongSearch onSearch={handleSearch} isSearching={isSearching} />

            {/* Layer Controls */}
            <div className="bg-black/50 backdrop-blur-md border-2 cyber-border p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-white font-semibold">Map Layers</h3>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="users-layer" className="text-white/80 cursor-pointer">
                            Show Users ({allNearbyUsers.length} nearby)
                        </Label>
                        <Switch
                            id="users-layer"
                            checked={showUsersLayer}
                            onCheckedChange={setShowUsersLayer}
                            className="data-[state=checked]:bg-emerald-400"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="landmarks-layer" className="text-white/80 cursor-pointer">
                            Show Landmarks ({landmarks.length} visible)
                        </Label>
                        <Switch
                            id="landmarks-layer"
                            checked={showLandmarksLayer}
                            onCheckedChange={setShowLandmarksLayer}
                            className="data-[state=checked]:bg-emerald-400"
                        />
                    </div>
                </div>
            </div>
        
            <div className="w-full h-96 bg-black border-2 cyber-border relative rounded-lg overflow-hidden shadow-2xl">
                {currentUser && (
                    <UsersMap 
                      currentUser={currentUser} 
                      nearbyUsers={filteredNearbyUsers}
                      vibeMatches={vibeMatches}
                      usersData={usersData}
                      landmarks={landmarks}
                      mapRef={mapRef}
                      isPlacingPin={isCreatingLandmark}
                      onMapMove={handleMapMove}
                      showUsersLayer={showUsersLayer}
                      showLandmarksLayer={showLandmarksLayer}
                    />
                )}
                {isCreatingLandmark && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="relative flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-sky-500/50 border-2 border-white animate-pulse"></div>
                            <div className="w-px h-5 bg-white"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button 
                    className={`border text-white hover:text-black rounded-lg ${
                        isCreatingLandmark
                            ? "bg-red-500/80 border-red-400 hover:bg-red-500"
                            : "bg-black/80 border-emerald-400 text-emerald-400 hover:bg-emerald-900 hover:text-white"
                    }`}
                    onClick={handleCreateLandmarkClick}
                    disabled={(!canCreateLandmark && !isCreatingLandmark) || (!showLandmarksLayer && !isCreatingLandmark)}
                    title={
                        !showLandmarksLayer && !isCreatingLandmark
                            ? "Enable landmarks layer to create landmarks"
                            : !canCreateLandmark && !isCreatingLandmark
                            ? "You've reached your daily landmark creation limit or don't have bonus contributions."
                            : "Create a new landmark"
                    }
                >
                    {isCreatingLandmark ? <X className="w-4 h-4 mr-2" /> : <PlusSquare className="w-4 h-4 mr-2" />}
                    {isCreatingLandmark ? "Cancel" : "Create Landmark"}
                </Button>
            </div>
            
            <NearbyUsersList
                currentUser={currentUser}
                nearbyUsers={filteredNearbyUsers}
                vibeMatches={vibeMatches}
                usersData={usersData}
                isRefreshing={isRefreshing}
                onRefresh={() => loadData(true)}
                calculateDistance={calculateDistance}
            />
        </div>

      <CreateLandmarkPanel
        open={isCreatingLandmark}
        coords={mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : null}
        onClose={() => setIsCreatingLandmark(false)}
        onSuccess={onLandmarkCreated}
      />
    </div>
  );
}
