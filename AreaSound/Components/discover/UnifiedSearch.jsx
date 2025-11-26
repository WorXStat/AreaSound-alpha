import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, UserPlus, Check, Music, Users } from "lucide-react";
import { User, Friendship } from "@/entities/all";

export default function UnifiedSearch({ onSongSearch, isSongSearching, currentUser }) {
    const [mode, setMode] = useState("vibe"); // 'vibe' | 'user'
    const [query, setQuery] = useState("");
    
    // User search specific state
    const [userResults, setUserResults] = useState([]);
    const [isUserSearching, setIsUserSearching] = useState(false);
    const [sentRequests, setSentRequests] = useState(new Set());
    const [hasSearchedUsers, setHasSearchedUsers] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        if (mode === "vibe") {
            onSongSearch(query);
            setUserResults([]); 
            setHasSearchedUsers(false);
        } else {
            setIsUserSearching(true);
            setHasSearchedUsers(true);
            try {
               const allUsers = await User.list();
               const filtered = allUsers.filter(u => 
                   u.full_name?.toLowerCase().includes(query.toLowerCase()) && 
                   u.id !== currentUser.id
               );
               
               const myRequests = await Friendship.filter({ requester_email: currentUser.email });
               const sentSet = new Set(myRequests.map(r => r.recipient_email));
               setSentRequests(sentSet);
               setUserResults(filtered);
            } catch(err) {
                console.error(err);
            } finally {
                setIsUserSearching(false);
            }
        }
    };
    
    const sendRequest = async (recipientEmail) => {
        if (!recipientEmail) return;
        try {
          await Friendship.create({
            requester_email: currentUser.email,
            recipient_email: recipientEmail,
            status: "pending"
          });
          setSentRequests(prev => new Set(prev).add(recipientEmail));
        } catch (error) {
          console.error("Failed to send request:", error);
        }
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        // Optional: Clear query or results when switching?
        // Keeping query might be annoying if switching context, but let's keep it simple.
        if (newMode === "vibe") {
            setUserResults([]);
        }
    };

    return (
        <div className="p-4 bg-black/30 backdrop-blur-md border-2 cyber-border rounded-lg">
            <h2 className="text-lg font-bold text-white mb-3">
                {mode === "vibe" ? "Search for a Vibe" : "Find Friends"}
            </h2>
            <div className="flex flex-col md:flex-row gap-2 mb-4">
                <div className="flex-shrink-0">
                    <Select value={mode} onValueChange={handleModeChange}>
                        <SelectTrigger className="w-full md:w-[140px] bg-gray-900 border-white/20 text-white">
                            <SelectValue placeholder="Search Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vibe">
                                <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4" />
                                    <span>Vibe</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>User</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === "vibe" ? "Search by song, artist, or lyrics..." : "Search users by name..."}
                        className="bg-gray-900 text-white border-white/20 placeholder:text-white/40"
                    />
                    <Button 
                        type="submit" 
                        disabled={isSongSearching || isUserSearching || !query}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black min-w-[100px]"
                    >
                        {(isSongSearching || isUserSearching) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span className="ml-2">Search</span>
                    </Button>
                </form>
            </div>

            {mode === "user" && hasSearchedUsers && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {userResults.length > 0 ? (
                        userResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                                <div>
                                    <p className="text-white font-medium">{user.full_name}</p>
                                    <p className="text-white/40 text-xs">{user.email}</p>
                                </div>
                                {sentRequests.has(user.email) ? (
                                    <Button size="sm" variant="secondary" disabled className="bg-white/10 text-white/60">
                                        <Check className="w-4 h-4 mr-1" /> Sent
                                    </Button>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        onClick={() => sendRequest(user.email)}
                                        className="bg-sky-500 hover:bg-sky-600 text-white"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-white/50 text-center py-4">No users found matching "{query}"</div>
                    )}
                </div>
            )}
            
            {mode === "vibe" && (
                 <p className="text-xs text-white/50 mt-2">Note: Search by humming is not currently supported.</p>
            )}
        </div>
    );
}