import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/auth"
import type { CompletedWatchListEntryWithMovie, DropdownOption } from "../types/types";
import { apiRequest } from "../utils/api";
import WatchListCard from "../components/WatchListCard";
import { Dropdown } from "../components/Dropdown";
import { useToast } from "../context/toast";

export default function CompletedWatchList() {
    // Ensure user is authorized
    const { apiKey } = useAuth();

    const { showToast } = useToast();

    const [watchlist, setWatchList] = useState<CompletedWatchListEntryWithMovie[]>([])
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
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


    const handleDelete = async (entryId: number) => {
        if (!apiKey) {
            showToast("You must be logged in to do this.", "error");
            return;
        }

        // In case of rollback
        const prevWatchlist = watchlist;

        try {
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

            showToast("Removed entry from completed watchlist", "success");
        } catch(error) {
            // Roll back
            setWatchList(prevWatchlist);
            showToast(error instanceof Error ? error.message : "Failed to delete entry", "error");
        }
    };

    const handleIncrementWatched = async (entryId: number, currentTimesWatched: number) => {
        if (!apiKey) {
            showToast("You must be logged in to do this", "error");
            return;
        }

        const prevWatchlist = watchlist;
        const newTimesWatched = currentTimesWatched + 1;
        const today = new Date().toISOString().split("T")[0];

        // Update state
        setWatchList((current) =>
            current.map((e) =>
                e.id === entryId ? { ...e, times_watched: newTimesWatched, date_last_watched: today } : e
            )
        );

        try {

            await apiRequest<void>(
                `/completedwatchlist/entries/${entryId}/times-watched`,
                "PATCH",
                {
                    times_watched: newTimesWatched,
                    date_last_watched: today
                },
                apiKey
            );
            showToast("Watched again");
        } catch(error) {
            setWatchList(prevWatchlist);
            showToast(error instanceof Error ? error.message : "Failed to update watch count", "error");
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