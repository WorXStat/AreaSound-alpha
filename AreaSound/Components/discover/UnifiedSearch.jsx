import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

export default function SongSearch({ onSearch, isSearching }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="bg-black/50 backdrop-blur-md p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-3">Search for a Vibe</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
            <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by song, artist, or lyrics..."
                className="bg-gray-900 border-white/20 text-white placeholder:text-white/40 rounded-none flex-1"
            />
            <Button
                type="submit"
                disabled={isSearching || !query}
                className="bg-emerald-500 hover:bg-emerald-600 text-black rounded-none gap-2"
            >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
            </Button>
        </form>
        <p className="text-xs text-white/50 mt-3">Note: Search by humming is not currently supported.</p>
    </div>
  );
}