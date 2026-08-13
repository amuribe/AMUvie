import { useState } from 'react';
import './styles/WatchListEditHeader.css';

interface WatchListEditHeaderProps {
    title: string;
    subtitle: string;
    poster?: string | null;
}

export default function WatchListEditHeader({ title, subtitle, poster }: WatchListEditHeaderProps) {
    const [failedPoster, setFailedPoster] = useState<string | null>(null);

    return (
        <header className="watchlist-edit-header">
            <div className="watchlist-edit-poster-container">
                {poster && poster !== failedPoster ? (
                    <img
                        src={poster}
                        alt={`${title} poster`}
                        className="watchlist-edit-poster"
                        onError={() => setFailedPoster(poster)}
                    />
                ) : (
                    <div className="watchlist-edit-poster-fallback">
                        <span>{title}</span>
                    </div>
                )}
            </div>


            <div className="watchlist-edit-header-content">
                <span className="watchlist-edit-label">Editing Entry</span>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
        </header>
    );
}