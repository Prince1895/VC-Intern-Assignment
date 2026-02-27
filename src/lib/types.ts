export interface Company {
    id: string;
    name: string;
    url: string;
    industry: string;
    stage: string;
    location: string;
}

export interface EnrichmentData {
    summary: string;
    whatTheyDo: string[];
    keywords: string[];
    derivedSignals: string[];
    sources: { url: string; timestamp: string }[];
}
