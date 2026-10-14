import React, { useState, useEffect, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { AlertCircle, FileText, X, Upload } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { PendingScanner } from "../components/PendingScanner";
import { AnalysisDashboard } from "../components/AnalysisDashboard";
import { uploadResume, analyzeResume, getResumeDetails } from "../services/api";
import type { UploadState } from "../types";
import { PageShell } from "../components/PageShell";

interface UploadPageProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  onGoHome?: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ theme, toggleTheme, onGoHome }) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    resumeId: null,
    error: null,
    fileName: null,
    fileSize: null,
    analysisResult: null,
  });

  const pollingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) window.clearInterval(pollingTimerRef.current);
    };
  }, []);

  const handleUpload = async (file: File) => {
    setUploadState({
      status: "uploading",
      progress: 0,
      resumeId: null,
      error: null,
      fileName: file.name,
      fileSize: file.size,
      analysisResult: null,
    });

    try {
      const response = await uploadResume(file, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }));
      });
      const resumeId = response.resumeId;
      setUploadState((prev) => ({ ...prev, status: "pending", resumeId, error: null }));
      startPolling(resumeId);
    } catch (err: unknown) {
      const errorMessage =
        getErrorMessage(err) ||
        "ERROR_UPLOAD_CONNECTION_FAILED";
      setUploadState((prev) => ({ ...prev, status: "failed", error: errorMessage }));
    }
  };

  const startPolling = async (resumeId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    try {
      const initialCheck = await getResumeDetails(resumeId);
      if (initialCheck.status === "COMPLETED" && initialCheck.analysisResult) {
        setUploadState((prev) => ({
          ...prev,
          status: "completed",
          analysisResult: initialCheck.analysisResult || null,
        }));
        return;
      }
    } catch (_) { /* continue */ }

    try {
      const response = await analyzeResume(resumeId);
      if (response.status === "COMPLETED" && response.analysisResult) {
        setUploadState((prev) => ({
          ...prev,
          status: "completed",
          analysisResult: response.analysisResult || null,
        }));
        return;
      }
    } catch (_) { /* fallback to polling */ }

    const pollInterval = window.setInterval(async () => {
      attempts++;
      try {
        const check = await getResumeDetails(resumeId);
        if (check.status === "COMPLETED" && check.analysisResult) {
          window.clearInterval(pollInterval);
          setUploadState((prev) => ({
            ...prev,
            status: "completed",
            analysisResult: check.analysisResult || null,
          }));
        } else if (check.status === "FAILED") {
          window.clearInterval(pollInterval);
          setUploadState((prev) => ({
            ...prev,
            status: "failed",
            error: "ERROR_PARSING_FAILED",
          }));
        } else if (attempts >= maxAttempts) {
          window.clearInterval(pollInterval);
          setUploadState((prev) => ({
            ...prev,
            status: "failed",
            error: "ERROR_TIMEOUT_EXCEEDED",
          }));
        }
      } catch (pollErr: unknown) {
        if (attempts >= maxAttempts) {
          window.clearInterval(pollInterval);
          setUploadState((prev) => ({
            ...prev,
            status: "failed",
            error: getErrorMessage(pollErr) || "ERROR_STATUS_RETRIEVAL_FAILED",
          }));
        }
      }
    }, 3000);

    pollingTimerRef.current = pollInterval;
  };

  const handleReset = () => {
    setUploadState({
      status: "idle",
      progress: 0,
      resumeId: null,
      error: null,
      fileName: null,
      fileSize: null,
      analysisResult: null,
    });
  };

  const isWorking = uploadState.status === "idle" || uploadState.status === "uploading";

  return (
    <div className="flex flex-col min-h-screen">
      <PageShell
        title="CVDecode"
        subtitle="Structured Auditing"
        theme={theme}
        toggleTheme={toggleTheme}
        rightContent={<UserButton />}
        onBrandClick={onGoHome}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="flex flex-col gap-8 max-w-xl mx-auto w-full">

            {/* ── Page heading ──────────────────────────── */}
            {isWorking && (
              <div className="animate-fade-up">
                <h1 className="text-2xl font-bold tracking-tight text-primary-theme">
                  Upload your resume
                </h1>
                <p className="mt-1.5 text-[14px] text-secondary-theme">
                  Drop in a PDF to start your audit. The analysis runs in the background and results are saved to your account.
                </p>
              </div>
            )}

            {/* ── Dynamic content ───────────────────────── */}
            {isWorking ? (
              <LocalResumeUploader
                uploadState={uploadState}
                onUpload={handleUpload}
                onCancel={handleReset}
              />
            ) : uploadState.status === "pending" ? (
              <div className="flex justify-center w-full">
                <PendingScanner
                  resumeId={uploadState.resumeId || ""}
                  fileName={uploadState.fileName}
                />
              </div>
            ) : uploadState.status === "completed" && uploadState.analysisResult && typeof uploadState.analysisResult.overallScore === "number" ? (
              <div className="w-full max-w-5xl">
                <AnalysisDashboard
                  analysisResult={uploadState.analysisResult}
                  onReset={handleReset}
                  fileName={uploadState.fileName}
                />
              </div>
            ) : (
              /* Secure Error Ledger Card */
              <div className="animate-fade-up mx-auto w-full">
                <div className="surface rounded-none border-accent-theme/40 bg-card-theme p-6 sm:p-8">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-none border border-accent-theme/20 bg-accent-theme/5 text-accent-theme">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-primary-theme uppercase tracking-wider font-mono">
                        Audit Processing Fault
                      </h2>
                      <p className="mt-2 text-[13px] text-secondary-theme font-mono bg-panel-theme border border-main-theme px-3 py-1.5 rounded-none">
                        {uploadState.error || "ERROR_UNKNOWN_EXCEPTION"}
                      </p>
                      <p className="mt-3 text-[13px] text-muted-theme">
                        The document analysis process failed. Verify the file format and size, and run the validator console again.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-none bg-primary-theme text-[13px] font-semibold text-body-theme transition hover:opacity-90 border border-main-theme"
                    >
                      Reset and Retry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </div>
  );
};

/* ─── Local Resume Uploader ────────────────── */
interface ResumeUploaderProps {
  uploadState: UploadState;
  onUpload: (file: File) => void;
  onCancel: () => void;
}

const LocalResumeUploader: React.FC<ResumeUploaderProps> = ({
  uploadState,
  onUpload,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setError(null);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onCancel();
  };

  const isUploading = uploadState.status === "uploading";

  return (
    <div className="animate-fade-up w-full">

      {/* Error banner */}
      {(error || uploadState.error) && (
        <div className="mb-3 flex items-start gap-2.5 rounded-none border border-accent-theme/20 bg-accent-theme/5 p-3.5 text-[13px] text-accent-theme font-mono">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error || uploadState.error}</span>
        </div>
      )}

      {!selectedFile ? (
        /* ── Drop zone ──────────────────────────── */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          className={[
            "cursor-pointer rounded-none border-2 border-dashed p-10 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-theme sm:p-14",
            isDragActive
              ? "border-accent-theme bg-panel-theme"
              : "border-subtle-theme bg-card-theme hover:border-accent-theme",
          ].join(" ")}
        >
          {/* Bare icon - no background box, wrapper, or border */}
          <Upload className="mx-auto h-6 w-6 text-muted-theme mb-4" />

          <p className="mt-4 text-[15px] font-medium text-primary-theme">
            {isDragActive ? "Drop the PDF here" : "Drop your resume PDF here"}
          </p>
          <p className="mt-1 text-[13px] text-muted-theme">
            or click to browse — PDF only, max 5 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-5 inline-flex h-9 items-center justify-center rounded-none bg-primary-theme text-[13px] font-medium text-body-theme border border-main-theme px-4 transition hover:opacity-90"
          >
            Browse files
          </button>
        </div>
      ) : (
        /* ── File ready card ────────────────────── */
        <div className="animate-scale-in surface rounded-none p-5 sm:p-6 border-main-theme">
          {/* File row */}
          <div className="flex items-center gap-3 rounded-none border border-main-theme bg-panel-theme/40 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-main-theme bg-panel-theme text-muted-theme">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate pr-1 text-[14px] font-medium text-primary-theme font-mono" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-theme font-mono">{formatBytes(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="flex h-7 w-7 items-center justify-center rounded-none text-muted-theme transition hover:bg-panel-theme hover:text-primary-theme"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[12px] text-muted-theme font-mono">
                <span>Uploading…</span>
                <span>{uploadState.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-none bg-panel-theme">
                <div
                  className="h-full bg-primary-theme transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2.5">
            {!isUploading ? (
              <>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-none border border-main-theme bg-panel-theme text-[14px] font-medium text-secondary-theme transition hover:bg-body-theme"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onUpload(selectedFile)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-none bg-primary-theme text-[14px] font-medium text-body-theme transition hover:opacity-90 border border-main-theme"
                >
                  Analyze
                </button>
              </>
            ) : (
              <button
                disabled
                className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-none border border-main-theme bg-panel-theme text-[14px] text-muted-theme font-mono"
              >
                Processing…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  const msg = e.response?.data?.message || e.message || "";
  if (msg.includes("upload") || msg.includes("network")) return "ERROR_UPLOAD_CONNECTION_FAILED";
  if (msg.includes("parsing") || msg.includes("pdf")) return "ERROR_DECODING_FILE";
  if (msg.includes("ai") || msg.includes("openai") || msg.includes("model")) return "ERROR_AI_AUDIT_UNAVAILABLE";
  return msg ? `ERROR_${msg.replace(/\s+/g, "_").toUpperCase()}` : null;
}
