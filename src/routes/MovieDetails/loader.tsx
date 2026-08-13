import { type LoaderFunctionArgs } from "react-router";
import { apiRequest } from "../../utils/api";
import type { MovieWithMetadata } from "../../types/types";

// Loader for the movie details  page, fetches movies from the API
export function loader({ params }: LoaderFunctionArgs) {
    // Destructure and get the movie's id from the path variable id
    const { id } = params;
    // Ensure id exists in the path variable
    if (!id) {
        throw new Error("Movie ID is required");
    }

    return apiRequest<MovieWithMetadata>(`/movies/${id}`);
}
