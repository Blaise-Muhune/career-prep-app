import { prisma } from './config/prisma.js';
import { openai } from './config/openai.js';

export default async function handler(req, res) {
    // Set a timeout for the entire request
    const timeout = 25000; // 25 seconds
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
    );

    try {
        // Race between the actual request and the timeout
        const result = await Promise.race([
            handleRequest(req),
            timeoutPromise
        ]);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in career analysis:', error);
        
        if (error.message === 'Request timeout') {
            res.status(504).json({ 
                error: 'Request timed out',
                message: 'The analysis is taking longer than expected. Please try again.'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to generate career analysis',
                details: error.message 
            });
        }
    }
}

async function handleRequest(req) {
    const { userId } = req.body;

    // Validate userId
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid or missing userId');
    }

    console.log('Analyzing career for userId:', userId);

    // Check for recent analysis first
    try {
        const recentAnalysis = await prisma.careerAnalysis.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (recentAnalysis) {
            return JSON.parse(recentAnalysis.analysis);
        }

        // Get user data with proper null checks
        const userData = await prisma.user.findUnique({
            where: { 
                id: userId 
            },
            include: {
                profile: {
                    include: {
                        skills: true
                    }
                },
                tasks: true
            }
        });

        console.log('Found user data:', userData ? 'yes' : 'no', userData?.id);

        if (!userData) {
            throw new Error(`User not found with ID: ${userId}`);
        }

        // Calculate progress with null checks
        const totalTasks = userData.tasks?.length || 0;
        const completedTasks = userData.tasks?.filter(task => task.completed)?.length || 0;
        const preexistingSkills = userData.profile?.skills?.length || 0;

        const progressBreakdown = {
            preexistingExperience: Math.min(preexistingSkills * 10, 40), // Cap at 40%
            appProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0, // Max 60%
            totalProgress: 0
        };

        progressBreakdown.totalProgress = Math.min(
            progressBreakdown.preexistingExperience + progressBreakdown.appProgress,
            100
        );

        // Create the analysis
        const prompt = `
            Analyze this person's career profile and provide a structured response:
            
            Current Profile:
            - Dream Job: ${userData.profile?.dreamJob || 'Not specified'}
            - Current Skills: ${userData.profile?.skills?.map(s => s.name).join(', ') || 'None listed'}
            - Bio/Resume: ${userData.profile?.bio || 'Not provided'}
            - Completed Tasks: ${completedTasks} out of ${totalTasks} tasks

            Progress Breakdown:
            - Pre-existing Experience: ${progressBreakdown.preexistingExperience}%
            - App Progress: ${progressBreakdown.appProgress}%
            - Total Progress: ${progressBreakdown.totalProgress}%

            Provide your response in the following JSON format:
            {
                "progressPercentage": number between 0-100,
                "tasks": [
                    {
                        "title": "task title",
                        "description": "detailed description",
                        "timeframe": "estimated time to complete",
                        "priority": "high/medium/low"
                    }
                ],
                "nextSteps": [
                    {
                        "step": "specific action item",
                        "reason": "why this step is important"
                    }
                ],
                "analysis": "brief explanation of the progress evaluation"
            }
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "You are a career advisor that provides structured JSON responses with specific, actionable career development plans." 
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content);

        // Save the analysis
        const careerAnalysis = await prisma.careerAnalysis.create({
            data: {
                userId,
                analysis: JSON.stringify(response),
                steps: {
                    create: response.tasks.map(task => ({
                        title: task.title,
                        description: task.description,
                        timeframe: task.timeframe,
                        priority: task.priority,
                        status: "NOT_STARTED",
                        timelineProgress: 0
                    }))
                }
            },
            include: {
                steps: true
            }
        });

        return response;
    } catch (error) {
        console.error('Error in handleRequest:', error);
        throw error; // Re-throw to be caught by the main handler
    }
}
