import { type LoaderFunctionArgs } from "react-router";
import { apiRequest } from "../../utils/api";
import type { MovieListResponse } from "../../types/types";

// Loader for the movies page, fetches movies from the API
export function loader({ request }: LoaderFunctionArgs) {
    // Get the url from the request and search parameters
    const url = new URL(request.url);
    const title = url.searchParams.get("title");
    const genre = url.searchParams.get("genre");
    const requestedPage = Number(url.searchParams.get("page"));

    // Default page to 1 if not provided or invalid
    const page = requestedPage > 0 ? requestedPage : 1;

    const apiParams = new URLSearchParams();
    // Normalize params and set filters
    if (title) apiParams.set("title", title.toLowerCase());
    if (genre) apiParams.set("genre", genre.toLowerCase());

    apiParams.set("page", String(page));
    // Set default limit to 20
    apiParams.set("limit", String(20));

    // Preserve trailing slash expected by API endpoint
    // Return the api request with the search parameters now filled in
    // request method defaults to GET
    return apiRequest<MovieListResponse>(`/movies/?${apiParams.toString()}`);
}
