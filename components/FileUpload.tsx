import React, { useState } from 'react';
import { InstagramData } from '../lib/types';
import { parseInstagramData, createBlobUrlMap } from '../lib/client-data';

interface FileUploadProps {
    onDataLoaded: (data: InstagramData, blobMap: Map<string, string>, files: FileList) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const data = await parseInstagramData(files);
            const blobMap = createBlobUrlMap(files);

            if (!data.profile.username && data.media.length === 0) {
                setError("Could not parse Instagram data. Please ensure you selected the root folder of your export.");
                setLoading(false);
                return;
            }

            onDataLoaded(data, blobMap, files);
        } catch (err) {
            console.error(err);
            setError("Failed to parse data files.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-4">Upload Instagram Data</h2>
                <p className="text-gray-600 mb-8">
                    Select your downloaded Instagram data folder to visualize it.
                    Everything is processed in your browser - no data is uploaded to any server.
                </p>

                {loading ? (
                    <div className="text-blue-600 font-semibold">Processing files... this may take a moment.</div>
                ) : (
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        Select Folder
                        <input
                            type="file"
                            className="hidden"
                            // @ts-ignore - webkitdirectory is standard for folder selection but not in standard React types yet
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleFileSelect}
                        />
                    </label>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
