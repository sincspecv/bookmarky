/**
 * Define our types
 */
export interface Workspace {
    name: String
    id: String
    columns: Array<Column>
}

export interface Column {
    title: String,
    id: String,
    links: Array<Link>
}

export interface Link {
    title: String,
    url: String,
    id: String,
    description?: String,
    favIconUrl?: String
}
