// Pure helpers for the v2 campaign creation wizard, kept free of React/DOM
// dependencies (besides getVideoDuration, which needs the browser video
// element) so validation logic is easy to unit test in isolation.

export const WORD_HUNT_MIN_WORDS = 7;
export const WORD_HUNT_MIN_WORD_LENGTH = 2;
export const QUIZ_QUESTION_COUNT = 3;
export const QUIZ_CHOICES_PER_QUESTION = 4;

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateWords(words: string[]): ValidationResult {
  const validWords = words.filter(
    (w) => w.trim().length >= WORD_HUNT_MIN_WORD_LENGTH
  );
  if (validWords.length < WORD_HUNT_MIN_WORDS) {
    return {
      valid: false,
      message: `Word hunt requires at least ${WORD_HUNT_MIN_WORDS} valid words (minimum ${WORD_HUNT_MIN_WORD_LENGTH} characters each).`,
    };
  }
  return { valid: true };
}

export interface VideoValidationConfig {
  maxDurationSeconds: number;
  maxSizeBytes: number;
}

export function validateVideoFile(
  file: File,
  durationSeconds: number,
  config: VideoValidationConfig
): ValidationResult {
  if (!file.type.startsWith("video/")) {
    return { valid: false, message: "Please upload a video file." };
  }
  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      message: `Video must be under ${Math.round(
        config.maxSizeBytes / (1024 * 1024)
      )}MB.`,
    };
  }
  if (durationSeconds > config.maxDurationSeconds) {
    return {
      valid: false,
      message: `Video must be under ${Math.round(
        config.maxDurationSeconds
      )} seconds long.`,
    };
  }
  return { valid: true };
}

// Reads video duration client-side via a detached <video> element.
// Browser-only — not called in Node test environments without jsdom's
// HTMLMediaElement stubs (tests should mock this function directly).
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata. Try a different file."));
    };
    video.src = URL.createObjectURL(file);
  });
}

export interface QuizQuestionInput {
  question: string;
  choices: string[];
  correctIndex: number;
}

export function validateQuizQuestions(
  questions: QuizQuestionInput[]
): ValidationResult {
  if (questions.length !== QUIZ_QUESTION_COUNT) {
    return {
      valid: false,
      message: `Exactly ${QUIZ_QUESTION_COUNT} quiz questions are required.`,
    };
  }
  for (const q of questions) {
    if (q.question.trim().length < 5) {
      return {
        valid: false,
        message: "Each question must be at least 5 characters.",
      };
    }
    if (
      q.choices.length !== QUIZ_CHOICES_PER_QUESTION ||
      q.choices.some((c) => !c.trim())
    ) {
      return {
        valid: false,
        message: `Each question needs ${QUIZ_CHOICES_PER_QUESTION} non-empty choices.`,
      };
    }
    if (q.correctIndex < 0 || q.correctIndex > QUIZ_CHOICES_PER_QUESTION - 1) {
      return {
        valid: false,
        message: "Select a valid correct answer for each question.",
      };
    }
  }
  return { valid: true };
}

export interface CampaignWizardData {
  title: string;
  description: string;
  brandUrl?: string;
  campaignUrl?: string;
  image: File;
  video: File;
  words: string[];
  questions: QuizQuestionInput[];
  prizeDescription: string;
  prizeUnitsAvailable: number;
  packageId: string;
  durationWeeks: number;
}

// Builds the multipart body exactly matching the field list in
// API_CONTRACT_WEEKLY_MIGRATION.md §1 (POST /brands/campaigns).
export function buildCampaignFormData(data: CampaignWizardData): FormData {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  if (data.brandUrl?.trim()) formData.append("brandUrl", data.brandUrl.trim());
  if (data.campaignUrl?.trim())
    formData.append("campaignUrl", data.campaignUrl.trim());
  formData.append("image", data.image);
  formData.append("video", data.video);
  const validWords = data.words.filter(
    (w) => w.trim().length >= WORD_HUNT_MIN_WORD_LENGTH
  );
  formData.append("words", JSON.stringify(validWords));
  formData.append("questions", JSON.stringify(data.questions));
  formData.append("prizeDescription", data.prizeDescription);
  formData.append(
    "prizeUnitsAvailable",
    String(data.prizeUnitsAvailable ?? 1)
  );
  formData.append("packageId", data.packageId);
  formData.append("durationWeeks", String(data.durationWeeks));
  return formData;
}
