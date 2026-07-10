"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import axios from "axios";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Target,
  Loader2,
  CreditCard,
  Save,
  Gift,
  HelpCircle,
  X,
} from "lucide-react";
import { routes } from "@/app/_utils/routes";
import { userAtom } from "@/atom/user";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { endpointUrl } from "@/app/_utils/helper";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { Package, PackagesResponse, WeeklyPriceResponse } from "@/types";
import {
  QUIZ_QUESTION_COUNT,
  WORD_HUNT_MIN_WORDS,
  WORD_HUNT_MIN_WORD_LENGTH,
  getVideoDuration,
  validateVideoFile,
  validateWords,
  buildCampaignFormData,
} from "./wizard-utils";

const questionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  choices: z
    .array(z.string().min(1, "Choice cannot be empty"))
    .length(4, "Must have exactly 4 choices"),
  correctIndex: z.number().min(0).max(3),
});

const wizardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  brandUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  campaignUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  image: z
    .any()
    .refine(
      (f) => f instanceof File && f.size > 0,
      "Please upload a campaign image"
    ),
  video: z
    .any()
    .refine(
      (f) => f instanceof File && f.size > 0,
      "Please upload a campaign video"
    ),
  words: z.array(z.string()).refine((w) => validateWords(w).valid, {
    message: `Word hunt requires at least ${WORD_HUNT_MIN_WORDS} valid words (minimum ${WORD_HUNT_MIN_WORD_LENGTH} characters each)`,
  }),
  prizeDescription: z
    .string()
    .min(5, "Describe what players stand to win"),
  prizeUnitsAvailable: z.number().int().min(1),
  questions: z
    .array(questionSchema)
    .length(
      QUIZ_QUESTION_COUNT,
      `Exactly ${QUIZ_QUESTION_COUNT} quiz questions are required`
    ),
  packageId: z.string().min(1, "Please select a package"),
  durationWeeks: z
    .number()
    .int()
    .min(1, "Select at least 1 week")
    .max(12, "Maximum 12 weeks"),
});

type WizardFormData = z.infer<typeof wizardSchema>;

const STEPS = [
  "Details",
  "Image",
  "Video",
  "Word Hunt",
  "Prize",
  "Quiz",
  "Package",
  "Review",
] as const;

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ["title", "description", "brandUrl", "campaignUrl"],
  ["image"],
  ["video"],
  ["words"],
  ["prizeDescription", "prizeUnitsAvailable"],
  ["questions"],
  ["packageId", "durationWeeks"],
  [],
];

const WEEK_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const emptyQuestion = () => ({
  question: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
});

export default function CreateCampaignWizardPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const { get: getConfig } = useAdminConfig();

  const [step, setStep] = useState(0);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string>("");
  const [videoChecking, setVideoChecking] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<"draft" | "payment">("draft");
  const [apiError, setApiError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      title: "",
      description: "",
      brandUrl: "",
      campaignUrl: "",
      image: undefined as any,
      video: undefined as any,
      words: Array(WORD_HUNT_MIN_WORDS).fill(""),
      prizeDescription: "",
      prizeUnitsAvailable: 1,
      questions: Array(QUIZ_QUESTION_COUNT).fill(null).map(emptyQuestion),
      packageId: "",
      durationWeeks: 1,
    },
  });

  const { fields: questionFields } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const packageId = form.watch("packageId");
  const durationWeeks = form.watch("durationWeeks");

  const { data: packagesData, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: () =>
      axios
        .get<PackagesResponse>(endpointUrl(ENDPOINTS.PACKAGES), {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        })
        .then((res) => res.data.packages),
    enabled: !!user?.accessToken,
  });

  const selectedPackage = packagesData?.find((p) => p._id === packageId) ?? null;
  const packageType = selectedPackage?.name?.toLowerCase();

  const { data: priceData, isFetching: priceLoading } = useQuery({
    queryKey: ["weekly-price", packageType, durationWeeks],
    queryFn: () =>
      axios
        .get<WeeklyPriceResponse>(
          endpointUrl(ENDPOINTS.CALCULATE_WEEKLY_PRICE(packageType!, durationWeeks)),
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        )
        .then((res) => res.data.pricing),
    enabled: !!packageType && !!durationWeeks && durationWeeks > 0,
  });

  const initializePayment = useMutation({
    mutationFn: async (payload: { campaignId: string; packageType: string; email: string }) =>
      axios.post(endpointUrl(ENDPOINTS.INITIALIZE_PAYMENT), payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: (response) => {
      setShowSubmitModal(false);
      const paymentResponse = response.data.data;
      window.open(paymentResponse.authorization_url, "_blank");
      router.push(routes.BRAND.CAMPAIGNS);
    },
    onError: () => {
      setShowSubmitModal(false);
      setApiError("Failed to initialize payment. Your campaign was saved as a draft — you can pay from the campaigns list.");
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      axios.post(endpointUrl(ENDPOINTS.CREATE_CAMPAIGN), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.accessToken}`,
        },
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      }),
    onSuccess: (response) => {
      if (!response.data.success) return;
      if (currentActionType === "draft") {
        setShowSubmitModal(false);
        router.push(routes.BRAND.CAMPAIGNS);
        return;
      }
      initializePayment.mutate({
        campaignId: response.data.campaign._id,
        packageType: response.data.campaign.packageName ?? packageType!,
        email: user?.email as string,
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to create campaign. Please try again.";
      setApiError(message);
      setShowSubmitModal(false);
      setUploadProgress(0);
    },
  });

  const isSubmitting = createCampaignMutation.isPending || initializePayment.isPending;

  const handleImageChange = (file: File) => {
    form.setValue("image", file, { shouldValidate: true });
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = async (file: File) => {
    setVideoError("");
    setVideoChecking(true);
    form.setValue("video", undefined as any, { shouldValidate: false });
    setVideoDurationSeconds(null);
    try {
      const duration = await getVideoDuration(file);
      const result = validateVideoFile(file, duration, {
        maxDurationSeconds: getConfig("video.maxDurationSeconds"),
        maxSizeBytes: getConfig("video.maxSizeBytes"),
      });
      setVideoDurationSeconds(duration);
      if (!result.valid) {
        setVideoError(result.message ?? "Invalid video file.");
        setVideoPreviewUrl("");
        return;
      }
      form.setValue("video", file, { shouldValidate: true });
      setVideoPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      setVideoError(err?.message ?? "Could not read video file.");
    } finally {
      setVideoChecking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 ? true : await form.trigger(fields as any);
    if (step === 2 && (!!videoError || videoChecking || !form.getValues("video"))) return;
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinalSubmit = (actionType: "draft" | "payment") => {
    const data = form.getValues();
    setApiError("");
    setUploadProgress(0);
    setCurrentActionType(actionType);
    const formData = buildCampaignFormData({
      title: data.title,
      description: data.description,
      brandUrl: data.brandUrl,
      campaignUrl: data.campaignUrl,
      image: data.image,
      video: data.video,
      words: data.words,
      questions: data.questions,
      prizeDescription: data.prizeDescription,
      prizeUnitsAvailable: data.prizeUnitsAvailable,
      packageId: data.packageId,
      durationWeeks: data.durationWeeks,
    });
    createCampaignMutation.mutate(formData);
  };

  const wordsValue = form.watch("words");
  const wordsCheck = useMemo(() => validateWords(wordsValue || []), [wordsValue]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={routes.BRAND.CAMPAIGNS}>
          <Button
            variant="outline"
            size="icon"
            className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">Create Campaign</h1>
          <p className="text-white/70">
            One campaign spans all four games, plus a brand video and quiz.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-shrink-0">
              <div
                data-testid={`wizard-step-${i}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  i === step
                    ? "bg-secondary text-secondary-foreground"
                    : i < step
                    ? "bg-secondary/20 text-secondary"
                    : "bg-white/5 text-white/40"
                }`}>
                {i < step ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                {label}
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowSubmitModal(true);
          }}
          className="max-w-4xl mx-auto space-y-6">
          {/* Step 0: Details */}
          {step === 0 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Campaign Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Campaign Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter campaign title..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your campaign..."
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Brand URL{" "}
                        <span className="text-white/60 text-xs font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://your-brand.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campaignUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Campaign URL{" "}
                        <span className="text-white/60 text-xs font-normal">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://your-brand.com/campaign"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 1: Image */}
          {step === 1 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-secondary" />
                  Campaign Image
                </CardTitle>
                <p className="text-white/60 text-sm">
                  Feeds the sliding-puzzle and spot-the-difference games.
                </p>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 relative">
                          {imagePreview ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full max-h-64 object-contain rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2 bg-black/50 border-white/20"
                                onClick={() => {
                                  setImagePreview("");
                                  form.setValue("image", undefined as any, { shouldValidate: true });
                                }}>
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-white/40" />
                              <p className="mt-2 text-white/70">Click to upload campaign image</p>
                              <p className="text-xs text-white/40 mt-1">PNG, JPG up to 10MB</p>
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            data-testid="image-input"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageChange(file);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Video */}
          {step === 2 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <VideoIcon className="h-5 w-5 text-secondary" />
                  Brand Video
                </CardTitle>
                <p className="text-white/60 text-sm">
                  ~2 minutes. Players watch this before the quiz. Max{" "}
                  {Math.round(getConfig("video.maxDurationSeconds"))}s,{" "}
                  {Math.round(getConfig("video.maxSizeBytes") / (1024 * 1024))}MB.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 relative">
                  {videoPreviewUrl ? (
                    <div className="relative">
                      <video src={videoPreviewUrl} controls className="w-full max-h-64 rounded-lg" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 bg-black/50 border-white/20"
                        onClick={() => {
                          setVideoPreviewUrl("");
                          setVideoDurationSeconds(null);
                          form.setValue("video", undefined as any, { shouldValidate: true });
                        }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      {videoChecking ? (
                        <Loader2 className="mx-auto h-10 w-10 text-secondary animate-spin" />
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-white/40" />
                      )}
                      <p className="mt-2 text-white/70">
                        {videoChecking ? "Checking video..." : "Click to upload campaign video"}
                      </p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="video/*"
                    data-testid="video-input"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoChange(file);
                    }}
                  />
                </div>
                {videoDurationSeconds !== null && !videoError && (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {Math.round(videoDurationSeconds)}s, looks good.
                  </p>
                )}
                {videoError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {videoError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Word Hunt */}
          {step === 3 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <Target className="h-5 w-5 text-secondary" />
                  Word Hunt Words
                </CardTitle>
                <p className="text-white/60 text-sm">
                  At least {WORD_HUNT_MIN_WORDS} words, {WORD_HUNT_MIN_WORD_LENGTH}+ characters each.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: WORD_HUNT_MIN_WORDS }).map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`words.${index}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Word {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Enter word ${index + 1}...`}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                {!wordsCheck.valid && (
                  <p className="text-red-400 text-sm mt-3">{wordsCheck.message}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Prize */}
          {step === 4 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <Gift className="h-5 w-5 text-secondary" />
                  Prize
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="prizeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">What players stand to win</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. A brand-new pair of wireless headphones"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prizeUnitsAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Units Available</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="bg-white/5 border-white/10 text-white h-12 w-32"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? 1 : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-white/50 text-xs">
                        One winner is drawn per campaign per week regardless of units.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Quiz */}
          {step === 5 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-secondary" />
                  Quiz Questions
                  <span className="text-white/40 text-xs font-normal ml-1">
                    (exactly {QUIZ_QUESTION_COUNT})
                  </span>
                </CardTitle>
                <p className="text-white/60 text-sm">
                  Players answer these after watching the video, with unlimited retries.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {questionFields.map((question, questionIndex) => (
                  <div
                    key={question.id}
                    className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium">Question {questionIndex + 1}</h4>
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Question</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your question..."
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 4 }).map((_, choiceIndex) => (
                        <FormField
                          key={choiceIndex}
                          control={form.control}
                          name={`questions.${questionIndex}.choices.${choiceIndex}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white text-sm">
                                Choice {String.fromCharCode(65 + choiceIndex)}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`Option ${String.fromCharCode(65 + choiceIndex)}`}
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.correctIndex`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Correct Answer</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                                <SelectValue placeholder="Select correct answer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-white/10">
                              {["A", "B", "C", "D"].map((letter, index) => (
                                <SelectItem
                                  key={index}
                                  value={index.toString()}
                                  className="text-white hover:bg-white/10">
                                  Option {letter}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Package + Duration */}
          {step === 6 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  Package & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="packageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Package</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {packagesLoading ? (
                            <div className="text-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-secondary mx-auto" />
                            </div>
                          ) : (
                            (packagesData || []).map((pkg) => (
                              <div
                                key={pkg._id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  field.value === pkg._id
                                    ? "border-secondary bg-secondary/10"
                                    : "border-white/20 hover:border-white/40"
                                }`}
                                onClick={() => field.onChange(pkg._id)}>
                                <h4 className="text-white font-medium capitalize">{pkg.name}</h4>
                              </div>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Duration (weeks)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                            <SelectValue placeholder="Select weeks" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10">
                          {WEEK_OPTIONS.map((w) => (
                            <SelectItem
                              key={w}
                              value={w.toString()}
                              className="text-white hover:bg-white/10">
                              {w} week{w !== 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {selectedPackage && durationWeeks > 0 && (
                  <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg" data-testid="price-summary">
                    {priceLoading ? (
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating price...
                      </div>
                    ) : priceData ? (
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">
                          {priceData.durationWeeks} week{priceData.durationWeeks !== 1 ? "s" : ""} &times; ₦
                          {priceData.weeklyPrice.toLocaleString()}/week
                        </span>
                        <span className="text-secondary font-bold text-2xl font-fredoka">
                          ₦{priceData.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-white/60 text-sm">Select a package and duration to see the price.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white font-fredoka flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                  Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Title</span>
                  <span className="text-white">{form.getValues("title")}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Prize</span>
                  <span className="text-white text-right max-w-xs">
                    {form.getValues("prizeDescription")}
                  </span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Package</span>
                  <span className="text-white capitalize">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Duration</span>
                  <span className="text-white">{durationWeeks} week(s)</span>
                </div>
                {priceData && (
                  <div className="flex justify-between border-t border-white/10 pt-3">
                    <span className="text-white font-semibold">Total to Pay</span>
                    <span className="text-secondary font-bold text-xl font-fredoka">
                      ₦{priceData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || isSubmitting}
              className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={step === 2 && (videoChecking || !!videoError)}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Campaign
              </Button>
            )}
          </div>

          {apiError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{apiError}</span>
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* Submit modal */}
      <Dialog open={showSubmitModal} onOpenChange={(open) => !isSubmitting && setShowSubmitModal(open)}>
        <DialogContent className="bg-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-fredoka text-xl">Create Campaign</DialogTitle>
            <DialogDescription className="text-white/70">
              How would you like to proceed?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-white/60 text-xs text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
            <Button
              onClick={() => handleFinalSubmit("draft")}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/90 h-12 flex items-center justify-center gap-3">
              {createCampaignMutation.isPending && currentActionType === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleFinalSubmit("payment")}
              disabled={isSubmitting}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12 flex items-center justify-center gap-3">
              {isSubmitting && currentActionType === "payment" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Proceed to Payment
            </Button>
            <Button
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
              variant="ghost"
              className="w-full text-white/60 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
