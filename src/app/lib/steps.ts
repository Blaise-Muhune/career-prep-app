export async function updateStepStatus(stepId: number, userId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') {
    try {
        const response = await fetch(`/api/steps/${stepId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                status
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to update step status: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating step status:', error);
        throw error;
    }
}

export async function startStep(stepId: number, userId: string) {
    return updateStepStatus(stepId, userId, 'IN_PROGRESS');
}

export async function completeStep(stepId: number, userId: string) {
    return updateStepStatus(stepId, userId, 'COMPLETED');
}

export async function resetStep(stepId: number, userId: string) {
    return updateStepStatus(stepId, userId, 'NOT_STARTED');
} 