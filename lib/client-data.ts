import { InstagramData, Profile, MediaItem, Connection, StoryItem } from './types';
import { ClientLogger } from './logger';

function normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
}

// Helper to fix mojibake (Latin-1 interpreted as UTF-8)
function decodeInstagramString(str: string): string {
    if (!str) return '';
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}

export async function parseInstagramData(files: FileList): Promise<InstagramData> {
    ClientLogger.clear();
    ClientLogger.log(`Starting parse with ${files.length} files`);

    const fileMap = new Map<string, File>();
    const allFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        allFiles.push(file);
        fileMap.set(file.name, file);
    }

    // Enhanced Finder
    const findFile = (targetName: string): File | undefined => {
        if (fileMap.has(targetName)) return fileMap.get(targetName);

        const parts = targetName.split('/');
        const filenameOnly = parts[parts.length - 1];

        for (const file of allFiles) {
            const path = normalizePath(file.webkitRelativePath || file.name);
            // Check full path ending
            if (path.endsWith(targetName)) {
                // Ensure strict suffix match (preceded by slash or start of string)
                const index = path.lastIndexOf(targetName);
                if (index === 0 || path[index - 1] === '/') {
                    return file;
                }
            }
            // Check filename ending (exact match only if just filename requested)
            if (path.endsWith('/' + filenameOnly) || path === filenameOnly) {
                return file;
            }
        }
        return undefined;
    };

    const readJson = async (targetName: string): Promise<any> => {
        ClientLogger.log(`Read attempt: ${targetName}`);
        const file = findFile(targetName);
        if (!file) {
            ClientLogger.log(`❌ File not found: ${targetName}`);
            return null;
        }

        ClientLogger.log(`✅ Found file: ${file.webkitRelativePath || file.name}`);
        try {
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            ClientLogger.log(`❌ Error parsing ${targetName}: ${e}`);
            return null;
        }
    };

    // --- Profile ---
    // Try multiple files and structures for profile info
    const profileJsonFiles = [
        'personal_information.json',
        'profile.json',
        'personal_info.json',
        'account_information.json',
        'account_info.json',
        'profile_information.json',
        'professional_information.json'
    ];

    let profileData = null;

    // 1. Try exact/suffix match via readJson
    for (const fileName of profileJsonFiles) {
        profileData = await readJson(fileName);
        if (profileData) break;
    }

    // 2. Try partial match if nothing found
    if (!profileData) {
        const anyProfileFile = allFiles.find(f =>
            (f.name.includes('personal_information') || f.name.includes('profile_information')) &&
            f.name.endsWith('.json')
        );
        if (anyProfileFile) {
            ClientLogger.log(`Found profile info via heuristic: ${anyProfileFile.webkitRelativePath}`);
            try {
                const text = await anyProfileFile.text();
                profileData = JSON.parse(text);
            } catch (e) { }
        }
    }

    profileData = profileData || {};

    // --- Profile Photo Detection ---
    let profilePicUrl = '';

    // Check various nested structures in profileData
    const mapDataEntry = profileData?.['profile_user']?.[0]?.['media_map_data'];
    if (mapDataEntry) {
        profilePicUrl = mapDataEntry['Profile Photo']?.['uri'] ||
            mapDataEntry['Profile photo']?.['uri'] ||
            mapDataEntry['Profile Picture']?.['uri'] ||
            mapDataEntry['profile_photo']?.['uri'];
    }

    if (!profilePicUrl) {
        // Search specifically in profile_photos.json
        const profilePhotosData = await readJson('profile_photos.json') || await readJson('media/profile_photos.json');
        if (profilePhotosData) {
            ClientLogger.log(`profile_photos.json structure: ${JSON.stringify(Object.keys(profilePhotosData)).substring(0, 200)}`);

            // Try different key variations
            const photos = profilePhotosData.media ||
                profilePhotosData.ig_profile_photos ||
                profilePhotosData.ig_profile_picture ||  // SINGULAR!
                profilePhotosData.profile_photos ||
                (Array.isArray(profilePhotosData) ? profilePhotosData : []);

            ClientLogger.log(`Found ${Array.isArray(photos) ? photos.length : (photos ? 1 : 0)} photos in profile_photos.json`);

            if (Array.isArray(photos) && photos.length > 0) {
                ClientLogger.log(`First photo structure: ${JSON.stringify(photos[0]).substring(0, 200)}`);
                profilePicUrl = photos[0].uri || photos[0].media?.uri || (typeof photos[0] === 'string' ? photos[0] : '');
                ClientLogger.log(`Extracted profile pic URI: ${profilePicUrl}`);
            } else if (photos && !Array.isArray(photos)) {
                // It's a single object, not an array
                ClientLogger.log(`Single photo object: ${JSON.stringify(photos).substring(0, 200)}`);
                profilePicUrl = photos.uri || photos.media?.uri || (typeof photos === 'string' ? photos : '');
                ClientLogger.log(`Extracted profile pic URI from object: ${profilePicUrl}`);
            }
        }
    }

    // Heuristic: Check for any image file in media/profile folder
    if (!profilePicUrl || profilePicUrl.toLowerCase().endsWith('.json')) {
        const potentialProfilePics = allFiles.filter(f => {
            const path = f.webkitRelativePath.toLowerCase();
            return (path.includes('media/profile/') ||
                path.includes('profile_photo') ||
                f.name.toLowerCase().includes('profile_pic') ||
                f.name.toLowerCase().includes('avatar')) &&
                f.name.match(/\.(jpg|jpeg|png|webp)$/i); // MUST BE AN IMAGE
        });

        if (potentialProfilePics.length > 0) {
            // Sort to prefer files that aren't stickers or interactive elements
            const bestPic = potentialProfilePics.find(f => !f.name.toLowerCase().includes('sticker') && !f.name.toLowerCase().includes('interactive')) || potentialProfilePics[0];
            profilePicUrl = bestPic.webkitRelativePath || bestPic.name;
            ClientLogger.log(`Heuristic profile pic: ${profilePicUrl}`);
        }
    }

    // --- Username Detection --- 
    let username = 'Unknown';
    let fullName = '';
    let bio = '';

    // Strategy 1: Nested map
    const stringMap = profileData?.['profile_user']?.[0]?.['string_map_data'];
    if (stringMap) {
        username = stringMap['Username']?.['value'] || stringMap['username']?.['value'] || 'Unknown';
        fullName = stringMap['Name']?.['value'] || stringMap['full_name']?.['value'] || '';
        bio = stringMap['Bio']?.['value'] || stringMap['biography']?.['value'] || '';
    }

    // Strategy 2: Top level keys
    if (username === 'Unknown') {
        username = profileData?.username ||
            profileData?.user_name ||
            profileData?.['profile_user']?.[0]?.username ||
            'Unknown';
    }
    if (!fullName) {
        fullName = profileData?.full_name ||
            profileData?.name ||
            profileData?.['profile_user']?.[0]?.full_name ||
            '';
    }
    if (!bio) {
        bio = profileData?.biography || profileData?.bio || '';
    }

    // Strategy 3: Search for username in ANY JSON if still unknown
    if (username === 'Unknown') {
        const potentialFiles = ['account_information.json', 'account_info.json', 'professional_information.json'];
        for (const cf of potentialFiles) {
            const data = await readJson(cf);
            if (data) {
                username = data.username || data.user_name || data['profile_user']?.[0]?.username || 'Unknown';
                if (username !== 'Unknown') break;
            }
        }
    }

    // Strategy 4: Extract from folder name (e.g., "instagram-USERNAME-2025-12-25-xxx")
    if (username === 'Unknown' && allFiles.length > 0) {
        const firstFile = allFiles[0];
        const path = firstFile.webkitRelativePath || firstFile.name;
        const match = path.match(/instagram-([^-/]+)-\d{4}-\d{2}-\d{2}/i);
        if (match && match[1]) {
            username = match[1];
            ClientLogger.log(`Extracted username from folder name: ${username}`);
        }
    }

    ClientLogger.log(`Profile Resolved -> User: ${username}, Pic: ${profilePicUrl || 'None'}`);

    const profile: Profile = {
        username: decodeInstagramString(username),
        biography: decodeInstagramString(bio),
        full_name: decodeInstagramString(fullName),
        profile_pic_url: profilePicUrl
    };

    // --- Media ---
    let media: MediaItem[] = [];

    // Helper to flatten post containers into media items
    const processPostContainer = (posts: any[]): MediaItem[] => {
        return posts.map(post => {
            // Check if this is a container with 'media' array (Carousel)
            if (post.media && Array.isArray(post.media)) {
                // It's a carousel!
                // Use the first item as the main thumbnail/entry
                const children = post.media.map((child: any) => ({
                    uri: child.uri,
                    creation_timestamp: child.creation_timestamp || post.creation_timestamp,
                    title: decodeInstagramString(child.title || post.title || ''),
                    is_archived: post.is_archived,
                    is_video: child.uri?.toLowerCase().endsWith('.mp4') || child.uri?.toLowerCase().endsWith('.mov')
                }));

                return {
                    uri: children[0].uri, // Thumbnail is first item
                    creation_timestamp: post.creation_timestamp || children[0].creation_timestamp,
                    title: decodeInstagramString(post.title || ''),
                    is_archived: post.is_archived,
                    is_video: children[0].is_video,
                    carousel_media: children // Store all slides
                };
            }
            // Otherwise assume it's a direct media item (legacy or flat structure)
            const isVideo = post.uri?.toLowerCase().endsWith('.mp4') || post.uri?.toLowerCase().endsWith('.mov');
            return {
                uri: post.uri,
                creation_timestamp: post.creation_timestamp,
                title: decodeInstagramString(post.title || ''),
                is_archived: post.is_archived,
                is_video: isVideo
            };
        });
    };

    // 1. Check content.json (often contains everything in new exports)
    const contentData = await readJson('content.json');
    if (contentData) {
        ClientLogger.log('Parsing content.json');
        let rawContent: any[] = [];
        if (Array.isArray(contentData)) {
            // Heuristic detection of container vs flat
            // If first item has 'media' key, treat as list of containers
            if (contentData.length > 0 && contentData[0].media) {
                rawContent = contentData;
            } else {
                rawContent = contentData;
            }
        } else if (contentData.media) {
            rawContent = contentData.media;
        }
        media = processPostContainer(rawContent);
    }

    // 2. Check posts_1.json, posts_2.json
    if (media.length === 0) {
        const postsData = await readJson('posts_1.json');
        if (postsData) {
            const rawPosts = Array.isArray(postsData) ? postsData : (postsData.media || []);
            media = processPostContainer(rawPosts);
        }
    }

    // --- Archived Posts ---
    ClientLogger.log('Looking for archived posts...');
    const archivedData = await readJson('archived_posts.json');
    if (archivedData) {
        ClientLogger.log(`Archived data found. Keys: ${Object.keys(archivedData).join(', ')}`);

        let rawArchived: any[] = [];

        if (Array.isArray(archivedData)) {
            rawArchived = archivedData;
        } else if (archivedData.ig_archived_posts) {
            rawArchived = archivedData.ig_archived_posts;
        } else if (archivedData.ig_archived_post_media) {
            rawArchived = archivedData.ig_archived_post_media;
        } else if (archivedData.media) {
            rawArchived = archivedData.media;
        } else if (archivedData.archived_posts) {
            rawArchived = archivedData.archived_posts;
        }

        if (rawArchived.length > 0) {
            ClientLogger.log(`Found ${rawArchived.length} archived posts.`);
            // Mark raw items as archived so helper picks it up
            const markedArchived = rawArchived.map((p: any) => ({ ...p, is_archived: true }));
            const flattenedArchived = processPostContainer(markedArchived);
            media = [...media, ...flattenedArchived];
        } else {
            ClientLogger.log('Archived array was empty.');
        }
    }

    // --- Stories ---
    const storiesData = await readJson('stories.json');
    let stories: StoryItem[] = [];
    if (storiesData) {
        const rawStories = storiesData.ig_stories || (Array.isArray(storiesData) ? storiesData : []);
        stories = rawStories.map((s: any) => ({
            uri: s.uri,
            creation_timestamp: s.creation_timestamp,
            title: decodeInstagramString(s.title || ''),
            is_video: s.uri?.toLowerCase().endsWith('.mp4') || s.uri?.toLowerCase().endsWith('.mov')
        }));
    }

    // --- Followers / Following ---
    const followersData = await readJson('followers_1.json') || await readJson('followers.json');
    const followers: Connection[] = (followersData || []).map((f: any) => ({
        href: f.string_list_data?.[0]?.href || '',
        value: f.string_list_data?.[0]?.value || '',
        timestamp: f.string_list_data?.[0]?.timestamp || 0
    }));

    const followingData = await readJson('following.json');
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
        stories,
        followers,
        following,
    };
}

export function createBlobUrlMap(files: FileList): Map<string, string> {
    const map = new Map<string, string>();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        let fileToUse = file;

        // Fix for missing MIME types in some environments (e.g. online/production)
        // Browsers like Safari can be picky if the Blob URL doesn't have a correct video MIME type
        if (!file.type || file.type === '') {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'mp4') {
                fileToUse = new File([file], file.name, { type: 'video/mp4' });
            } else if (ext === 'mov') {
                fileToUse = new File([file], file.name, { type: 'video/quicktime' });
            }
        }

        const url = URL.createObjectURL(fileToUse);

        // Use lowercase for case-insensitive lookup
        map.set(file.name.toLowerCase(), url);

        // Relative path Suffix Mapping
        const fullPath = normalizePath(file.webkitRelativePath);
        const parts = fullPath.split('/');

        // Generate all valid suffix paths
        let currentPath = "";
        for (let j = parts.length - 1; j > 0; j--) {
            if (currentPath === "") {
                currentPath = parts[j];
            } else {
                currentPath = `${parts[j]}/${currentPath}`;
            }
            map.set(currentPath.toLowerCase(), url);
        }
    }
    return map;
}
