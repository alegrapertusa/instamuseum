import React, { useState, useEffect, useRef } from 'react';
import { InstagramData } from '../lib/types';
import { parseInstagramData, createBlobUrlMap } from '../lib/client-data';

interface FileUploadProps {
    onDataLoaded: (data: InstagramData, blobMap: Map<string, string>, files: FileList) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tutorialVisible, setTutorialVisible] = useState(false);
    const tutorialRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTutorialVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (tutorialRef.current) {
            observer.observe(tutorialRef.current);
        }

        return () => observer.disconnect();
    }, []);

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
        <div className="bg-white selection:bg-black selection:text-white">
            {/* HERO / UPLOAD SECTION - Below the fold trigger */}
            <div className="min-h-screen flex flex-col items-center justify-center py-20 px-8 relative overflow-hidden">
                <div className="max-w-3xl w-full z-10">
                    <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <h1 className="text-6xl md:text-7xl font-bold mb-6 text-black tracking-tighter">InstaMuseum</h1>
                        <p className="text-xl md:text-2xl text-gray-500 font-medium tracking-tight">
                            Visualize your Instagram data privately in your browser
                        </p>
                    </header>

                    <section className="animate-in fade-in zoom-in-95 duration-1000 delay-300">
                        <div className="flex flex-col items-center justify-center p-12 md:p-20 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-300 transition-all duration-500 group shadow-sm hover:shadow-md">
                            <div className="text-center max-w-sm">
                                <h2 className="text-3xl font-bold mb-4 text-black tracking-tight">Ready to explore?</h2>
                                <p className="text-gray-500 mb-10 text-lg">
                                    Select your extracted Instagram data folder to begin the journey.
                                </p>

                                {loading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-12 h-12 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
                                        <div className="text-black font-bold tracking-tight">Processing your memories...</div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer bg-black hover:bg-zinc-800 text-white font-bold py-5 px-12 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95 inline-block text-lg">
                                        Select Folder
                                        <input
                                            type="file"
                                            className="hidden"
                                            // @ts-ignore
                                            webkitdirectory=""
                                            directory=""
                                            multiple
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                )}

                                {error && (
                                    <div className="mt-8 p-5 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 font-medium animate-in shake-in duration-500">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10 flex justify-center">
                            <div className="inline-flex items-center px-6 py-3 bg-white border border-gray-100 rounded-full shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-3 animate-pulse"></span>
                                <span className="text-sm font-semibold text-gray-600">
                                    <strong>Privacy First:</strong> No data ever leaves your device.
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* SCROLL INDICATOR */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce duration-1000">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Step-by-step guide below</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2 / 1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* TUTORIAL SECTION - Slide transition */}
            <section
                ref={tutorialRef}
                className={`w-full max-w-4xl mx-auto px-8 py-32 transition-all duration-1000 transform ${tutorialVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                    }`}
            >
                <header className="mb-20 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 tracking-tight text-pretty">How to get your data</h2>
                    <p className="text-gray-500 text-xl max-w-xl mx-auto font-medium">Follow these steps on Instagram to download and prepare your information.</p>
                </header>

                <div className="space-y-24 max-w-2xl mx-auto">
                    {[
                        {
                            num: 1,
                            title: "Go to Instagram",
                            desc: <>Go to <strong>Instagram.com</strong> on your computer (or open the app) and navigate to <strong>Settings → Accounts Centre → Your information and permissions → Export your information</strong></>
                        },
                        {
                            num: 2,
                            title: "Select Custom Information",
                            desc: <>Choose <strong>Export to device</strong>, then select <strong>Custom Information</strong>. To keep it fast, select only these three categories:</>,
                            pills: ["Your Instagram activity → Media", "Personal info → Personal info", "Connections → Followers/following"]
                        },
                        {
                            num: 3,
                            title: "Format & Range",
                            desc: <>Select <strong>JSON format</strong> (do not select HTML) and choose <strong>all time range</strong> to visualize your entire history.</>
                        },
                        {
                            num: 4,
                            title: "Extract and Upload",
                            desc: <>You will receive an email once the export is ready (usually takes a few minutes). Download it, <strong>fully extract the ZIP file</strong>, and then drop the extracted folder into the box above.</>
                        }
                    ].map((step, i) => (
                        <div key={i} className="flex gap-8 md:gap-12 items-start group">
                            <div className="flex-shrink-0 w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                                {step.num}
                            </div>
                            <div className="flex-grow pt-1">
                                <h3 className="text-2xl font-bold text-black mb-3 tracking-tight">{step.title}</h3>
                                <div className="text-lg text-gray-500 leading-relaxed font-medium">{step.desc}</div>
                                {step.pills && (
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        {step.pills.map((pill, j) => (
                                            <div key={j} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center">
                                                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full mr-2" />
                                                {pill}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="mt-32 pt-16 border-t border-gray-100 text-center">
                    <p className="text-gray-400 font-medium text-sm">InstaMuseum — Private Instagram Visualization</p>
                </footer>
            </section>
        </div>
    );
}
