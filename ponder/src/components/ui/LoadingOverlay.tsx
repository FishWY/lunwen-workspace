import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
}

const LoadingOverlay = ({ message = "Loading..." }: LoadingOverlayProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[300px]">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                <p className="text-gray-700 font-medium text-center">{message}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
