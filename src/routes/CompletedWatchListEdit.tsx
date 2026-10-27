import { useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/auth";
import { useEffect, useState, type SubmitEvent } from "react";
import type { EditRouteState, RatingResponse, TimesWatchedResponse, } from "../types/types";
import { apiRequest } from "../utils/api";
import { RATING_OPTIONS } from "../constants/ratingOptions";
import './styles/WatchListEdit.css';
import { Dropdown } from "../components/Dropdown";
import WatchListEditHeader from "../components/WatchListEditHeader";

export default function CompletedWatchlistEdit() {
    // Get the watchlist entry from the search params
    const { id: entryId } = useParams();
    const navigate = useNavigate();
    const { apiKey } = useAuth();


    // Use route state to access the movie assosciated with the entry
    const location = useLocation();
    // Get state from location
    const routeState = location.state as EditRouteState | null;
    const movie = routeState?.movie;
    // State as string for dropdown
    const [rating, setRating] = useState<string>("0.0");
    const [timesWatched, setTimesWatched] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    // A state for when the entry edit is being saved (submitted)
    const [savingRating, setSavingRating] = useState<boolean>(false);
    const [savingTimesWatched, setSavingTimesWatched] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Display if update was successful
    const [successMessage, setSuccessMessage] = useState<string | null>(null);


    // Fetch the entry's rating and times watched 
    useEffect(() => {
        const fetchEntry = async () => {
            if (!apiKey || !entryId) {
                setError(!apiKey ? "You must be logged in to edit an entry." : "Invalid watchlist entry.");
                setLoading(false);
                return;
            }

            try {

                // Fetch both, promise all to ensure both values are fetched properly
                const [ratingData, timesWatchedData] = await Promise.all([
                    apiRequest<RatingResponse>(
                        `/completedwatchlist/entries/${entryId}/rating`,
                        "GET",
                        undefined,
                        apiKey
                    ),
                    apiRequest<TimesWatchedResponse>(
                        `/completedwatchlist/entries/${entryId}/times-watched`,
                        "GET",
                        undefined,
                        apiKey
                    ),
                ]);

                setRating(Number(ratingData.rating).toFixed(1));
                setTimesWatched(timesWatchedData.times_watched);

            } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to load the completed watchlist entry.");
            } finally {
                setLoading(false);
            }
        }
        void fetchEntry();
    }, [apiKey, entryId]);

    const handleUpdateRating = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!apiKey || !entryId) {
            setError("Invalid completed watchlist entry");
            return;
        }

        // Get rating as a number
        const numericRating = Number(rating);
        // Ensure rating is valid (don't quite know how a value other than the dropdown would be provided but might as well leave this if there is one)
        if (numericRating < 0 || numericRating > 10) {
            setError("Rating must be between 0.0 and 10.0");
            return;
        }

        setSavingRating(true);

        try {
            await apiRequest<void>(
                `/completedwatchlist/entries/${entryId}/rating`,
                "PATCH",
                { rating: numericRating },
                apiKey
            );

            setSuccessMessage("Rating updated successfully.");

        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to update the rating.");
        } finally {
            setSavingRating(false);
        }
    };

    // Clear success message after 3 seconds
    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 3000)

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    // Clear error messages after 5 seconds
    useEffect(() => {
        if (!error) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setError(null);
        }, 5000)

        return () => window.clearTimeout(timeoutId);
    }, [error]);

    const handleUpdateTimesWatched = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Clear previous error and success messages
        setError(null);
        setSuccessMessage(null);

        if (!apiKey || !entryId) {
            setError("Invalid completed watchlist entry");
            return;
        }

        // Make sure times watched is valid (whole number)
        if (!Number.isInteger(timesWatched) || timesWatched < 1) {
            setError("Times watched must be a whole number of at least 1");
            return;
        }


        setSavingTimesWatched(true);

        try {
            await apiRequest<void>(
                `/completedwatchlist/entries/${entryId}/times-watched`,
                "PATCH",
                { times_watched: timesWatched },
                apiKey
            );

            setSuccessMessage("Times watched updated successfully");

        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to update times watched.");
        } finally {
            setSavingTimesWatched(false);
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="watchlist-edit-container">
            {/* If there is a status message, render it */}
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message" role="status" aria-live="polite">{successMessage}</div>}

            <WatchListEditHeader
                title={movie?.title ?? "Edit Entry"}
                subtitle="Change the movie's rating or times watched."
                poster={movie?.poster}
            />

            {/* Rating update form */}
            <div className="form-component">
                <form onSubmit={handleUpdateRating} className="watchlist-form-field" noValidate>
                    <div className="watchlist-form-field">
                        <label htmlFor="rating">Rating</label>
                        <Dropdown
                            value={rating}
                            onChange={setRating}
                            options={RATING_OPTIONS}
                        />
                    </div>
                    <div className="watchlist-form-actions">
                        <button
                            type="submit"
                            name="save-rating"
                            className="watchlist-save-button"
                            disabled={savingRating}
                        >
                            {savingRating ? "Saving..." : "Update Rating"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Times watched update form */}
            <div className="form-component">
                <form onSubmit={handleUpdateTimesWatched} className="watchlist-form-field" noValidate>
                    <div className="watchlist-form-field">
                        <label htmlFor="times-watched">Times Watched</label>
                        <input
                            type="number"
                            id="times-watched"
                            name="times-watched"
                            min="1"
                            step="1"
                            value={timesWatched}
                            disabled={savingTimesWatched}
                            onChange={(e) => setTimesWatched(Number(e.target.value))}
                            required
                        />
                        <div className="watchlist-form-actions">
                            <button
                                type="submit"
                                name="save-times-watched"
                                className="watchlist-save-button"
                                disabled={savingTimesWatched}
                            >
                                {savingTimesWatched ? "Saving..." : "Update Times Watched"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            {/* Back button */}
            <div className="watchlist-form-actions">
                <button
                    type="button"
                    className="watchlist-cancel-button"
                    disabled={savingRating || savingTimesWatched}
                    // Redirect to watchlist to cancel
                    onClick={() => navigate("/completedwatchlist")}
                >
                    Return to Watch-List
                </button>
            </div>
        </div >
    );

}