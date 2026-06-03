import type { MaterialDocument } from "../models/Material";
import type { SearchQuery } from "../models/SearchQuery";

export interface ISearchService {
  search(params: SearchQuery): Promise<MaterialDocument[]>;
}
