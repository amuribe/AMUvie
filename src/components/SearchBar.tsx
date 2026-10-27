import { type SubmitEvent, useState } from "react";
import './styles/SearchBar.css';
import { Dropdown } from "./Dropdown";
import { type DropdownOption } from "../types/types";

export interface SearchBarProps {
    onSearch: (term: string, filterType: string) => void;
    currentSearch: string | null;
    initialFilterType: string;
    // The filters available on the current page
    filterOptions: DropdownOption[];
}


export default function SearchBar({ onSearch, currentSearch, initialFilterType, filterOptions }: SearchBarProps) {
    // State of the searchbar (current search)
    const [searchTerm, setSearchTerm] = useState(currentSearch || "");
    // Set the initial filter type if provided in the url
    const [filterType, setFilterType] = useState(initialFilterType);

    // When search button is submitted run the onSearch function
    const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSearch(searchTerm, filterType);
    };

    return (
        <form className="search-bar" onSubmit={handleSearch}>
            {/* Dropdown for filters */}
            <Dropdown value={filterType} onChange={setFilterType} options={filterOptions} />



            <input
                type="search"
                name="movie-search"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
        </form>
    );
}