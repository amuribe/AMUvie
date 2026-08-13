// A type for account authorization state management
// Holds important information pertinent to the user (username, api-key, login, logout functions)
export interface AuthContextType {
    apiKey: string | null;
    userId: number | null;
    // Login function
    login: (apikey: string, id: number) => void;
    logout: () => void;
}

// Type for auth responses (matches the json in the PHP api)
export interface AuthResponse {
    api_key?: string;
    id?: number;
    error?: string;
}

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface UpdateToWatchListRequest {
    movie_id: number;
    priority: number;
    notes: string;
}

export interface CreateCompletedWatchListRequest {
    // movie_id: int, (required) rating: float(0.0-10.0), (optional) notes: string, (optional default current date) date_first_watched: string, (optional default current date) date_last_watched: string, (optional default 1) 
    movie_id: number,
    rating: number,
    notes?: string,
    date_first_watched?: string,
    date_last_watched?: string,
    times_watched?: number
}

// A response from the api that only contains a rating
export interface RatingResponse {
    rating: number;
}

// A response from the api that only contains the times watched
export interface TimesWatchedResponse {
    times_watched: number;
}

export interface UserStatsResponse {
    user_id: number;

    completed_watchlist_stats: {
        total_movies_watched: number;
        total_times_watched: number,
        average_rating: number;
        total_minutes_watched: number;
        total_hours_watched: number;

    };
    to_watchlist_stats: {
        total_to_watch: number;
        total_hours_to_watch: number;
    };
}

// Type for loading movie data in an edit page from route state
export interface EditRouteState {
    // Edit page only needs id, title, and poster(if it has one)
    movie?: {
        id: number;
        title: string;
        poster?: string | null;
    };
}

// Pagination metadata (used for GET /movies right now)
export interface PaginationData {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface MovieListResponse {
    data: MovieListItem[];
    pagination: PaginationData;
}

export type SortDirection = "asc" | "desc";

// Type for a movie in the database (aligns with the JSON response from the API)
export interface Movie {
    id: number;
    title: string;
    tagline?: string;
    overview?: string;
    original_language?: string;
    // URL to the poster image
    poster?: string;
    runtime?: number;
    vote_average: number;
    vote_count: number;
    budget?: number;
    revenue?: number;
    // URL to the movie's website if it has one
    homepage?: string;
    release_date?: string;
}

// A type used for displaying movies only includes necessary information (id, title, poster, vote_average)

export interface MovieListItem {
    id: number;
    title: string;
    // Not all movies have posters (title will display instead)
    poster?: string;
    vote_average: number;
}

// Extend the Movie type to include Metadata: genres, ProductionCompany, lastRating, etc.

export interface MovieWithMetadata extends Movie {
    genres: Genre[];
    production_companies: ProductionCompany[];
    last_rating?: string;
}

// Metadata types

export interface Genre {
    // The id of the genre in the db
    id: number;
    // The genre's name in the db
    name: string;
}

export interface ProductionCompany {
    // The id of the production company in the db
    id: number;
    // The production company's name in the db
    name: string;
}


// Fits the database row/record for the ToWatchList table from the api
export interface ToWatchListEntity {
    id: number;
    user_id: number;
    movie_id: number;
    priority: number;
    notes: string | null;
}
// Allows access to the fields which can be edited by the user
export type ToWatchListEntry = Pick<ToWatchListEntity, "priority" | "notes">;

export interface ToWatchListEntryWithMovie extends ToWatchListEntity {
    movie?: MovieListItem;
}

// Fits the database row/record for the CompletedWatchList table from the api
export interface CompletedWatchListEntity {
    id: number;
    user_id: number;
    movie_id: number;
    // String in db cast to number for future sorting behaviour
    rating: number;
    notes: string | null;
    times_watched: number;
    date_first_watched: string | null;
    date_last_watched: string | null;
}

// Allows access to the field which can be edited by the user
// Partial for when you only need to change times watched
export type CompletedWatchListEntry = Partial<Pick<CompletedWatchListEntity, "rating" | "notes" | "times_watched" | "date_first_watched" | "date_last_watched">>;

export interface CompletedWatchListEntryWithMovie extends CompletedWatchListEntity {
    movie?: MovieListItem;
}

// Data for a user's watchlists
export interface UserMovieData {
    // Whether a movie is on the user's towatchlist
    onToWatchlist: boolean;
    // Whether a movie is on the user's completed watchlist (has been watched)
    onCompleted: boolean;

    // Data for the entry if in to-watch list
    toWatchData?: ToWatchListEntity;
    // Data for the entry if in completed watchlist
    completedData?: CompletedWatchListEntity;

}
// Type for an option HTML element to make in the dropdown
export interface DropdownOption {
    label: string;
    value: string;
}
