import type { RouteObject } from "react-router";
import Login from "./routes/Login";
import Movies from "./routes/Movies";
// Import loader from movies page
import { loader as moviesLoader } from "./routes/Movies/loader";
// Import loader from movie id page
import { loader as movieDetailsLoader } from "./routes/MovieDetails/loader";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";
import MovieDetails from "./routes/MovieDetails";
import ToWatchList from "./routes/ToWatchList";
import CompletedWatchList from "./routes/CompletedWatchList";
import ToWatchListEdit from "./routes/ToWatchListEdit";
import CompletedWatchlistEdit from "./routes/CompletedWatchListEdit";
import UserStats from "./routes/UserStats";
import ProtectedLayout from "./layouts/ProtectedLayout";


export const Routes: RouteObject[] = [
    {

        // Movies page is the public index
        path: "/",
        element: <AppLayout />,
        children: [
            {
                index: true,
                element: <Movies />,
                loader: moviesLoader
            },
            {
                path: "movies/:id",
                element: <MovieDetails />,
                loader: movieDetailsLoader
            },
            // Protected layouts require auth
            {
                element: <ProtectedLayout />,
                children: [
                    {
                        path: "towatchlist",
                        element: <ToWatchList />
                    },
                    // Form for editing an entry in the to-watch list
                    {
                        path: "towatchlist/edit/:id",
                        element: <ToWatchListEdit />
                    },
                    {
                        path: "completedwatchlist",
                        element: <CompletedWatchList />
                    },
                    // Form for editing an entry in the completed watch list
                    {
                        path: "completedwatchlist/edit/:id",
                        element: <CompletedWatchlistEdit />
                    },
                    {
                        path: "stats",
                        element: <UserStats />
                    },
                ]
            }
        ]
    },
    {
        element: <AuthLayout />,
        children: [

            // Login page
            {
                path: "/login",
                element: <Login />
            }
        ]
    }
];