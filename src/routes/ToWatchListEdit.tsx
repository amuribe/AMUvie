import { useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/auth";
import { useEffect, useState, type SubmitEvent } from "react";
import type { EditRouteState, ToWatchListEntity, UpdateToWatchListRequest } from "../types/types";
import { apiRequest } from "../utils/api";
import './styles/WatchListEdit.css';
import WatchListEditHeader from "../components/WatchListEditHeader";
import { useToast } from "../context/toast";

export default function ToWatchListEdit() {
    // Get the watchlist entry from the search params
    const { id: entryId } = useParams();
    const navigate = useNavigate();
    const { apiKey } = useAuth();
    const { showToast } = useToast();

    const [movieId, setMovieId] = useState<number | null>(null);
    const [priority, setPriority] = useState<number>(1);
    const [notes, setNotes] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    // A state for when the entry edit is being saved (submitted)
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Use route state to access the movie assosciated with the entry
    const location = useLocation();
    // Get state from location
    const routeState = location.state as EditRouteState | null;
    const movie = routeState?.movie;

    // Fetch the entry from the watchlist
    useEffect(() => {
        const fetchEntry = async () => {
            if (!apiKey || !entryId) {
                setError(!apiKey ? "You must be logged in to edit an entry." : "Invalid watchlist entry.");
                setLoading(false);
                return;
            }

            try {
                // Clear previous errors
                setError(null);

                const data = await apiRequest<ToWatchListEntity>(
                    `/towatchlist/entries/${entryId}`,
                    "GET",
                    undefined,
                    apiKey
                );
                setMovieId(data.movie_id);
                setPriority(data.priority ?? 1);
                setNotes(data.notes ?? "");

            } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to load the watchlist entry.");
            } finally {
                setLoading(false);
            }
        }
        void fetchEntry();
    }, [apiKey, entryId]);

    // Clear error message after 5 seconds
    useEffect(() => {
        if (!error) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setError(null);
        }, 5000);

        return () => window.clearTimeout(timeoutId);
    }, [error]); 


    const handleUpdateEntry = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!apiKey || !entryId || movieId === null) {
            showToast(!apiKey ? "You must be logged in to edit an entry." : "Invalid watchlist entry.", "error");
            return;
        }

        if (!Number.isInteger(priority) || priority < 1 || priority > 10) {
            showToast("Priority must be a whole number from 1 to 10.", "error");
            return;
        }

        setSaving(true);

        try {
            // A entry update uses PUT which includes the movie ID.
            const update: UpdateToWatchListRequest = { movie_id: movieId, priority, notes };
            await apiRequest<void>(`/towatchlist/entries/${entryId}`, "PUT", update, apiKey);
            showToast("Entry updated");
            navigate("/towatchlist");

        } catch (error) {
            showToast(error instanceof Error ? error.message : "Unable to save entry.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="watchlist-edit-container">
            {/* // If there is an error render it */}
            {error && <div className="error-message">{error}</div>}

            <WatchListEditHeader
                title={movie?.title ?? "Edit Entry"}
                subtitle="Update priority and Write Some New Notes."
                poster={movie?.poster}
            />

            <form onSubmit={handleUpdateEntry} className='form-component' noValidate>
                <div className="watchlist-form-field">
                    <label htmlFor="priority">Priority (1-10)</label>
                    <input type="number" id="priority" name="priority" min="1" max="10" step="1" value={priority} onChange={(e) => setPriority(Number(e.target.value))} required />
                </div>
                <div className="watchlist-form-field">
                    <label htmlFor="notes">Notes</label>
                    <textarea id="notes" name="notes" value={notes} disabled={saving} onChange={(e) => setNotes(e.target.value)} placeholder="Write what you though about the movie here." />
                </div>

                <div className="watchlist-form-actions">
                    <button
                        type="button"
                        className="watchlist-cancel-button"
                        disabled={saving}
                        // Redirect to watchlist to cancel
                        onClick={() => navigate("/towatchlist")}
                    >
                        Cancel Edit
                    </button>
                    <button
                        type="submit"
                        name="submit"
                        className="watchlist-save-button"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>

            </form>
        </div>
    );

}