import React from 'react';
import { Profile } from '../lib/types';

interface ProfileHeaderProps {
    profile: Profile;
    blobMap?: Map<string, string>;
}

export default function ProfileHeader({ profile, blobMap }: ProfileHeaderProps) {
    // Helper to resolve src
    const getSrc = (uri?: string) => {
        if (!uri) return null;
        if (blobMap) {
            let cleanUri = uri.startsWith('/') ? uri.slice(1) : uri;
            cleanUri = cleanUri.replace(/\\/g, '/');
            try { cleanUri = decodeURIComponent(cleanUri); } catch (e) { }
            cleanUri = cleanUri.toLowerCase(); // Case insensitive lookup

            if (blobMap.has(cleanUri)) return blobMap.get(cleanUri);
            const filename = cleanUri.split('/').pop();
            if (filename && blobMap.has(filename)) return blobMap.get(filename);
        }

        // Only return if it looks like a real image path or URL
        if (uri && (uri.includes('/') || uri.includes('.')) && !uri.toLowerCase().endsWith('.json')) {
            return uri;
        }
        return null;
    };

    const imgSrc = getSrc(profile.profile_pic_url);

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-2 border-gray-100">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-semibold bg-gray-100">
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            {profile.full_name && <p className="text-gray-600 font-medium">{profile.full_name}</p>}
            {profile.biography && <p className="text-gray-600 mt-2 text-center max-w-md text-sm">{profile.biography}</p>}
        </div>
    );
}
