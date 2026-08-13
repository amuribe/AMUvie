import { useLoaderData, useNavigate } from "react-router";
import type { ToWatchListEntity, UserMovieData, CompletedWatchListEntity, MovieWithMetadata } from "../../types/types";
import './MovieDetails.css';
// The movie details loader
import { loader } from "./loader";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth";
import { apiRequest } from "../../utils/api";

export default function MovieDetails() {
    const movie = useLoaderData<typeof loader>() as MovieWithMetadata;
    const navigate = useNavigate();
    const { apiKey } = useAuth();

    const [imageError, setImageError] = useState<boolean>(false);

    // User data for the current movie
    const [userData, setUserData] = useState<UserMovieData>({
        onToWatchlist: false,
        onCompleted: false
    });

    useEffect(() => {
        // User must be authorized
        if (!apiKey) {
            return;
        }

        const fetchUserStats = async () => {
            try {
                // Use Promise.all to fetch from to-watch and completed in parallel
                // Destructure each to array
                const [toWatchData, completedData] = await Promise.all([
                    // to-watch fetch
                    apiRequest<ToWatchListEntity[]>("/towatchlist/entries", "GET", undefined, apiKey),
                    apiRequest<CompletedWatchListEntity[]>("/completedwatchlist/entries", "GET", undefined, apiKey)
                ]);
                // Search watchlists to see if the current movie appears
                const toWatchEntry = toWatchData.find(entry => entry.movie_id === movie.id);
                const completedEntry = completedData.find(entry => entry.movie_id === movie.id);

                setUserData({
                    onToWatchlist: Boolean(toWatchEntry),
                    toWatchData: toWatchEntry,
                    onCompleted: Boolean(completedEntry),
                    completedData: completedEntry
                });
            } catch {
                console.error("Failed to load user stats")
            }
        };

        fetchUserStats();
    }, [apiKey, movie.id]);


    // TODO: Fetch user watchlist data assosciated with the movie

    /*
    const handleAddToWatchlist = async () => {
        // TODO:  POST /towatchlist/entries
    };

    const handleAddToCompleted = async () => {
        // TODO: POST /completedwatchlist/entries
    };
    */

    return (

        <div className="detail-container">
            <div className="detail-content">
                {/* Conditionally render each optional component */}
                {/* Render movie poster fallback to title if img does not exist or could not be accessed */}
                <div className="poster-column">
                    <div className="movie-poster-container-large">
                        {/* Go back to the previous page */}
                        <button className="back-button" onClick={() => navigate(-1)}>⬅️ Back</button>
                        {movie.poster && !imageError ? (
                            <img
                                src={movie.poster}
                                alt={`${movie.title} poster`}
                                className="movie-poster-large"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="movie-poster-fallback-large">
                                {/* Poster failed to load or is not provided, display movie title in place instead */}
                                <span>{movie.title}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="detail-info">
                    <h2>{movie.title}</h2>
                    {movie.tagline && <p className="tagline">{movie.tagline}</p>}
                    <div className="metadata-row">
                        <div className="ratings">
                            <span>{Number(movie.vote_average).toFixed(1)}</span>
                            <span>⭐</span>
                            <span>{movie.vote_count} ratings</span>
                        </div>
                        {movie.runtime && (
                            <span>{movie.runtime} min</span>
                        )}
                        {movie.release_date && (
                            <span>Released: {new Date(movie.release_date).toLocaleDateString()}</span>
                        )}
                    </div>
                    {movie.overview && (
                        <div className="movie-section">
                            <h3>Overview</h3>
                            <p>{movie.overview}</p>
                        </div>
                    )}
                    {movie.genres.length > 0 && (
                        <div className="movie-section">
                            <h3>Genres</h3>
                            <div className="pill-container">
                                {movie.genres.map(genre => (
                                    <span
                                        key={genre.id}
                                        className="pill"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {movie.production_companies.length > 0 && (
                        <div className="movie-section">
                            <h3>Production Companies</h3>
                            <div className="pill-container">
                                {movie.production_companies.map(company => (
                                    <span
                                        key={company.id}
                                        className="pill"
                                    >
                                        {company.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* User Stats */}
                    {apiKey && (
                        <div className="user-stats-section">
                            <h3>Your Activity</h3>
                            {userData.onToWatchlist && userData.toWatchData && (
                                <div className="stat-info">
                                    <p><strong>Status:</strong> In To-Watch List</p>
                                    <p><strong>Priority:</strong> {userData.toWatchData.priority}</p>
                                </div>
                            )}
                            {userData.onCompleted && userData.completedData && (
                                <div className="stat-info">
                                    <p><strong>Status:</strong> Watched
                                        {` ${userData.completedData.times_watched}`}
                                        {userData.completedData.times_watched === 1 ? " Time" : " Times"}
                                    </p>
                                    <p><strong>Your Rating:</strong> ⭐ {userData.completedData.rating}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* TODO: Watchlist actions */}
                </div>
            </div >
        </div>
    )

}