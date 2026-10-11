import { prisma } from "../config/db";
import { redisClient, ensureRedis } from "../config/redis.caching";


export const getResumeResultService = async (resumeID: string, userId: string) => {
    const cacheKey = `user:${userId}:resume:${resumeID}`;
    let cachedResume: string | null = null;
    try {
        await ensureRedis();
        cachedResume = await redisClient.get(cacheKey);
    } catch (err) {
        console.error("Redis cache read failed, falling back to DB:", err);
    }

    if (!cachedResume) {
        const resume = await prisma.resume.findUnique({
            where: {
                id: resumeID,
            },
            select: {
                userId: true,
                status: true,
                analysisResult: true,
            },
        });
        if (!resume) {
            throw new Error("Resume not found");
        }
        if (resume.userId !== userId) {
            throw new Error("Unauthorized: You do not own this resume");
        }
        if (resume.status === "COMPLETED" || resume.status === "FAILED") {
            try {
                await ensureRedis();
                await redisClient.set(
                    cacheKey,
                    JSON.stringify({
                        status: resume.status,
                        analysisResult: resume.analysisResult
                    }),
                    {
                        EX: 300,
                    }
                );
            } catch (err) {
                console.error("Redis cache write failed:", err);
            }
        }


        console.log("Cache miss");

        return {
            status: resume.status,
            analysisResult: resume.analysisResult
        };
    }
    console.log("Cache Hit");
    return JSON.parse(cachedResume);

}




export const getResumeForUser = async (fileID: string, userId: string) => {
    const resume = await prisma.resume.findUnique({
        where: { id: fileID },
        select: {
            id: true,
            userId: true,
            status: true,
            analysisResult: true,
            version: true,
            updatedAt: true
        },
    });

    if (!resume) {
        return { error: "NOT_FOUND" as const };
    }

    if (resume.userId !== userId) {
        return { error: "UNAUTHORIZED" as const };
    }

    return { resume };
};
