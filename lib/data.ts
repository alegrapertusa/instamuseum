import fs from 'fs';
import path from 'path';
import { InstagramData, Profile, MediaItem, Connection } from './types';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function readJsonFile<T>(filename: string): T | null {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filename}`);
            return null;
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
}

export async function getInstagramData(): Promise<InstagramData> {
    // Try to load profile
    const profileData = readJsonFile<any>('personal_information.json') || {};
    const profile: Profile = {
        username: profileData?.['profile_user']?.[0]?.['string_map_data']?.['Username']?.['value'] || 'Unknown User',
        biography: profileData?.['profile_user']?.[0]?.['string_map_data']?.['Bio']?.['value'] || '',
        full_name: profileData?.['profile_user']?.[0]?.['string_map_data']?.['Name']?.['value'] || '',
    };

    // Try to load media
    // Common names: content.json, media.json, posts_1.json
    // For this implementation, we'll try content.json first as it's common in newer exports
    const contentData = readJsonFile<any>('content.json');
    let media: MediaItem[] = [];

    if (contentData && Array.isArray(contentData)) {
        media = contentData.flatMap((item: any) => item.media || []);
    } else {
        // Fallback for different structure or file name if needed
        // Sometimes it is split into posts_1.json, etc. 
        // We will just look for posts_1.json for now as a fallback
        const postsData = readJsonFile<any>('posts_1.json');
        if (postsData) {
            media = postsData;
        }
    }

    // followers
    const followersData = readJsonFile<any>('followers_1.json') || readJsonFile<any>('followers.json');
    const followers: Connection[] = (followersData || []).map((f: any) => ({
        href: f.string_list_data?.[0]?.href || '',
        value: f.string_list_data?.[0]?.value || '',
        timestamp: f.string_list_data?.[0]?.timestamp || 0
    }));

    // following
    const followingData = readJsonFile<any>('following.json');
    let following: Connection[] = [];
    if (followingData && followingData.relationships_following) {
        following = followingData.relationships_following.map((f: any) => ({
            href: f.string_list_data?.[0]?.href || '',
            value: f.string_list_data?.[0]?.value || '',
            timestamp: f.string_list_data?.[0]?.timestamp || 0
        }));
    }

    return {
        profile,
        media,
        followers,
        following,
        stories: [],
    };
}
