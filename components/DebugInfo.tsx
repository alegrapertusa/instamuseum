import React, { useState } from 'react';
import { InstagramData } from '../lib/types';
import { ClientLogger } from '../lib/logger';

interface DebugInfoProps {
    data: InstagramData;
    blobMap: Map<string, string>;
    files?: FileList;
}

export default function DebugInfo({ data, blobMap, files }: DebugInfoProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-full text-xs opacity-75 hover:opacity-100 z-50"
            >
                Debug Info
            </button>
        );
    }

    const mediaSample = data.media.slice(0, 3).map(m => ({ uri: m.uri, archived: m.is_archived }));
    const archivedSample = data.media.filter(m => m.is_archived).slice(0, 3);

    // Get sample keys from blobMap
    const blobKeys = Array.from(blobMap.keys()).slice(0, 10);

    // Get filenames
    const fileNames = files ? Array.from(files).map(f => f.webkitRelativePath || f.name).slice(0, 10) : [];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 p-8 overflow-auto text-left font-mono text-xs">
            <div className="bg-white p-6 rounded-lg max-w-4xl mx-auto shadow-xl text-black">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Debug Information</h2>
                    <button onClick={() => setIsOpen(false)} className="text-red-500 font-bold px-3 py-1 border border-red-200 rounded">Close</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-bold mb-2">Parsed Data Stats</h3>
                        <p>Total Media: {data.media.length}</p>
                        <p>Archived Found: {data.media.filter(m => m.is_archived).length}</p>
                        <p>Stories Found: {data.stories.length}</p>
                        <p>Profile: {data.profile.username}</p>
                    </div>

                    <div className="border p-4 rounded bg-gray-50">
                        <h3 className="font-bold mb-2">Map Stats</h3>
                        <p>Blob Map Entries: {blobMap.size}</p>
                        <p>Files Detected: {files?.length || 0}</p>
                    </div>
                </div>

                <div className="mt-4 border p-4 rounded bg-gray-50">
                    <h3 className="font-bold mb-2 text-blue-600">Sample Media URIs (from JSON)</h3>
                    <pre className="bg-gray-100 p-2 overflow-x-auto">
                        {JSON.stringify(mediaSample, null, 2)}
                    </pre>
                </div>

                <div className="mt-4 border p-4 rounded bg-gray-50">
                    <h3 className="font-bold mb-2 text-green-600">Sample Blob Keys (Generated from Files)</h3>
                    <p className="text-gray-500 mb-2">The app looks for these keys to match the URIs above.</p>
                    <pre className="bg-gray-100 p-2 overflow-x-auto">
                        {JSON.stringify(blobKeys, null, 2)}
                    </pre>
                </div>

                <div className="mt-4 border p-4 rounded bg-gray-50">
                    <h3 className="font-bold mb-2 text-purple-600">Actual File Paths Detected</h3>
                    <pre className="bg-gray-100 p-2 overflow-x-auto">
                        {JSON.stringify(fileNames, null, 2)}
                    </pre>
                </div>

                <div className="mt-4 border p-4 rounded bg-gray-50">
                    <h3 className="font-bold mb-2 text-orange-600">Archived Debug</h3>
                    <pre className="bg-gray-100 p-2 overflow-x-auto">
                        {archivedSample.length === 0 ? "No archived posts found in parsed data." : JSON.stringify(archivedSample, null, 2)}
                    </pre>
                </div>

                <div className="mt-4 border p-4 rounded bg-gray-50 border-red-500">
                    <h3 className="font-bold mb-2 text-red-600">Parser Logs (Latest)</h3>
                    <div className="bg-gray-900 text-green-400 p-2 overflow-x-auto h-48 text-xs font-mono">
                        {ClientLogger.getLogs().map((log, i) => (
                            <div key={i} className="whitespace-pre-wrap">{log}</div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

