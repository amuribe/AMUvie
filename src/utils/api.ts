import type { RequestMethod } from "../types/types";
// Helper functions, vars, and utility functions for api related logic


// Remove trailing slashes so endpoints can be easily joined 
const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

export async function apiRequest<T>(
    endpoint: string,
    // Default to get
    method: RequestMethod = "GET",
    body?: unknown,
    apiKey?: string | null // For requests where the x-api-key header is required
): Promise<T> {
    // Ensure the base url works
    if(!BASE_URL) {
        throw new Error("The API server has not been configured.");
    }
    // Format the endpoint so no matter what it is preceded by a forward slash
    const fmtEndPoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Build the url for the fetch by using the BASE_URL (endpoint will have slash)
    const url = `${BASE_URL}${fmtEndPoint}`;

    // Record for two possible headers,
    // content-type/json is added when a body is provided,
    // x-api-key may be added if given
    const headers: Record<string, string> = {}
    // If api key is provided add the header to headers
    if (apiKey) {
        headers["x-api-key"] = apiKey;
    }
    // The set of options that can be used in a request
    const options: RequestInit = {
        method,
        headers
    }

    // GET requests don't have bodies so only attach the body if the request was not a GET
    // And the body is provided (The body is passed as undefined when a request has no body)
    if (body !== undefined && method !== "GET") {
        // Set the JSON request body
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    // Since successful delete requests (204) return an empty body there is nothing to parse
    // so set data as undefined if the response was a successful delete (204 No Content)
    const data = res.status === 204 ? undefined : await res.json();

    // Throw an error if the request was not successful
    if (!res.ok) {
        // If an error message exists set it as that otherwise return a typicall http error message
        throw new Error(data.error || `Error: ${res.status}`);
    }

    // Return and cast the response to the generic
    return data as T;

}
