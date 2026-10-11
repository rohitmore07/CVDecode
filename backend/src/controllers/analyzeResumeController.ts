import type { Response } from "express";
import { waitUntil } from "@vercel/functions";
import { workerPrisma } from "../config/workerDB";
import { analyzeThisResume } from "../services/resumeAnalysisService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../config/db";
import { getResumeForUser } from "../services/getResumeService";

// Runs after the HTTP response is sent. On Vercel, waitUntil keeps the function
// alive until this finishes. Locally it simply keeps running in the background.
const runAnalysis = async (fileID: string, version: number) => {
    try {
        await workerPrisma.resume.update({
            where: { id: fileID },
            data: { status: "PROCESSING" },
        });
        // analyzeThisResume marks the resume FAILED itself if anything goes wrong
        await analyzeThisResume(fileID, version);
    } catch (error) {
        console.error(`Analysis failed for ${fileID}:`, error);
    }
};

export const analyzeResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const fileID: string = typeof req.params.id === 'string' ? req.params.id : '';
        if (!fileID) {
            throw new Error('Invalid or missing file ID');
        }

        const userId = req.userId!;

        //Check if user owns the resume
        const resumeResult = await getResumeForUser(fileID, userId)

        if (resumeResult.error === "NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        
        if (resumeResult.error === "UNAUTHORIZED") {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You do not own this resume",
            });
        }

        const {resume} = resumeResult;
    
        // Already resume analysis completed? Return immediately
        if (resume.status === "COMPLETED" && resume.analysisResult) {
            return res.status(200).json({
                success: true,
                message: "Analysis already completed",
                data: resume.analysisResult,
            });
        }

        // Already being processed? Don't start a second run. (After 3 minutes we
        // assume the earlier run died and allow a retry.)
        const processingFor = Date.now() - new Date(resume.updatedAt).getTime();
        if (resume.status === "PROCESSING" && processingFor < 3 * 60 * 1000) {
            return res.status(202).json({ message: "Analysis already in progress" });
        }

        // Reply immediately, then analyze in the background.
        res.status(202).json({ message: "Analysis started" });
        waitUntil(runAnalysis(fileID, resume.version));
        return;
    }
    catch (error) {
        console.error("analyze resume controller error ", error);
        return res.status(500).json({
            success: false,
            message: "analyze resume controller error",
        });
    }
};
