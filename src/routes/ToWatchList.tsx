import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useAuth } from "../context/auth"
import type { ToWatchListEntryWithMovie, SortDirection, CreateCompletedWatchListRequest } from "../types/types";
import { apiRequest } from "../utils/api";
import WatchListCard from "../components/WatchListCard";
import './styles/ToWatchList.css'
import { Dropdown } from "../components/Dropdown";
import { RATING_OPTIONS } from "../constants/ratingOptions";
import { useToast } from "../context/toast";

export default function ToWatchList() {
    // Ensure user is authorized
    const { apiKey } = useAuth();
    const { showToast } = useToast();

    const [watchlist, setWatchList] = useState<ToWatchListEntryWithMovie[]>([])
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    // Controls the order entries are sorted by priority (desc by default)
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    // An entry being moved to the completed watchlist
    const [entryToComplete, setEntryToComplete] = useState<ToWatchListEntryWithMovie | null>(null)
    // Data for movie being moved
    const [rating, setRating] = useState<string>("0.0");
    // Default to today
    const [dateWatched, setDateWatched] = useState<string>(new Date().toISOString().split("T")[0])
    const [timesWatched, setTimesWatched] = useState<number>(1);
    const [entryIsMoving, setEntryIsMoving] = useState<boolean>(false);




    // Automatically re-sorts whenever watchlist data or sortDirection changes
    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) =>
            sortDirection === "desc"
                ? b.priority - a.priority
                : a.priority - b.priority
        );
    }, [watchlist, sortDirection]);

    // Fetch the entries in the user's to-watch list
    useEffect(() => {
        const fetchToWatchList = async () => {
            // User must be authorized
            if (!apiKey) {
                setLoading(false);
                return;
            }

            try {

                // Fetch the watchlist entries 
                const data = await apiRequest<ToWatchListEntryWithMovie[]>(
                    // Use the detailed query param for movie data
                    "/towatchlist/entries/?detailed=true",
                    "GET",
                    undefined, // Empty request body
                    apiKey
                );
                setWatchList(data);
            } catch {
                setError("Failed to load user's to-watch list")
            }
            finally {
                setLoading(false);
            }
        };

        fetchToWatchList();
    }, [apiKey]);

    const handleDelete = async (entryId: number) => {
        if (!apiKey) {
            showToast("You must be logged in to do this", "error");
            return;
        }

        // For rollbacks if error
        const prevWatchlist = watchlist;
        try {
            await apiRequest<void>(
                `/towatchlist/entries/${entryId}`,
                "DELETE",
                undefined,
                apiKey
            );
            //   Update the watchlist state to filter out the entry which was just deleted
            setWatchList((current) =>
                current.filter((entry) => entry.id !== entryId)
            );

            showToast("Entry was deleted");
        } catch (error) {
            setWatchList(prevWatchlist);
            showToast(error instanceof Error ? error.message : "Failed to delete entry.", "error");
        }

    };

    const handleUpdatePriority = async (
        entryId: number,
        _currentPriority: number,
        change: number
    ) => {
        if (!apiKey) {
            // Clear previous errors
            showToast("You must be logged in to do this", "error");
            return;
        }

        // In case of rollback
        const prevWatchlist = watchlist;

        try {
            // Find the entry in state
            const entry = watchlist.find(e => e.id === entryId);
            // If entry doesn't exist return
            if (!entry) return;


            const newPriority = entry.priority + change;


            // Update state giving entry the new priority
            setWatchList((prev) =>
                prev.map((e) =>
                    e.id === entry.id ? { ...e, priority: newPriority } : e
                )
            );


            // Update the backend
            await apiRequest<Response>(
                `/towatchlist/entries/${entryId}/priority`,
                "PATCH",
                { priority: newPriority },
                apiKey
            );
        } catch (error) {
            // Rollback changes
            setWatchList(prevWatchlist)
            showToast(error instanceof Error ? error.message : "Failed to update priority", "error");
        }
    };

    const closeCompletedForm = () => {
        if (entryIsMoving) {
            return;
        }
        setEntryToComplete(null);
    }
    // Setup the form and scroll up
    const handleMarkAsWatched = (entry: ToWatchListEntryWithMovie) => {
        setEntryToComplete(entry);
        setRating("5.0");
        setDateWatched(new Date().toISOString().split("T")[0])

        // Scroll to top of page to view form
        window.scrollTo({
            top: 0,
            behavior: "auto"
        });
    };


    const handleMoveToCompleted = async (
        event: SubmitEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setError(null);

        if (!apiKey || !entryToComplete) {
            showToast("Invalid watchlist entry.")
            return;
        }

        const numericRating = Number(rating);

        if (numericRating < 0 || numericRating > 10) {
            setError("Rating must be between 0.0 and 10.0");
            return;
        }

        if (!Number.isInteger(timesWatched) || timesWatched < 1) {
            setError("Times watched must be a whole number of at least 1.");
            return;
        }

        if (!dateWatched) {
            setError("Enter the date you watched the movie.");
            return;
        }

        const completedEntry: CreateCompletedWatchListRequest = {
            movie_id: entryToComplete.movie_id,
            rating: numericRating,
            notes: entryToComplete.notes ?? "",
            date_first_watched: dateWatched,
            date_last_watched: dateWatched,
            times_watched: timesWatched
        }

        setEntryIsMoving(true);

        // After updating state try to make changes in back end

        try {
            // Create entry in completed watchlist before deleting
            await apiRequest<void>(
                "/completedwatchlist/entries",
                "POST",
                completedEntry,
                apiKey
            );

            // Now try deleting entry from the to-watch list
            try {
                await apiRequest<void>(
                    `/towatchlist/entries/${entryToComplete.id}`,
                    "DELETE",
                    undefined,
                    apiKey
                );


                // Filter out the movie that was just deleted
                setWatchList((current) => current.filter((entry) => entry.id !== entryToComplete.id));

                showToast(`${entryToComplete.movie?.title ?? "Movie"} was marked as watched.`)
                setEntryToComplete(null);

            } catch (error) {
                showToast(error instanceof Error ? error.message : "Movie added to completed watchlist, but the to-watch list entry could not be removed. Try deleting manually", "error", 6000);
                setEntryToComplete(null);
                return;
            }



        } catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to mark movie as watched.", "error");
        } finally {
            setEntryIsMoving(false);
        }

    };

    // If loading don't render everythin until completed
    if (loading) {
        return <div className="container">Loading...</div>
    }
    return (
        <div className="container">
            <h1>To-Watch List</h1>
            <span className="entry-count">{watchlist.length} movies</span>
            <button
                type="button"
                onClick={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")}
            >
                Priority: {sortDirection === "desc" ? "High to Low" : "Low to High"}
            </button>

            {/* // If there is an error render it */}
            {error && <div className="error-message">{error}</div>}


            {/* If marking entry as complete render the form */}
            {entryToComplete && (
                <section className="mark-watched-panel">
                    <h2>Mark "{entryToComplete.movie?.title ?? "Movie"}" as watched</h2>

                    <form className="mark-watched-form" onSubmit={handleMoveToCompleted} noValidate>

                        <div className="mark-watched-fields">
                            <div className="watchlist-form-field">
                                <label htmlFor="completed-rating">Your Rating</label>
                                <Dropdown
                                    value={rating}
                                    onChange={setRating}
                                    options={RATING_OPTIONS}
                                />
                            </div>
                            <div className="watchlist-form-field">
                                <label htmlFor="times-watched">Times Watched</label>
                                <input
                                    type="number"
                                    id="times-watched"
                                    name="times-watched"
                                    min="1"
                                    step="1"
                                    value={timesWatched}
                                    disabled={entryIsMoving}
                                    onChange={(e) => setTimesWatched(Number(e.target.value))}
                                />
                            </div>

                            <div className="watchlist-form-field">
                                <label htmlFor="date-watched">Date Watched</label>
                                <input
                                    type="date"
                                    id="date-watched"
                                    name="date-watched"
                                    value={dateWatched}
                                    disabled={entryIsMoving}
                                    onChange={(e) => setDateWatched(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mark-watched-help">
                            <p>
                                Existing notes will be copied to the completed entry.
                                You can edit the rating later from the complete watch-list edit page.
                            </p>
                        </div>

                        <div className="watchlist-form-actions">
                            <button
                                type="button"
                                className="watchlist-cancel-button"
                                disabled={entryIsMoving}
                                onClick={closeCompletedForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="watchlist-save-button"
                                disabled={entryIsMoving}
                            >
                                {entryIsMoving ? "Moving..." : "Mark as Watched"}
                            </button>
                        </div>
                    </form>
                </section>
            )}


            <div className="towatchlist-content">
                <div className="towatchlist-entries">
                    {/* Render each entry as a card map over the sorted watchlist*/}
                    {sortedWatchlist.map((entry) => (
                        <WatchListCard
                            key={entry.id}
                            listType="towatch"
                            entry={entry}
                            onDelete={handleDelete}
                            onUpdatePriority={handleUpdatePriority}
                            onMarkAsWatched={handleMarkAsWatched}
                        />
                    ))}

                </div>

            </div>
        </div>
    );
}