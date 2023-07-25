/**
 * Define our types
 */
export interface Workspace {
    _id: String
    name: String
    columns: Array<Column>
}

export interface Column {
    _id: String,
    workspace: String
    title: String,
    links?: Array<Link>,
    created_on?: String
}

export interface Link {
    _id: String,
    column: String,
    title: String,
    url: String,
    description?: String,
    favIconUrl?: String
}
