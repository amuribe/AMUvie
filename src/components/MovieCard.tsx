import { useNavigate } from "react-router";
import type { MovieListItem } from "../types/types";
import './styles/MovieCard.css'
import { type MouseEvent, useState } from "react";
import { useAuth } from "../context/auth";
import { apiRequest } from "../utils/api";
import { useToast } from "../context/toast";

export interface MovieCardProps {
    movie: MovieListItem;
    onWatchlistChange?: () => void;
}

export default function MovieCard({ movie, onWatchlistChange }: MovieCardProps) {
    // Tracks if the movie poster is not provided or could not be loaded
    const [imageError, setImageError] = useState<boolean>(false);
    // Actions such as quick-add, edit entry, etc
    // State for if you're currently adding a movie to the watchlist
    const [adding, setAdding] = useState<boolean>(false);

    // Used to navigate the the movie's page
    const navigate = useNavigate();
    const { apiKey, userId } = useAuth();
    const { showToast } = useToast();

    // The logic for the quick add buttons, movie destination depends on listName
    const addEntry = async (e:MouseEvent, endpoint: string, body: Record<string, unknown>, listName: string) => {
        // Prevent navigation to movie details page
        e.stopPropagation();

        if (!apiKey || !userId) {
            showToast("You must be logged in to do this", "error");
            return;
        }

        setAdding(true);

        try {
            await apiRequest(endpoint, "POST", body, apiKey);
            showToast(`"${movie.title}" added to ${listName}.`);
            onWatchlistChange?.();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to add to watchlist", "error");
            
        } finally {
            setAdding(false);
        }
    };




    // Add entry to the user's to-watch list
    const handleAddToWatchlist = async (e: MouseEvent) => {
        addEntry(e, "/towatchlist/entries", { movie_id: movie.id, priority: 5, notes: ""}, "To-Watch List");
    }

    // Add entry to the user's completed watchlist with no rating and defaults
    const handleAddToCompletedWatchList = async (e: MouseEvent) => {
        addEntry(e, "/completedwatchlist/entries", { movie_id: movie.id, rating: 0 }, "Completed Watchlist");
    }


    return (
        // Make the card redirect you to the movie's detail page when clicked
        <div className="card movie-card">
            {/* The poster for the movie, falls back to plain text if the movie has no poster (image error is true) */}
            <div className="movie-poster-container" onClick={() => navigate(`/movies/${movie.id}`)}>
                {movie.poster && !imageError ? (
                    <img
                        src={movie.poster}
                        alt={`${movie.title} poster`}
                        className="movie-poster"
                        // Set error true, render fallback
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="movie-poster-fallback">
                        {/* Poster failed to load or is not provided, display movie title in place instead */}
                        <span>{movie.title}</span>
                    </div>
                )}
            </div>
            {/* CSS handles when to show actions, user must be authorized for them to render though */}
            {userId && (
                <div className="movie-card-actions">
                    <button
                        className="quick-add-btn"
                        onClick={handleAddToWatchlist}
                        disabled={adding}
                        title="Add to To-Watch List"
                    >
                        ➕
                    </button>
                    <button
                        className="quick-add-btn"
                        onClick={handleAddToCompletedWatchList}
                        disabled={adding}
                        title="Add to Completed Watch List"
                    >
                        👁️
                    </button>
                </div>
            )}

            <div className="movie-details">
                <h3 className="movie-title">
                    {movie.title}
                </h3>
                <div className="movie-rating">
                    {/* Vote average returned from api as string so cast to number in order to round*/}
                    <span>{Number(movie.vote_average).toFixed(1)}</span>
                    <span>⭐</span>
                </div>
            </div>
        </div>
    );
}