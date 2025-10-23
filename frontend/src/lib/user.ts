export interface UserPayload {
    email: string;
    password: string;
    company_name: string;
}

export type User = UserPayload & {
    id: string;
    created: string;
    updated: string;
}