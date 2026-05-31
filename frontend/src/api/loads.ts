// Load-search accessor. Translates the editor query into the server payload
// and POSTs it to /loads/search.

import {apiPost} from "./client";
import {LoadSearchResponse} from "./types";
import {SearchParams, toServerRequest} from "./queryTranslate";

export function searchLoads(params: SearchParams): Promise<LoadSearchResponse> {
    return apiPost<LoadSearchResponse>("/loads/search", toServerRequest(params));
}
