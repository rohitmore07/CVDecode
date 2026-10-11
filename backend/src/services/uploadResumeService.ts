import { prisma, Prisma } from "../config/db";
import { CreateResumeSchema } from "../utils/validation";
import { deleteFile } from "./storage/s3StorageService";
import { redisClient, ensureRedis } from "../config/redis.caching";

export const createFileDB = async (
  s3Key: string, 
  originalName: string,
  userId: string
) => {
  // Check for duplicates based on originalName AND userId
  const existingResume = await prisma.resume.findFirst({
    where: { 
      originalName: originalName,
      userId: userId,
    },
  });
  console.log("Checking duplicate in DB: ", existingResume);
  
  if (existingResume) {
    // Clean up old file from S3
    try {
      await deleteFile(existingResume.s3Key);
    } catch (err) {
      console.error("Failed to delete old file from S3:", err);
    }

    const cacheKey = `user:${userId}:resume:${existingResume.id}`;
    try {
      await ensureRedis();
      await redisClient.del(cacheKey);
    } catch (err) {
      console.error("Failed to invalidate Redis cache:", err);
    }

    const updatedResume = await prisma.resume.update({
      where: { id: existingResume.id },
      data: {
        fileName: originalName,
        s3Key: s3Key,
        version: {increment:1},
        status: "PENDING",
        analysisResult: Prisma.DbNull,
      },
    });

    return { resume: updatedResume };
  }
  
  const validatedResume = CreateResumeSchema.parse({
    fileName: originalName,
    s3Key: s3Key,
    originalName: originalName,
    userId: userId,
  });

  const resume = await prisma.resume.create({ 
    data: validatedResume,
  });
  
  return { resume };
};

export const updateResumeService = async (resumeID: string, userId: string, data: any) => {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeID },
    select: { userId: true },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  if (resume.userId !== userId) {
    throw new Error("Unauthorized: You do not own this resume");
  }

  return await prisma.resume.update({
    where: { id: resumeID },
    data,
  });
};

export const deleteResumeService = async (resumeID: string, userId: string) => {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeID },
    select: { userId: true, s3Key: true },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  if (resume.userId !== userId) {
    throw new Error("Unauthorized: You do not own this resume");
  }


  const cacheKey = `user:${userId}:resume:${resumeID}`;
  try {
    await ensureRedis();
    await redisClient.del(cacheKey);
  } catch (err) {
    console.error("Failed to invalidate Redis cache:", err);
  }

  // Delete from DB
  const deletedResume = await prisma.resume.delete({
    where: { id: resumeID },
  });
  try {
    
    // Delete from S3
    if(deletedResume){
      await deleteFile(deletedResume.s3Key);
    }
  } catch (err) {
    console.error("Error deleting from S3 during delete service: ", err);
  }

  return deletedResume;
};

export const getS3KeyFromDB = async ( fileID: string ) => {
    try {
      const file = await prisma.resume.findUnique({
          where: { id: fileID },
          select: { s3Key: true },
      });
      if (!file) {
        throw new Error("File not found");
      }
      return file.s3Key;
    } catch (error) {
      console.error("Error while get S3 key from DB in service", error);
      throw error;
    }
}

