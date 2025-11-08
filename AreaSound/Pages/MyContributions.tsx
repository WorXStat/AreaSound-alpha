import React, { useState, useEffect } from "react";
import { Song, LandmarkSongContribution, Landmark, User, SongVote } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function MyContributions() {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await User.me();
    setCurrentUser(user);

    const myContributions = await LandmarkSongContribution.filter({
      user_email: user.email
    }, "-created_date");

    const songIds = myContributions.map(c => c.song_id);
    const landmarkIds = [...new Set(myContributions.map(c => c.landmark_id))];

    const [songs, landmarks] = await Promise.all([
      songIds.length > 0 ? Song.filter({ id: { '$in': songIds } }) : [],
      landmarkIds.length > 0 ? Landmark.filter({ id: { '$in': landmarkIds } }) : []
    ]);

    const songMap = songs.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {});

    const landmarkMap = landmarks.reduce((acc, l) => {
      acc[l.id] = l;
      return acc;
    }, {});

    const enrichedContributions = myContributions
      .map(c => ({
        ...c,
        song: songMap[c.song_id],
        landmark: landmarkMap[c.landmark_id]
      }))
      .filter(c => c.song);

    setContributions(enrichedContributions);
  };

  return (
    <div className="min-h-screen md:ml-64">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Profile"))}
          className="text-white/80 hover:text-emerald-400 mb-6 -ml-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Contributions</h1>
          <div className="flex items-center gap-4 text-white/70">
            <span>{contributions.length} songs contributed</span>
            <span>•</span>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
              <span>{currentUser?.total_likes_received || 0} total likes</span>
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md border-2 cyber-border rounded-lg overflow-hidden">
          {contributions.length > 0 ? (
            contributions.map((contribution, index) => (
              <div
                key={contribution.id}
                className="flex items-center gap-4 p-4 hover:bg-emerald-500/10 transition-colors border-b border-white/10 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{contribution.song.title}</p>
                  <p className="text-white/60 text-sm">{contribution.song.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-white/50">
                      {contribution.landmark?.name || "Unknown Location"}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${
                    contribution.song.vote_count > 0 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-400" 
                      : contribution.song.vote_count < 0
                      ? "bg-red-500/20 text-red-400 border-red-400"
                      : "bg-white/10 text-white/60 border-white/20"
                  }`}
                >
                  {contribution.song.vote_count > 0 ? "+" : ""}{contribution.song.vote_count} votes
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl(`LandmarkDetail?id=${contribution.landmark_id}`))}
                  className="text-emerald-400 hover:text-emerald-300 rounded-lg"
                >
                  View
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">You haven't contributed any songs yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}