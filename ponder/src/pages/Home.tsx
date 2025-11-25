import { useState } from 'react';
import { Globe, Languages, Sparkles, FileText, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ponder' | 'chat'>('ponder');
    const [isUploading, setIsUploading] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            {/* Loading Overlay */}
            {isUploading && <LoadingOverlay message="Uploading and processing PDF..." />}

            {/* Hero Section */}
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 mb-12 text-center">
                Hi fishy. Ready to Dive Into Knowledge?
            </h1>

            {/* Main Input Container */}
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('ponder')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'ponder' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Ponder
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Chat
                    </button>
                </div>

                {/* Input Area */}
                <div className="p-4">
                    <textarea
                        placeholder="What do you want to explore today?"
                        className="w-full h-32 resize-none outline-none text-lg text-gray-700 placeholder-gray-400 font-light"
                    />

                    {/* Tools */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center space-x-2">
                            <button className="flex items-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-sm transition-colors">
                                <Globe size={16} className="mr-2" />
                                Web Search
                            </button>
                            <button className="flex items-center px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-sm transition-colors">
                                <Languages size={16} className="mr-2" />
                                Language
                            </button>
                        </div>
                        <button className="flex items-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                            <Sparkles size={16} className="mr-2" />
                            Deep Think
                        </button>
                    </div>
                </div>
            </div>

            {/* Starter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                <label
                    className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group text-left cursor-pointer"
                >
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setIsUploading(true);
                                try {
                                    // Upload to backend first
                                    const { apiClient } = await import('../services/api');
                                    const { workspaceId } = await apiClient.uploadPDF(file);

                                    // Create new session with workspaceId
                                    const { createSession } = await import('../utils/sessionDB');
                                    const session = await createSession(
                                        file.name,
                                        file,
                                        [],
                                        [],
                                        workspaceId
                                    );

                                    toast.success('PDF processed successfully!');

                                    // Navigate to workspace with session ID
                                    navigate(`/workspace/${session.id}`);
                                } catch (error) {
                                    console.error('Failed to upload PDF or create session:', error);
                                    toast.error(error instanceof Error ? error.message : 'Failed to upload PDF. Please try again.');
                                } finally {
                                    setIsUploading(false);
                                }
                            }
                        }}
                    />
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Start with File</h3>
                        <p className="text-sm text-gray-500">Upload a PDF to analyze</p>
                    </div>
                </label>

                <button
                    className="flex items-center p-4 bg-white rounded-xl border border-gray-200 opacity-60 cursor-not-allowed text-left"
                >
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg mr-4">
                        <PenTool size={24} />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Writing</h3>
                        <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Home;
