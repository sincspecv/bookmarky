/**
 * Define our types
 */
export interface Workspace {
    _id: string,
    name: string,
    columns?: string[],
    created?: number
}

export interface Column {
    _id: string,
    workspace: string
    title: string,
    links?: string[],
    created?: number
}

export interface Link {
    _id: string,
    column: string,
    title: string,
    url: string,
    description?: string,
    favIconUrl?: string,
    created?: number
}

export interface WorkspaceCache {
    _id: string,
    name: string,
    columns?: Column[],
    created?: number
}
