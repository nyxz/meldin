export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
            <div className="text-center">
                <div
                    className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                <p className="text-gray-400">Loading ...</p>
            </div>
        </div>
    )
}