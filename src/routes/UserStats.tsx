import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import type { UserStatsResponse } from "../types/types";
import { apiRequest } from "../utils/api";
import StatCard from "../components/StatCard";
import './styles/UserStats.css';

export default function UserStats() {
    // API key isn't needed for viewing stats
    const { userId } = useAuth();

    const [stats, setStats] = useState<UserStatsResponse | null>(null);

    // Load a t start
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) {
                setError("Could not find user");
                setLoading(false);
                return;
            }

            try {
                setError(null);

                // Fetch user stats GET /users/<id>/stats
                const data = await apiRequest<UserStatsResponse>(
                    `/users/${userId}/stats`,
                    "GET",
                    undefined
                );

                setStats(data);
            } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to load statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    if (loading) {
        return <div className="container">Loading Stats...</div>
    }

    if(error) {
        return ( <div className="container">
            <p className="error-messsage">{error}</p>
        </div>
        );
    }   

    // If the user has no stats 
    if(!stats) {
        return (
            <div className="container">No statistics available for this user.</div>
        )
    }
    

    // Separate stats from lists
    const completed = stats.completed_watchlist_stats;
    const toWatch = stats.to_watchlist_stats;


    return (
        <div className="container stats-page">
            <header className="stats-header">
                <span className="stats-label">
                    Your viewing history
                </span>

                <h1>Your AMUvie Statistics</h1>

                <p>A summary of your viewing activity</p>
            </header>

            {/* Render stats in grid */}
            <section className="stats-grid">
                <StatCard
                    icon="✔️"
                    label="Movies watched"
                    value={completed.total_movies_watched}
                />

                <StatCard
                    icon="⭐"
                    label="Average rating"
                    value={Number(completed.average_rating).toFixed(1)}
                    suffix=" / 10"
                />

                <StatCard
                    icon="➕"
                    label="Movies to watch"
                    value={Number(toWatch.total_to_watch).toFixed(1)}
                />

                <div className="time-stats">
                <StatCard
                    icon="⌚"
                    label="Time watched"
                    value={Number(completed.total_hours_watched).toFixed(1)}
                    suffix=" hours"
                />

                <StatCard
                    icon="⌚"
                    label="Time watched"
                    value={completed.total_minutes_watched}
                    suffix=" minutes"
                />


                <StatCard
                    icon="⌛"
                    label="Time left to watch"
                    value={Number(toWatch.total_hours_to_watch).toFixed(1)}
                    suffix=" hours"
                />
                </div>
                
            </section>


        </div>
    )


} 