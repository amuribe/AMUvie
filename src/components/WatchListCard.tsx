import { useNavigate } from "react-router";
import type { CompletedWatchListEntryWithMovie, ToWatchListEntryWithMovie } from "../types/types";
import './styles/WatchListCard.css';
import { useState } from "react";

// Type narrowing determines whether the card is for the to-watch list or the completed watchlist

interface WatchCardProps {
    onDelete: (entryId: number) => void;
}

// Props for a card in the to-watch list
interface ToWatchCardProps extends WatchCardProps {
    listType: "towatch";
    entry: ToWatchListEntryWithMovie;
    // Function triggered when priority is updated
    onUpdatePriority: (entryId: number, currentPriority: number, change: number) => void;
    // Function triggered when a movie in the to-watch list has been marked as watched
    onMarkAsWatched: (entry: ToWatchListEntryWithMovie) => void;
}

// Props for a card in the completed watchlist
interface CompletedWatchCardProps extends WatchCardProps {
    listType: "completedwatch";
    entry: CompletedWatchListEntryWithMovie;
    // Triggered when a movie in the completed watchlist has been watched again
    onIncrementWatched?: (entryId: number, currentTimesWatched: number) => void;
}

// The type narrowing union
export type WatchListCardProps = ToWatchCardProps | CompletedWatchCardProps;

export default function WatchListCard(props: WatchListCardProps) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState<boolean>(false);

    // Destructure the base properties shared by an entry in either watchlist
    const { entry, listType, onDelete } = props;
    const movie = entry.movie;

    return (
        <div className="watchlist-card">
            {/* Poster is shared, no type-narrowing */}
            <div
                className="watchlist-poster-container"
                // Go to movie detail page on click
                onClick={() => navigate(`/movies/${entry.movie_id}`)}
            >
                {/* Only render image when it's available, otherwise render fallback */}
                {movie?.poster && !imgError ? (
                    <img
                        src={movie.poster}
                        alt={`${movie.title} poster`}
                        className="watchlist-poster"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="watchlist-poster-fallback">
                        <span>{movie?.title}</span>
                    </div>
                )}
            </div>

            {/* Entry details */}
            <div className="watchlist-details">
                <h2 className="watchlist-title" onClick={() => navigate(`/movies/${entry.movie_id}`)}>
                    {movie?.title}
                </h2>

                {/* Conditional metadata (type narrowing) */}
                {listType === "towatch" ? (
                    <div className="priority-controls">
                        <span className="priority-icon">Priority: {props.entry.priority}</span>
                        {/* To increment or decrement priority */}
                        <div className="priority-arrows">
                            {/* Increment button */}
                            <button
                                onClick={() => props.onUpdatePriority(entry.id, props.entry.priority, 1)}
                                // Make button unclickable when clicking would make priority > 1
                                disabled={props.entry.priority >= 10}
                            >
                                ⬆️
                            </button>
                            {/* Decrement button */}
                            <button
                                onClick={() => props.onUpdatePriority(entry.id, props.entry.priority, -1)}
                                // Make button unclickable when clicking would make priority < 1
                                disabled={props.entry.priority <= 1}
                            >
                                ⬇️
                            </button>
                        </div>
                    </div>

                ) : (
                    // Type narrowed to completed watchlist so display stats specific to completedwatchlist
                    <div className="completed-stats">
                        <p className="stat-marker">⭐ {props.entry.rating} / 10.0</p>
                        <p className="stat-marker"><strong>Times Watched:</strong> {" "} {props.entry.times_watched}x</p>
                        {props.entry.date_first_watched && (
                            <p className="stat-date"><strong>First Watched:</strong> {props.entry.date_first_watched}</p>

                        )}
                        {props.entry.date_last_watched && (
                            <p className="stat-date"><strong>Last Watched: </strong> {props.entry.date_last_watched}</p>

                        )}
                    </div>
                )}
            </div>

            {/* Notes are shared */}
            <div className="watchlist-notes">
                <strong>Notes:</strong>
                <p>{entry.notes || "No notes added for this movie."}</p>
            </div>

            {/* Conditional and shared actions */}

            {/* Mark as watched (to-watch) */}
            <div className="watchlist-actions">
                {listType === "towatch" && (
                    <button onClick={() => props.onMarkAsWatched(props.entry)}>
                        Mark as Watched
                    </button>
                )}

                {listType === "completedwatch" && props.onIncrementWatched && (
                    <button onClick={() => props.onIncrementWatched!(entry.id, props.entry.times_watched)}>
                        Watch Again
                    </button>
                )}



                <button onClick={() =>
                    // Pass the movie information to the edit page through navigate by using its state property
                    navigate(`/${listType}list/edit/${entry.id}`, {
                        state: {
                            movie: entry.movie
                        }
                    })
                }>
                    Edit Entry
                </button>

                <button id="delete-btn" onClick={() => onDelete(entry.id)}>Delete</button>
            </div>
        </div>
    );
}