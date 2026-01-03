export interface Profile {
  username: string;
  biography?: string;
  profile_pic_url?: string;
  full_name?: string;
}

export interface MediaItem {
  uri: string;
  creation_timestamp: number;
  media_metadata?: {
    photo_metadata?: {
      exif_data?: [
        {
          latitude?: number;
          longitude?: number;
        }
      ]
    }
  };
  title?: string;
  is_archived?: boolean;
  carousel_media?: MediaItem[]; // For carousels/swipeable posts
}

export interface StoryItem {
  uri: string;
  creation_timestamp: number;
  title?: string;
}

export interface Connection {
  href: string;
  value: string;
  timestamp: number;
}

export interface InstagramData {
  profile: Profile;
  media: MediaItem[];
  stories: StoryItem[]; // New field
  followers: Connection[];
  following: Connection[];
}
