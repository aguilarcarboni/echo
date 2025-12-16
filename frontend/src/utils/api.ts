'use server'

import { Map } from "@/lib/types";

interface AuthenticationResponse {
    access_token: string,
    expires_in: number
}

// Add token caching
const api_url = 'http://127.0.0.1:5000';

export async function accessAPI(url: string, type: string, params?: Map) {

    const token = await getToken();
    if (type === 'GET') {
        return await GetData(url, token);
    } else {
        return await PostData(url, params, token);
    }

}

export async function getToken(): Promise<string> {

    const response = await fetch(`${api_url}/token`, {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({token: 'all'}),
    })

    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) throw new Error(`Failed to get authentication token.`);

    const auth_response: AuthenticationResponse = await response.json();
    if (!auth_response.access_token) throw new Error(`Failed to get authentication token.`);
    return auth_response.access_token
}

async function GetData(url: string, token: string) {
    const response = await fetch(`${api_url}${url}`, {
        headers: {
            'Cache-Control': 'no-cache',
            'Authorization': `Bearer ${token}`
        },
    });

    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) throw new Error(`An unknown error occurred. Please try again later.`);
    return await response.json();
}

async function PostData(url: string, params: Map | undefined, token: string) {
    const response = await fetch(`${api_url}${url}`, {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params),
    });

    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) throw new Error(`An unknown error occurred. Please try again later.`);
    return await response.json();
}

// Studies
export async function createStudy(studyData: any) {
    return await accessAPI('/studies/create', 'POST', { study: studyData });
}

export async function getStudies(filters?: { id?: string; status?: string; organization_id?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.organization_id) queryParams.append('organization_id', filters.organization_id);
    
    const queryString = queryParams.toString();
    const url = `/studies/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function updateStudy(studyId: string, updateData: any) {
    return await accessAPI('/studies/update', 'POST', { id: studyId, data: updateData });
}

export async function deleteStudy(studyId: string) {
    return await accessAPI('/studies/delete', 'POST', { id: studyId });
}

// Tasks
export async function createTask(taskData: any) {
    return await accessAPI('/tasks/create', 'POST', { task: taskData });
}

export async function getTasks(filters?: { id?: string; study_id?: string; type?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    if (filters?.type) queryParams.append('type', filters.type);
    
    const queryString = queryParams.toString();
    const url = `/tasks/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function updateTask(taskId: string, updateData: any) {
    return await accessAPI('/tasks/update', 'POST', { id: taskId, data: updateData });
}

export async function deleteTask(taskId: string) {
    return await accessAPI('/tasks/delete', 'POST', { id: taskId });
}

export async function reorderTasks(studyId: string, taskIds: string[]) {
    return await accessAPI('/tasks/reorder', 'POST', { study_id: studyId, task_ids: taskIds });
}

// Participants
export async function createParticipant(participantData: any) {
    return await accessAPI('/participants/create', 'POST', { participant: participantData });
}

export async function getParticipants(filters?: { id?: string; study_id?: string; contact?: string; demographics?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    if (filters?.contact) queryParams.append('contact', filters.contact);
    if (filters?.demographics) queryParams.append('demographics', filters.demographics);
    if (filters?.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const url = `/participants/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function updateParticipant(participantId: string, updateData: any) {
    return await accessAPI('/participants/update', 'POST', { id: participantId, data: updateData });
}

export async function deleteParticipant(participantId: string) {
    return await accessAPI('/participants/delete', 'POST', { id: participantId });
}

export async function bulkCreateParticipants(studyId: string, participantData: any) {
    return await accessAPI('/participants/bulk-create', 'POST', { study_id: studyId, participants: participantData });
}

// Organizations
export async function getOrganizations(filters?: { id?: string; name?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.name) queryParams.append('name', filters.name);
    
    const queryString = queryParams.toString();
    const url = `/organizations/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function createOrganization(organizationData: any) {
    return await accessAPI('/organizations/create', 'POST', { organization: organizationData });
}

// Users
export async function getUsers(filters?: { id?: string; email?: string; organization_id?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.email) queryParams.append('email', filters.email);
    if (filters?.organization_id) queryParams.append('organization_id', filters.organization_id);
    
    const queryString = queryParams.toString();
    const url = `/users/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

export async function createUser(userData: any) {
    return await accessAPI('/users/create', 'POST', { user: userData });
}