export interface User {
    id: number;
    google_id: string;
    name: string;
    picture: string | null;
    status: 'pending' | 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
}