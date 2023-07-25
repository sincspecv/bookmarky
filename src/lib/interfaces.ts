/**
 * Define our types
 */
export interface Workspace {
    _id: String,
    name: String,
    columns?: String[],
    created_on?: String
}

export interface Column {
    _id: String,
    workspace: String
    title: String,
    links?: String[],
    created_on?: String
}

export interface Link {
    _id: String,
    column: String,
    title: String,
    url: String,
    description?: String,
    favIconUrl?: String,
    created_on?: String
}

export interface WorkspaceCache {
    _id: String,
    name: String,
    columns?: Column[],
    created_on?: String
}
