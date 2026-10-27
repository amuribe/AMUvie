import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth"
import type { CompletedWatchListEntryWithMovie, DropdownOption } from "../types/types";
import { apiRequest } from "../utils/api";
import WatchListCard from "../components/WatchListCard";
import { Dropdown } from "../components/Dropdown";

export default function CompletedWatchList() {
    // Ensure user is authorized
    const { apiKey } = useAuth();

    const [watchlist, setWatchList] = useState<CompletedWatchListEntryWithMovie[]>([])
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    // Defult sort by last watched
    const [sortBy, setSortBy] = useState<string>("date_desc");

    const sortOptions: DropdownOption[] = [
        { label: "Highest Rating", value: "rating_desc" },
        { label: "Lowest Rating", value: "rating_asc" },
        { label: "Recently Watched", value: "date_desc" },
        { label: "Oldest Watched", value: "date_asc" },

    ];

    // Automatically sort when watchlist data or sortBy value changes
    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) => {
            if (sortBy === "rating_desc") {
                return (b.rating || 0) - (a.rating || 0);
            }
            if (sortBy === "rating_asc") {
                return (a.rating || 0) - (b.rating || 0);
            }
            if (sortBy === "date_desc") {
                return new Date(b.date_last_watched || 0).getTime() - new Date(a.date_last_watched || 0).getTime();
            }
            if (sortBy === "date_asc") {
                return new Date(a.date_last_watched || 0).getTime() - new Date(b.date_last_watched || 0).getTime();
            }
            return 0;
        });
    }, [watchlist, sortBy]);

    // Fetch the entries in the user's to-watch list
    useEffect(() => {
        const fetchCompletedWatchList = async () => {
            // User must be authorized
            if (!apiKey) {
                setLoading(false);
                return;
            }

            try {

                // Fetch the watchlist entries 
                const data = await apiRequest<CompletedWatchListEntryWithMovie[]>(
                    // Use the detailed query param for movie data
                    "/completedwatchlist/entries/?detailed=true",
                    "GET",
                    undefined, // Empty request body
                    apiKey
                );
                setWatchList(data);
            } catch {
                setError("Failed to load user's completed watch list")
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedWatchList();
    }, [apiKey]);

    // Set a timeout for success messages
    useEffect(() => {

        // Only set timeout when there is a message
        if(!successMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage])

    const handleDelete = async (entryId: number) => {
        if (!apiKey) {
            setError("Not authorized");
            return;
        }

        // In case of rollback
        const prevWatchlist = watchlist;

        try {
            // Clear prev errors
            setError(null);
            setSuccessMessage(null);
            await apiRequest<void>(
                `/completedwatchlist/entries/${entryId}`,
                "DELETE",
                undefined,
                apiKey
            );
            //     Update the watchlist state to filter out the entry which was just deleted
            setWatchList((current) =>
                current.filter((entry) => entry.id !== entryId)
            );

            setSuccessMessage("Removed entry from completed watchlist");
        } catch {
            // Roll back
            setWatchList(prevWatchlist);
            setError("Failed to delete an entry from a user's completed watch list")
        }
    };

    const handleIncrementWatched = async (entryId: number, currentTimesWatched: number) => {
        if (!apiKey) {
            setError("Not Authorized");
            return;
        }

        const prevWatchlist = watchlist;
        const newTimesWatched = currentTimesWatched + 1;

        // Update state
        setWatchList((current) =>
            current.map((e) =>
                e.id === entryId ? { ...e, times_watched: newTimesWatched, date_last_watched: new Date().toISOString().split("T")[0], } : e
            )
        );

        try {
            // Clear previous status
            setError(null);
            setSuccessMessage(null);

            await apiRequest<void>(
                `/completedwatchlist/entries/${entryId}/times-watched`,
                "PATCH",
                {
                    times_watched: newTimesWatched,
                    date_last_watched: new Date().toISOString().split("T")[0]
                },
                apiKey
            );
            setSuccessMessage("Watched again");
        } catch {
            setWatchList(prevWatchlist);
            setError("Failed to update watch count")

        }

    };

    // If loading wait till it is complete to show watchlist
    if (loading) {
        return <div className="container">Loading...</div>;
    }
    return (
        <div className="completedwatchlist-container">
            <h1>Completed Watch List</h1>
            <span className="entry-count">{watchlist.length} movies</span>
            <Dropdown
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
            />

            {/* // If there is a status render it */}
            {error && <div className="error-message">{error}</div>}
            {successMessage && (
                <div className="success-message" role="status" aria-live="polite">{successMessage}</div>
            )}

            <div className="completedwatchlist-content">
                <div className="completedwatchlist-entries">
                    {/* Render each entry as a card, map over the sorted watchlist */}
                    {sortedWatchlist.map((entry) => (
                        <WatchListCard
                            key={entry.id}
                            listType="completedwatch"
                            entry={entry}
                            onDelete={handleDelete}
                            onIncrementWatched={handleIncrementWatched}
                        />
                    ))}

                </div>

            </div>
        </div>
    );
}