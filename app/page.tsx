'use client';

import React, { useState } from 'react';
import ProfileHeader from '../components/ProfileHeader';
import Stats from '../components/Stats';
import MediaGrid from '../components/MediaGrid';
import FileUpload from '../components/FileUpload';
import DebugInfo from '../components/DebugInfo';
import { InstagramData } from '../lib/types';

export default function Home() {
  const [data, setData] = useState<InstagramData | null>(null);
  const [blobMap, setBlobMap] = useState<Map<string, string> | null>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);

  const handleDataLoaded = (loadedData: InstagramData, blobs: Map<string, string>, fileList: FileList) => {
    setData(loadedData);
    setBlobMap(blobs);
    setFiles(fileList);
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-white pb-10 flex items-center justify-center">
        <FileUpload onDataLoaded={handleDataLoaded} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto pb-10">
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setData(null)}
            className="text-sm text-gray-500 hover:text-black"
          >
            Upload Different Folder
          </button>
        </div>
        <ProfileHeader profile={data.profile} blobMap={blobMap || undefined} />
        <Stats
          postsCount={data.media.filter(m => !m.is_archived).length}
          followersCount={data.followers.length}
          followingCount={data.following.length}
        />
        <MediaGrid media={data.media} stories={data.stories} blobMap={blobMap || undefined} />
        <DebugInfo data={data} blobMap={blobMap || new Map()} files={files} />
      </div>
    </main>
  );
}
