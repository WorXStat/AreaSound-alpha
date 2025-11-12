import React, { useState, useEffect } from 'react';
import { Landmark } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateLandmarkPanel({ open, onClose, coords, onSuccess }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) {
            setName('');
            setDescription('');
            setIsPublic(true);
            setError(null);
            setIsSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if(!name || !coords) {
            setError('Landmark name is required and coordinates must be set.');
            setIsSubmitting(false);
            return;
        }

        try {
            const newLandmark = await Landmark.create({
                name,
                description,
                latitude: coords.lat,
                longitude: coords.lng,
                is_public: isPublic
            });
            onSuccess(newLandmark);
        } catch(err) {
            console.error("Error creating landmark", err);
            setError("Failed to create landmark. Please try again.");
            setIsSubmitting(false);
        }
    }

    if (!open) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 md:left-auto md:bottom-8 md:right-8 md:w-96 bg-black/80 backdrop-blur-md border-t-2 md:border-2 cyber-border z-20 p-6 md:rounded-lg">
            <h2 className="text-sky-400 text-2xl font-bold mb-4">Create New Landmark</h2>
            <p className="text-white/60 text-sm mb-4">Pan the map to position the pin, then fill out the details below.</p>
            {coords && (
                <div className="text-xs text-white/40 mb-3">
                    📍 Location: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="destructive" className="rounded-lg"><AlertDescription>{error}</AlertDescription></Alert>}
                <div>
                    <Label htmlFor="landmark-name">Landmark Name *</Label>
                    <Input id="landmark-name" value={name} onChange={e => setName(e.target.value)} required className="bg-gray-900 border-white/20 mt-1 rounded-lg focus:ring-sky-500" />
                </div>
                <div>
                    <Label htmlFor="landmark-desc">Description</Label>
                    <Textarea id="landmark-desc" value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-900 border-white/20 mt-1 rounded-lg focus:ring-sky-500" />
                </div>
                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                    <div>
                        <Label htmlFor="landmark-public" className="text-white">Public Landmark</Label>
                        <p className="text-white/60 text-xs mt-1">
                            Allow all users to see this landmark
                        </p>
                    </div>
                    <Switch
                        id="landmark-public"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                    />
                </div>
                <div className="flex gap-4 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} className="w-full bg-transparent border-white/50 hover:bg-white/10 rounded-lg">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || !name} className="w-full bg-sky-500 hover:bg-sky-600 text-black rounded-lg">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Creating..." : "Create Landmark"}
                    </Button>
                </div>
            </form>
        </div>
    )
}