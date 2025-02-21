import axios from 'axios';

async function createNotification(userId: string, type: 'info' | 'success' | 'warning', message: string, stepId: number) {
    try {
        await axios.post('/api/create-notification', {
            userId,
            type,
            message,
            stepId
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

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

        const step = await response.json();

        // Create notifications based on status change
        switch (status) {
            case 'IN_PROGRESS':
                await createNotification(
                    userId,
                    'info',
                    `You've started working on "${step.title}"`,
                    stepId
                );
                break;
            case 'COMPLETED':
                await createNotification(
                    userId,
                    'success',
                    `Congratulations! You've completed "${step.title}"`,
                    stepId
                );
                break;
            case 'NOT_STARTED':
                await createNotification(
                    userId,
                    'warning',
                    `You've reset the progress for "${step.title}"`,
                    stepId
                );
                break;
        }

        return step;
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