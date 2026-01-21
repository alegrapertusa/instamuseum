import React, { useState, useEffect, useCallback } from 'react';
import { MediaItem, StoryItem } from '../lib/types';

interface MediaGridProps {
    media: MediaItem[];
    stories: StoryItem[];
    blobMap?: Map<string, string>; // Map of relative paths/filenames to Blob URLs
}

type Tab = 'posts' | 'stories' | 'archived';

export default function MediaGrid({ media, stories, blobMap }: MediaGridProps) {
    const [activeTab, setActiveTab] = useState<Tab>('posts');
    const [lightboxItem, setLightboxItem] = useState<MediaItem | StoryItem | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(36);

    const posts = media.filter(m => !m.is_archived);
    const archived = media.filter(m => m.is_archived);

    // Get the current list of items being displayed
    const currentItems = activeTab === 'posts' ? posts : activeTab === 'archived' ? archived : stories;

    // Reset visible count when tab changes
    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setVisibleCount(36);
    };

    // Helper to resolve src
    const getSrc = (uri: string) => {
        if (blobMap) {
            if (!uri) return '';
            let cleanUri = uri.startsWith('/') ? uri.slice(1) : uri;
            cleanUri = cleanUri.replace(/\\/g, '/');
            try { cleanUri = decodeURIComponent(cleanUri); } catch (e) { }
            cleanUri = cleanUri.toLowerCase();

            if (blobMap.has(cleanUri)) return blobMap.get(cleanUri);
            const filename = cleanUri.split('/').pop();
            if (filename && blobMap.has(filename)) return blobMap.get(filename);
        }
        if (!uri) return '';
        if (!uri.startsWith('http') && !uri.startsWith('/')) {
            return `/data/${uri}`;
        }
        return uri;
    };

    const openLightbox = (item: MediaItem | StoryItem) => {
        setLightboxItem(item);
        setCarouselIndex(0);
    };

    const closeLightbox = useCallback(() => {
        setLightboxItem(null);
        setCarouselIndex(0);
    }, []);

    const nextSlide = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!lightboxItem) return;

        const isCarousel = 'carousel_media' in lightboxItem && lightboxItem.carousel_media && lightboxItem.carousel_media.length > 1;

        if (isCarousel && carouselIndex < lightboxItem.carousel_media!.length - 1) {
            // Move to next slide in carousel
            setCarouselIndex(prev => prev + 1);
        } else {
            // Move to next post in the grid
            const currentIndex = currentItems.indexOf(lightboxItem);
            if (currentIndex < currentItems.length - 1) {
                const nextItem = currentItems[currentIndex + 1];
                setLightboxItem(nextItem);
                setCarouselIndex(0);

                // If it's the last visible item, load more
                if (currentIndex + 1 >= visibleCount - 1) {
                    setVisibleCount(prev => prev + 12);
                }
            }
        }
    }, [lightboxItem, carouselIndex, currentItems, visibleCount]);

    const prevSlide = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!lightboxItem) return;

        const isCarousel = 'carousel_media' in lightboxItem && lightboxItem.carousel_media && lightboxItem.carousel_media.length > 1;

        if (isCarousel && carouselIndex > 0) {
            // Move to previous slide in carousel
            setCarouselIndex(prev => prev - 1);
        } else {
            // Move to previous post in the grid
            const currentIndex = currentItems.indexOf(lightboxItem);
            if (currentIndex > 0) {
                const prevItem = currentItems[currentIndex - 1];
                setLightboxItem(prevItem);

                const prevMedia = prevItem as MediaItem;
                if (prevMedia.carousel_media && prevMedia.carousel_media.length > 1) {
                    setCarouselIndex(prevMedia.carousel_media.length - 1);
                } else {
                    setCarouselIndex(0);
                }
            }
        }
    }, [lightboxItem, carouselIndex, currentItems]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxItem) return;

            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxItem, nextSlide, prevSlide, closeLightbox]);

    const loadMore = () => {
        setVisibleCount(prev => prev + 36);
    };

    const renderGrid = (allItems: (MediaItem | StoryItem)[], isStory: boolean) => {
        if (allItems.length === 0) {
            return <div className="p-8 text-center text-gray-500">No content found.</div>;
        }

        const visibleItems = allItems.slice(0, visibleCount);
        const hasMore = visibleCount < allItems.length;

        return (
            <div className="flex flex-col items-center">
                <div className={`grid ${isStory ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-3'} gap-1 md:gap-4 p-4 w-full`}>
                    {visibleItems.map((item, index) => {
                        const src = getSrc(item.uri);
                        const title = (item as MediaItem).title || (item as StoryItem).title || 'Media';
                        const isCarousel = 'carousel_media' in item && item.carousel_media && item.carousel_media.length > 1;

                        return (
                            <div
                                key={index}
                                className={`relative overflow-hidden bg-gray-100 group cursor-pointer ${isStory ? 'aspect-[9/16]' : 'aspect-square'}`}
                                onClick={() => openLightbox(item)}
                            >
                                {src ? (
                                    item.is_video ? (
                                        <div className="relative w-full h-full">
                                            <video
                                                src={src}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-black/20 backdrop-blur-sm p-2 rounded-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={src}
                                            alt={title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-400">
                                        Missing Media
                                    </div>
                                )}
                                {isCarousel && (
                                    <div className="absolute top-2 right-2 bg-black/50 p-1 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </div>
                                )}
                                {title && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                        <p className="text-white text-xs text-center truncate">{title}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {hasMore && (
                    <button
                        onClick={loadMore}
                        className="mt-8 mb-12 px-8 py-3 bg-white border border-gray-300 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm text-black"
                    >
                        Load More ({allItems.length - visibleCount} remaining)
                    </button>
                )}
            </div>
        );
    };

    // Lightbox Component
    const renderLightbox = () => {
        if (!lightboxItem) return null;

        const isCarousel = 'carousel_media' in lightboxItem && lightboxItem.carousel_media && lightboxItem.carousel_media.length > 1;
        const currentMediaItem = isCarousel
            ? lightboxItem.carousel_media![carouselIndex]
            : lightboxItem;

        const src = getSrc(currentMediaItem.uri);
        const title = (lightboxItem as MediaItem).title || (lightboxItem as StoryItem).title || '';
        const timestamp = new Date(lightboxItem.creation_timestamp * 1000).toLocaleDateString();

        const currentPostIndex = currentItems.indexOf(lightboxItem);
        const hasPrevPost = currentPostIndex > 0 || (isCarousel && carouselIndex > 0);
        const hasNextPost = currentPostIndex < currentItems.length - 1 || (isCarousel && carouselIndex < (lightboxItem.carousel_media?.length || 0) - 1);

        return (
            <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={closeLightbox}>
                <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-50" onClick={closeLightbox}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    {src ? (
                        currentMediaItem.is_video ? (
                            <video src={src} controls className="max-h-[80vh] w-auto object-contain" autoPlay loop playsInline />
                        ) : (
                            <img src={src} alt={title} className="max-h-[80vh] w-auto object-contain" />
                        )
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-gray-800 text-white">Media Not Found</div>
                    )}

                    {hasPrevPost && (
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 p-3 text-white hover:bg-black/70 rounded-r z-40 transition-colors"
                            onClick={prevSlide}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {hasNextPost && (
                        <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-3 text-white hover:bg-black/70 rounded-l z-40 transition-colors"
                            onClick={nextSlide}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {isCarousel && (
                        <div className="absolute bottom-24 flex gap-2">
                            {lightboxItem.carousel_media!.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === carouselIndex ? 'bg-white' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    )}

                    {title && (
                        <div className="mt-4 max-w-2xl w-full text-white bg-black/40 p-4 rounded-xl backdrop-blur-sm max-h-32 overflow-y-auto">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{title}</p>
                            <p className="text-xs text-gray-300 mt-2">{timestamp} • Post {currentPostIndex + 1} of {currentItems.length}</p>
                        </div>
                    )}
                    {!title && (
                        <div className="mt-4 text-center text-white bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                            <p className="text-xs text-gray-400">{timestamp} • Post {currentPostIndex + 1} of {currentItems.length}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8">
            <div className="flex justify-center border-b border-gray-200 mb-4">
                <button
                    onClick={() => handleTabChange('posts')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'posts' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    POSTS <span className="text-xs text-gray-400 ml-1">{posts.length}</span>
                </button>
                <button
                    onClick={() => handleTabChange('archived')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'archived' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    ARCHIVED <span className="text-xs text-gray-400 ml-1">{archived.length}</span>
                </button>
                <button
                    onClick={() => handleTabChange('stories')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'stories' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    STORIES <span className="text-xs text-gray-400 ml-1">{stories.length}</span>
                </button>
            </div>

            {activeTab === 'posts' && renderGrid(posts, false)}
            {activeTab === 'archived' && renderGrid(archived, false)}
            {activeTab === 'stories' && renderGrid(stories, true)}

            {renderLightbox()}
        </div>
    );
}
