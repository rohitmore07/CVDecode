
import { workerPrisma } from "../config/workerDB";
import { extractPDFText } from "../utils/pdfParser";
import { analyzeWithGemini } from "./geminiService";
import { redisClient, ensureRedis } from "../config/redis.caching";
import { AnalysisResultSchema } from "../utils/validation";
import { getFile } from "./storage/s3StorageService";

export const analyzeThisResume = async (thisFileID: string, jobVersion: number) => {

    try {
        const resume = await workerPrisma.resume.findUnique({
            where: { id: thisFileID },
            select: { status: true, analysisResult: true, s3Key: true, userId: true }
        });

        if (!resume) {
            throw new Error('File not found');
        }

        if (resume.status === "COMPLETED" && resume.analysisResult) {
            return typeof resume.analysisResult === "string"
                ? resume.analysisResult
                : JSON.stringify(resume.analysisResult);
        }

        const fileBuffer = await getFile(resume.s3Key);
        const extractedData = await extractPDFText(fileBuffer);
        const analyzedData = await analyzeWithGemini(extractedData);

        let cleanText = analyzedData.trim();
        // Remove markdown codeblock indicators if present
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        const parsedAnalysis = JSON.parse(cleanText);
        const validatedAnalysis = AnalysisResultSchema.parse(parsedAnalysis);

        const updatedResume = await workerPrisma.resume.updateMany({
            where: {
                id: thisFileID,
                version: jobVersion
            },
            data: {
                status: "COMPLETED",
                analysisResult: validatedAnalysis,
            }
        });

        if (updatedResume.count === 0) {
            console.log("File was re-uploaded! Discarding old result.");
            return;
        }

        const cacheKey = `user:${resume.userId}:resume:${thisFileID}`;
        try {
            await ensureRedis();
            await redisClient.del(cacheKey);
        } catch (cacheErr) {
            console.error("Failed to clear cache after analysis:", cacheErr);
        }

        return analyzedData;

    } catch (error) {
        console.log("Error in analyzeThisResume function: ", error);

        try {
            const updatedResume = await workerPrisma.resume.update({
                where: { id: thisFileID },
                data: {
                    status: "FAILED",
                },
                select: {
                    userId: true,
                },
            });
            const cacheKey = `user:${updatedResume.userId}:resume:${thisFileID}`;
            await ensureRedis();
            await redisClient.del(cacheKey);
        } catch (dbErr) {
            console.error("Failed to update status to FAILED in DB:", dbErr);
        }
        throw error;
    }
}



