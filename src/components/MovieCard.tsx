import { useNavigate } from "react-router";
import type { MovieListItem } from "../types/types";
import './styles/MovieCard.css'
import { type MouseEvent, useState } from "react";
import { useAuth } from "../context/auth";
import { apiRequest } from "../utils/api";

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
    const [error, setError] = useState<string | null>(null);

    // Used to navigate the the movie's page
    const navigate = useNavigate();
    const { apiKey, userId } = useAuth();


    // Add entry to the user's to-watch list
    const handleAddToWatchlist = async (e: MouseEvent) => {
        // Prevent nav to moviedetails 
        e.stopPropagation();

        // Ensure user is authorized
        if (!apiKey || !userId) {
            setError("You must be logged in to do this");
            // Safely return
            return;
        }

        setAdding(true);
        // Clear previous errors if there were any
        setError(null);

        try {
            // For quick add, default priority(5), and empty notes
            await apiRequest(
                "/towatchlist/entries",
                "POST",
                {
                    movie_id: movie.id,
                    priority: 5,
                    notes: ""
                },
                apiKey
            );
            // Stop showing actions
            alert(`"${movie.title}" added to To-Watch list.`);
            onWatchlistChange?.();

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to add to watchlist");
            }
        } finally {
            // Update state to show we're no longer adding
            setAdding(false);
        }
    }

    // Add entry to the user's completed watchlist with no rating and defaults
    const handleAddToCompletedWatchList = async (e: MouseEvent) => {
        // Prevent nav to moviedetails 
        e.stopPropagation();

        // Ensure user is authorized
        if (!apiKey || !userId) {
            setError("You must be logged in to do this");
            // Safely return
            return;
        }

        setAdding(true);
        // Clear previous errors if there were any
        setError(null);

        try {
            // For quick add, default priority(5), and empty notes
            await apiRequest(
                "/completedwatchlist/entries",
                "POST",
                {
                    movie_id: movie.id,
                    rating: 0,
                },
                apiKey
            );
            // Stop showing actions
            alert(`"${movie.title}" added to Completed watch list.`);
            onWatchlistChange?.();

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to add to watchlist");
            }
        } finally {
            // Update state to show we're no longer adding
            setAdding(false);
        }
    }


    return (
        // Make the card redirect you to the movie's detail page when clicked
        <div className="card movie-card">
            // If there is an error render it
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
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