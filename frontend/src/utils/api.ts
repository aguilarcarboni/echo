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

    if (!response.ok) {
        let errorMessage = 'Failed to get authentication token';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorData.msg || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const auth_response: AuthenticationResponse = await response.json();
    if (!auth_response.access_token) {
        throw new Error('Access token not found in response');
    }
    return auth_response.access_token
}

async function GetData(url: string, token: string) {
    try {
        const response = await fetch(`${api_url}${url}`, {
            headers: {
                'Cache-Control': 'no-cache',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            // Try to parse error response to get actual error message
            let errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorData.msg || errorMessage;
                // Include help message if it exists
                if (errorData.help) {
                    errorMessage += `\n\n${errorData.help}`;
                }
            } catch (parseError) {
                // If JSON parsing fails, use status text
                errorMessage = response.statusText || `HTTP ${response.status} error`;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error: any) {
        // Re-throw if it's already our formatted error
        if (error.message && error.message.includes('Request failed')) {
            throw error;
        }
        // Handle network errors or other fetch errors
        throw new Error(`Network error: ${error.message || `Failed to connect to API. Make sure the API server is running on ${api_url}`}`);
    }
}

async function PostData(url: string, params: Map | undefined, token: string) {
    try {
        const response = await fetch(`${api_url}${url}`, {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-cache',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            // Try to parse error response to get actual error message
            let errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorData.msg || errorMessage;
                // Include help message if it exists
                if (errorData.help) {
                    errorMessage += `\n\n${errorData.help}`;
                }
            } catch (parseError) {
                // If JSON parsing fails, use status text
                errorMessage = response.statusText || `HTTP ${response.status} error`;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error: any) {
        // Re-throw if it's already our formatted error
        if (error.message && error.message.includes('Request failed')) {
            throw error;
        }
        // Handle network errors or other fetch errors
        throw new Error(`Network error: ${error.message || `Failed to connect to API. Make sure the API server is running on ${api_url}`}`);
    }
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

// Responses
export async function createResponse(responseData: any) {
    return await accessAPI('/responses/create', 'POST', { response: responseData });
}

export async function getResponses(filters?: { 
    id?: string; 
    participant_id?: string; 
    task_id?: string;
    study_id?: string;
}) {
    const queryParams = new URLSearchParams();
    if (filters?.id) queryParams.append('id', filters.id);
    if (filters?.participant_id) queryParams.append('participant_id', filters.participant_id);
    if (filters?.task_id) queryParams.append('task_id', filters.task_id);
    if (filters?.study_id) queryParams.append('study_id', filters.study_id);
    
    const queryString = queryParams.toString();
    const url = `/responses/read${queryString ? '?' + queryString : ''}`;
    return await accessAPI(url, 'GET');
}

// Participant Public Endpoints (no auth required)
export async function getParticipantStudy(studyId: string, accessCode: string) {
    const response = await fetch(`${api_url}/participant/study/${studyId}?access_code=${accessCode}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
        },
    });
    
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to access study');
    }
    
    return await response.json();
}

export async function getParticipantTask(taskId: string, accessCode: string, studyId?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('access_code', accessCode);
    if (studyId) queryParams.append('study_id', studyId);
    
    const response = await fetch(`${api_url}/participant/task/${taskId}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
        },
    });
    
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to access task');
    }
    
    return await response.json();
}

export async function submitParticipantResponse(accessCode: string, taskId: string, responseData: any) {
    const response = await fetch(`${api_url}/participant/submit-response`, {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            access_code: accessCode,
            task_id: taskId,
            response_data: responseData
        }),
    });
    
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to submit response');
    }
    
    return await response.json();
}

export async function getParticipantResponses(accessCode: string, studyId?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('access_code', accessCode);
    if (studyId) queryParams.append('study_id', studyId);
    
    const response = await fetch(`${api_url}/participant/my-responses?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
        },
    });
    
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to get responses');
    }
    
    return await response.json();
}

// Study Access Link (Admin)
export async function getStudyAccessLink(studyId: string) {
    return await accessAPI(`/studies/${studyId}/access-link`, 'GET');
}

// Join Study (Public - Participant Registration)
export async function joinStudy(studyId: string, studyAccessCode: string, email: string, demographics?: any) {
    const response = await fetch(`${api_url}/participant/join-study`, {
        method: 'POST',
        headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            study_id: studyId,
            study_access_code: studyAccessCode,
            email: email,
            demographics: demographics || {}
        }),
    });
    
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to join study');
    }
    
    return await response.json();
}