import React from 'react';

interface StatsProps {
    postsCount: number;
    followersCount: number;
    followingCount: number;
}

export default function Stats({ postsCount, followersCount, followingCount }: StatsProps) {
    return (
        <div className="flex justify-center space-x-8 mb-8 border-t border-b border-gray-100 py-4">
            <div className="text-center">
                <span className="font-bold block">{postsCount}</span>
                <span className="text-gray-500 text-sm">posts</span>
            </div>
            <div className="text-center">
                <span className="font-bold block">{followersCount}</span>
                <span className="text-gray-500 text-sm">followers</span>
            </div>
            <div className="text-center">
                <span className="font-bold block">{followingCount}</span>
                <span className="text-gray-500 text-sm">following</span>
            </div>
        </div>
    );
}
