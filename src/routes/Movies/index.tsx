import { useLoaderData, useSearchParams } from "react-router";
import './Movies.css'
// The movie loader
import { loader } from "./loader";
import MovieCard from "../../components/MovieCard";
import type { MovieListItem } from "../../types/types";
import SearchBar from "../../components/SearchBar";
import type { DropdownOption } from "../../types/types";
import { Dropdown } from "../../components/Dropdown";


// I can probably make this more dynamic in the future if I add other genres. 
// For now, options are hardcoded as all the genres currently in the DB

const GENRE_OPTIONS: DropdownOption[] = [
    { label: "All genres", value: "" },
    { label: "Action", value: "action" },
    { label: "Adventure", value: "adventure" },
    { label: "Animation", value: "animation" },
    { label: "Comedy", value: "comedy" },
    { label: "Crime", value: "crime" },
    { label: "Documentary", value: "documentary" },
    { label: "Drama", value: "drama" },
    { label: "Family", value: "family" },
    { label: "Fantasy", value: "fantasy" },
    { label: "Foreign", value: "foreign" },
    { label: "History", value: "history" },
    { label: "Horror", value: "horror" },
    { label: "Music", value: "music" },
    { label: "Mystery", value: "mystery" },
    { label: "Romance", value: "romance" },
    { label: "Science Fiction", value: "science fiction" },
    { label: "Thriller", value: "thriller" },
    { label: "TV Movie", value: "tV movie" },
    { label: "War", value: "war" },
    { label: "Western", value: "western" },
]

// Define the filters available for the movies page
const MOVIE_FILTER_OPTIONS: DropdownOption[] = [
    { label: "Title", value: "title" },
]
export default function Movies() {
    const { data: movies, pagination } = useLoaderData<typeof loader>();
    // Get the search parameters from the URL
    const [searchParams, setSearchParams] = useSearchParams();

    // Check the url to see if it includes any of the valid filters defined for this page
    const activeFilterOption = MOVIE_FILTER_OPTIONS.find(option => searchParams.has(option.value));
    // Get the current filters (defaults to search by title if none provided)
    const currentTitle = searchParams.get("title") ?? "";
    const currentGenre = searchParams.get("genre") ?? "";
    const currentFilter = activeFilterOption ? activeFilterOption.value : MOVIE_FILTER_OPTIONS[0].value;

    // Function updates the movie filter
    const updateFilter = (
        filterName: "title" | "genre",
        value: string
    ) => {
        setSearchParams((currentParams) => {
            // Get new updated search params
            const nextParams = new URLSearchParams(currentParams);

            // Normalize the value
            const normalizedValue = value.trim().toLowerCase();
            if (normalizedValue) {
                // Value was provided and normalized, update params
                nextParams.set(filterName, normalizedValue);
            } else {
                nextParams.delete(filterName);
            }

            // Filters change page count so return to first page (default)
            nextParams.delete("page");

            return nextParams;
        });
    };

    const changePage = (newPage: number) => {
        // Ensure page is valid (if not safely return)
        if (newPage < 1 || newPage > pagination.pages || newPage === pagination.page) {
            return;
        }

        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);

            // If page equals one redirect to page 1 (default)
            if (newPage === 1) {
                nextParams.delete("page");
            } else {
                nextParams.set("page", String(newPage));
            }

            return nextParams;
        });

        // Scroll to top of page after changing
        window.scrollTo({
            top: 0,
            behavior: "auto"
        });

    };

    const clearFilters = () => {
        setSearchParams({});
    };

    const hasActiveFilters = Boolean(currentTitle || currentGenre);


    return (
        <div className="movies-page">

            <header className="movies-page-header">

                <div>
                    <h1>Browse AMUvies</h1>
                    <p className="movies-page-subtitle">
                        Search catalogue by title or narrow by filters
                    </p>
                </div>

                {/* If there are any filters render the clear button */}

                {hasActiveFilters && (
                    <button type="button" className="movies-page-clear-button" onClick={clearFilters}>
                        Clear Filters
                    </button>
                )}
            </header>

            <section className="movies-page-filters">
                {/* Search by title default */}
                    <SearchBar
                        key={`${currentFilter}:${currentTitle}`}
                        currentSearch={currentTitle}
                        onSearch={(title) => updateFilter("title", title)}
                        initialFilterType={currentFilter}
                        filterOptions={MOVIE_FILTER_OPTIONS}
                    />

                <div className="movies-page-filter">
                    <label htmlFor="genre-filter">Genre</label>

                    <Dropdown
                        id="genre-filter"
                        value={currentGenre}
                        options={GENRE_OPTIONS}
                        onChange={(genre) => updateFilter("genre", genre)}
                    />
                </div>
            </section>

            <div className="movies-page-results">
                {/* Display movie count and page count from search */}
                <p> {pagination.total === 1 ? "1 movie found" : `${pagination.total} movies found`}</p>

                {pagination.total > 0 && (
                    <p>Page {pagination.page} of {pagination.pages}</p>
                )}
            </div>

            {/* Only render card grid when movies appear */}
            {movies.length > 0 ? (
                <>
                    <div className="card-grid">
                        {/* Generate movie cards for each movie */}
                        {movies.map((movie: MovieListItem) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>

                    {pagination.pages > 1 && (
                        <nav className="pagination">
                            <button
                                type="button"
                                className="pagination-button"
                                disabled={pagination.page === 1}
                                onClick={() => changePage(pagination.page - 1)}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="pagination-button"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => changePage(pagination.page + 1)}
                            >
                                Next
                            </button>
                        </nav>
                    )}


                </>
            ) : (
                <section className="movies-page-empty">
                    <h2>No Movies found</h2>

                    <p>
                        Try another title or different filter.
                    </p>
                    <button type="button" onClick={clearFilters}>View all movies</button>

                </section>
            )}

        </div>
    );
}