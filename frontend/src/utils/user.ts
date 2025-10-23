import { UserPayload, User } from "@/lib/user"
import { accessAPI } from "./api"

export async function CreateUser(user: UserPayload): Promise<User> {
    const userResponse: User = await accessAPI('/users/create', 'POST', { 'user': user })
    return userResponse
}

export async function ReadUsers(): Promise<User[]> {
    const users: User[] = await accessAPI('/users/read', 'GET')
    return users
}