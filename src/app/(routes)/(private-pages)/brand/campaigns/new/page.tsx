"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Minus,
  Upload,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Target,
  Calendar,
  Loader2,
  ExternalLink,
  CreditCard,
  Save,
  Sparkles,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { userAtom } from "@/atom/user";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { endpointUrl } from "@/app/_utils/helper";
import {
  CampaignData,
  CampaignResponse,
  Package,
  PackagesResponse,
} from "@/types";

// Game types
const GAME_TYPES = [
  { value: 'word_hunt', label: 'Word Hunt' },
  { value: "sliding_puzzle", label: "Sliding Puzzle" },
  { value: "card_matching", label: "Card Matching" },
  { value: "spot_the_difference", label: "Spot the Difference" },
];

// Base form schema (without image validation)
const baseCampaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  gameType: z.string().min(1, "Please select a game type"),
  packageId: z.string().min(1, "Please select a package"),
  weeksToRun: z
    .number()
    .min(1, "Campaign must run for at least 1 week")
    .max(52, "Campaign cannot exceed 52 weeks"),
  campaignUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  image: z.any().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(5, "Question must be at least 5 characters"),
        choices: z
          .array(z.string().min(1, "Choice cannot be empty"))
          .length(4, "Must have exactly 4 choices"),
        correctIndex: z.number().min(0).max(3),
      })
    )
    .min(5, "Must have at least 5 questions")
    .max(10, "Cannot exceed 10 questions"),
  words: z.array(z.string()).optional(),
});

// Form validation schema for creating (image required)
const createCampaignSchema = baseCampaignSchema
  .refine(
    (data) => {
      // Image is required for new campaigns
      if (!(data.image instanceof File) || data.image.size === 0) {
        return false;
      }
      return true;
    },
    {
      message: "Please upload an image",
      path: ["image"],
    }
  )
  .refine(
    (data) => {
      // If game type is word_hunt, words are required and must have valid entries
      if (data.gameType === "word_hunt") {
        const validWords =
          data.words?.filter((word) => word.trim().length >= 2) || [];
        return validWords.length >= 7;
      }
      return true;
    },
    {
      message:
        "Word hunt requires at least 7 valid words (minimum 2 characters each)",
      path: ["words"],
    }
  );

// Form validation schema for editing (image optional, locked fields not validated)
const editCampaignSchema = baseCampaignSchema
  .extend({
    // gameType, packageId, weeksToRun cannot be changed on an existing campaign —
    // relax their constraints so the form submits with the pre-filled server values.
    gameType: z.string(),
    packageId: z.string(),
    weeksToRun: z.number(),
  })
  .refine(
    (data) => {
      if (data.gameType === "word_hunt") {
        const validWords =
          data.words?.filter((word) => word.trim().length >= 2) || [];
        return validWords.length >= 7;
      }
      return true;
    },
    {
      message:
        "Word hunt requires at least 7 valid words (minimum 2 characters each)",
      path: ["words"],
    }
  );

type CampaignFormData = z.infer<typeof baseCampaignSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAtomValue(userAtom);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [currentActionType, setCurrentActionType] = useState<
    "draft" | "payment"
  >("draft");
  const [comprehensionPassage, setComprehensionPassage] = useState("");
  const [generateError, setGenerateError] = useState("");
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("edit");

  // Fetch packages
  const { data: packagesData, isLoading: packagesLoading } = useQuery<
    Package[]
  >({
    queryKey: ["packages"],
    queryFn: () =>
      axios
        .get<PackagesResponse>(endpointUrl(ENDPOINTS.PACKAGES), {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        })
        .then((res) => res.data.packages),
    enabled: !!user?.accessToken,
  });

  // Get campaign details if search query is edit:
  const {
    data: campaignDetails,
    error: campaignDetailsError,
    isLoading: loadingCampaigns,
  } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () =>
      axios
        .get<CampaignResponse>(
          endpointUrl(`${ENDPOINTS.CAMPAIGN_DETAILS(campaignId!)}`),
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        )
        .then((res) => {
          return res.data.campaign;
        }),
    enabled: !!campaignId,
  });

  const isEditMode = !!campaignId;
  const isPaidCampaign =
    isEditMode && campaignDetails?.paymentStatus === "paid";

  const emptyQuestion = () => ({ question: "", choices: ["", "", "", ""], correctIndex: 0 });

  const defaultFormValues: CampaignFormData = {
    title: "",
    description: "",
    gameType: "",
    packageId: "",
    weeksToRun: 1,
    campaignUrl: "",
    image: undefined as any,
    questions: Array(5).fill(null).map(emptyQuestion),
    words: Array(7).fill(""),
  };

  const editFormValues = useMemo(() => {
    if (!campaignDetails) return undefined;

    const weeksFromHours =
      Math.round(campaignDetails.timeLimit / (7 * 24)) || 1;

    const formattedQuestions =
      campaignDetails.questions?.length > 0
        ? campaignDetails.questions.map((q) => ({
            question: q.question,
            choices: q.choices,
            correctIndex: q.correctIndex,
          }))
        : Array(5).fill(null).map(() => ({ question: "", choices: ["", "", "", ""], correctIndex: 0 }));

    const formattedWords =
      campaignDetails.words?.length > 0
        ? [
            ...campaignDetails.words,
            ...Array(Math.max(0, 7 - campaignDetails.words.length)).fill(""),
          ]
        : Array(7).fill("");

    return {
      title: campaignDetails.title,
      description: campaignDetails.description,
      gameType: campaignDetails.gameType,
      packageId: campaignDetails.packageId,
      weeksToRun: weeksFromHours,
      campaignUrl: campaignDetails.campaignUrl || "",
      image: undefined,
      questions: formattedQuestions,
      words: formattedWords,
    };
  }, [campaignDetails]);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(
      isEditMode ? editCampaignSchema : createCampaignSchema
    ),
    defaultValues: defaultFormValues,
    values: isEditMode ? editFormValues : undefined,
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    replace: replaceQuestions,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const selectedGameType = form.watch("gameType");
  const selectedPackageId = form.watch("packageId");
  const weeksToRun = form.watch("weeksToRun");

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!selectedPackageId || !weeksToRun || !packagesData) return 0;
    const selectedPackage = packagesData.find(
      (pkg) => pkg._id === selectedPackageId
    );
    if (!selectedPackage) return 0;
    const discountFactor = weeksToRun >= 2 ? 0.9 : 1;
    return selectedPackage.amount * weeksToRun * discountFactor; // Amount is already in naira
  };

  // Get selected package data
  const getSelectedPackage = () => {
    if (!selectedPackageId || !packagesData) return null;
    return packagesData.find((pkg) => pkg._id === selectedPackageId);
  };

  // Initialize payment mutation
  const initializePayment = useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      packageType: string;
      email: string;
    }) => {
      return axios.post(endpointUrl(ENDPOINTS.INITIALIZE_PAYMENT), payload, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
    },
    onSuccess(response) {
      setShowCreateModal(false);
      const paymentResponse = response.data.data;
      window.open(paymentResponse.authorization_url, "_blank");
    },
    onError: (error) => {
      console.error("Failed to initialize payment:", error);
      setShowCreateModal(false);
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return axios.post(endpointUrl(ENDPOINTS.CREATE_CAMPAIGN), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        if (currentActionType === "draft") {
          setShowCreateModal(false);
          router.push(routes.BRAND.CAMPAIGNS);
        } else {
          // For payment flow, navigate to payment or campaigns page
          initializePayment.mutate({
            campaignId: response.data.campaign._id,
            packageType: response.data.campaign.packageName,
            email: user?.email as string,
          });
        }
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to create campaign. Please try again.";
      setApiError(message);
      console.error("Failed to create campaign:", error);
      setShowCreateModal(false);
    },
  });

  // Update campaign mutation — sends multipart/form-data.
  // Do NOT set Content-Type manually; axios auto-sets it with the correct
  // multipart boundary when the body is a FormData instance.
  const updateCampaignMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return axios.patch(
        endpointUrl(ENDPOINTS.UPDATE_CAMPAIGN(campaignId!)),
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["brand-campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowCreateModal(false);
      setShowUpdateSuccessModal(true);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to update campaign. Please try again.";
      setApiError(message);
      console.error("Failed to update campaign:", error);
      setShowCreateModal(false);
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async (passage: string) => {
      return axios.post(
        endpointUrl(ENDPOINTS.GENERATE_QUESTIONS),
        { passage },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    },
    onSuccess: (response) => {
      // Backend may return { questions: [...] } or { data: { questions: [...] } }
      const payload = response.data?.data ?? response.data;
      const questions = payload?.questions as {
        question: string;
        choices: string[];
        correctIndex: number;
      }[];
      if (questions?.length) {
        replaceQuestions(
          questions.map((q) => ({
            question: q.question,
            choices: q.choices,
            correctIndex: q.correctIndex,
          }))
        );
        setGenerateError("");
      } else {
        setGenerateError("AI returned no questions. Check your passage and try again.");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setGenerateError(msg ?? "Failed to generate questions. Please try again.");
    },
  });

  const prepareFormData = (data: CampaignFormData): FormData => {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("gameType", data.gameType);
    formData.append("timeLimit", (data.weeksToRun * 7 * 24).toString());
    formData.append("packageId", data.packageId);

    if (data.image instanceof File && data.image.size > 0) {
      formData.append("image", data.image);
    }

    if (data.campaignUrl && data.campaignUrl.trim() !== "") {
      formData.append("campaignUrl", data.campaignUrl);
    }

    if (comprehensionPassage.trim()) {
      formData.append("passage", comprehensionPassage.trim());
    }

    formData.append("questions", JSON.stringify(data.questions));

    if (data.gameType === "word_hunt" && data.words) {
      const validWords = data.words.filter((word) => word.trim().length > 0);
      formData.append("words", JSON.stringify(validWords));
    }

    return formData;
  };


  const onSubmit = (data: CampaignFormData) => {
    console.log("Form submitted with data:", data);
    setApiError("");
    setShowCreateModal(true);
  };

  const handleCreateCampaign = (actionType: "draft" | "payment") => {
    const formValues = form.getValues();
    setCurrentActionType(actionType);

    if (isEditMode) {
      updateCampaignMutation.mutate(prepareFormData(formValues));
    } else {
      createCampaignMutation.mutate(prepareFormData(formValues));
    }
  };

  const onInvalidSubmit = (errors: any) => {
    console.log("Form validation errors:", errors);
  };

  const handleImageUpload = (file: File) => {
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (campaignDetails?.puzzleImageUrl) {
      setImagePreview(campaignDetails.puzzleImageUrl);
    }
    if (campaignDetails?.passage) {
      setComprehensionPassage(campaignDetails.passage);
    }
  }, [campaignDetails]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
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
          <h1 className="text-3xl font-bold text-white font-fredoka">
            {!!campaignId ? "Edit Campaign" : "Create New Campaign"}
          </h1>
          {!campaignId && (
            <p className="text-white/70">
              Set up a new puzzle campaign to engage with your audience
            </p>
          )}
        </div>
      </div>

      {/* Loading state when fetching campaign details */}
      {isEditMode && loadingCampaigns && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-secondary mx-auto" />
            <p className="text-white/70 mt-2">Loading campaign details...</p>
          </div>
        </div>
      )}

      {/* Error state when fetching campaign details fails */}
      {isEditMode && campaignDetailsError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load campaign details. Please try again.</span>
          </div>
        </div>
      )}

      {(!isEditMode ||
        (isEditMode && campaignDetails && !loadingCampaigns)) && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
            className="space-y-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Basic Information */}
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
                        <FormLabel className="text-white">
                          Campaign Title
                        </FormLabel>
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
                        <FormLabel className="text-white">
                          Description
                        </FormLabel>
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
                    name="campaignUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Campaign URL{" "}
                          <span className="text-white/60 text-xs font-normal">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://your-brand.com/campaign"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-white/60 text-xs">
                          Link to your brand's campaign page or website for
                          users to visit
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gameType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Game Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isEditMode}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue placeholder="Select game type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-white/10">
                              {GAME_TYPES.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  className="text-white hover:bg-white/10">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isEditMode && (
                            <FormDescription className="text-yellow-400/80 text-xs">
                              Game type cannot be changed after creation
                            </FormDescription>
                          )}
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weeksToRun"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Duration (Weeks)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="52"
                              placeholder="1"
                              disabled={isPaidCampaign}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                field.onChange(isNaN(val) ? undefined : val);
                              }}
                            />
                          </FormControl>
                          {isPaidCampaign && (
                            <FormDescription className="text-yellow-400/80 text-xs">
                              Duration cannot be changed after payment
                            </FormDescription>
                          )}
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white font-fredoka flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-secondary" />
                    Campaign Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-8">
                              {imagePreview ? (
                                <div className="relative">
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
                                      onChange(undefined);
                                    }}>
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Upload className="mx-auto h-12 w-12 text-white/40" />
                                  <p className="mt-2 text-white/70">
                                    Click to upload campaign image
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">
                                    PNG, JPG up to 10MB
                                  </p>
                                </div>
                              )}
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    onChange(file);
                                    handleImageUpload(file);
                                  }
                                }}
                                {...field}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Word Hunt Words */}
              {selectedGameType === "word_hunt" && (
                <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white font-fredoka flex items-center gap-2">
                      <Target className="h-5 w-5 text-secondary" />
                      Word Hunt Words
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 7 }).map((_, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`words.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">
                                Word {index + 1}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`Enter word ${index + 1}...`}
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Question Generation */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-white font-fredoka flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-secondary" />
                      Brand Passage
                    </CardTitle>
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary/80">
                      Optional — AI shortcut
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">
                    Paste a passage and let AI pre-fill your questions. If AI is unavailable, skip this and fill in the questions below manually.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste a short passage about your brand (max 1000 characters)..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[140px] resize-none"
                      maxLength={1000}
                      value={comprehensionPassage}
                      onChange={(e) => {
                        setComprehensionPassage(e.target.value);
                        setGenerateError("");
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">
                        {comprehensionPassage.length}/1000 characters
                      </span>
                      {generateError && (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {generateError} — fill in questions below instead.
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={
                      comprehensionPassage.trim().length < 20 ||
                      generateQuestionsMutation.isPending
                    }
                    onClick={() => generateQuestionsMutation.mutate(comprehensionPassage.trim())}
                    className="w-full bg-secondary/20 hover:bg-secondary/30 border border-secondary/40 text-secondary h-11 font-fredoka disabled:opacity-40"
                  >
                    {generateQuestionsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate 5 Questions with AI
                      </>
                    )}
                  </Button>

                  {generateQuestionsMutation.isSuccess && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Questions pre-filled below — review and edit before submitting.
                    </div>
                  )}

                  {generateQuestionsMutation.isError && (
                    <div className="flex items-start gap-2 text-amber-400 text-sm p-3 bg-amber-400/10 rounded-lg border border-amber-400/20">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>AI service is currently unavailable. You can still fill in your questions manually in the section below.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs uppercase tracking-widest">or fill in manually</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Questions */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white font-fredoka flex items-center gap-2">
                    <Target className="h-5 w-5 text-secondary" />
                    Campaign Questions
                    <span className="text-white/40 text-xs font-normal ml-1">(min 5)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {questionFields.map((question, questionIndex) => (
                    <div
                      key={question.id}
                      className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium">
                          Question {questionIndex + 1}
                        </h4>
                        {questionFields.length > 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => removeQuestion(questionIndex)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.question`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Question
                            </FormLabel>
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
                                    placeholder={`Option ${String.fromCharCode(
                                      65 + choiceIndex
                                    )}`}
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
                            <FormLabel className="text-white">
                              Correct Answer
                            </FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
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

                  {questionFields.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/90"
                      onClick={() =>
                        appendQuestion(emptyQuestion())
                      }>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Package Selection */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white font-fredoka flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    Package Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isPaidCampaign && (
                    <p className="text-yellow-400/80 text-xs mb-3">
                      Package cannot be changed after payment
                    </p>
                  )}
                  <FormField
                    control={form.control}
                    name="packageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            {packagesLoading ? (
                              <div className="text-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-secondary mx-auto" />
                                <p className="text-white/60 text-sm mt-2">
                                  Loading packages...
                                </p>
                              </div>
                            ) : packagesData ? (
                              packagesData.map((pkg) => (
                                <div
                                  key={pkg._id}
                                  className={`p-3 rounded-lg border transition-all ${
                                    isPaidCampaign
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  } ${
                                    field.value === pkg._id
                                      ? "border-secondary bg-secondary/10"
                                      : "border-white/20 hover:border-white/40"
                                  }`}
                                  onClick={() => {
                                    if (!isPaidCampaign)
                                      field.onChange(pkg._id);
                                  }}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="text-white font-medium capitalize">
                                        {pkg.name}
                                      </h4>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-secondary font-bold">
                                        ₦{pkg.amount.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-white/60">
                                        per week
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-red-400 text-sm">
                                  Failed to load packages
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Cost Summary */}
              {getSelectedPackage() && weeksToRun && (
                <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white font-fredoka flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-secondary" />
                      Cost Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-white/70">
                      <span>Package:</span>
                      <span className="capitalize">
                        {getSelectedPackage()?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Duration:</span>
                      <span>
                        {weeksToRun} week{weeksToRun > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Rate:</span>
                      <span>
                        ₦{getSelectedPackage()?.amount.toLocaleString()}/week
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between text-lg font-bold text-white">
                        <span>Total Cost:</span>
                        <span className="text-secondary">
                          ₦{calculateTotalCost().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={
                    createCampaignMutation.isPending ||
                    updateCampaignMutation.isPending
                  }
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12">
                  {createCampaignMutation.isPending ||
                  updateCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white mr-2" />
                      {isEditMode
                        ? "Updating Campaign..."
                        : "Creating Campaign..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isEditMode ? "Update Campaign" : "Create Campaign"}
                    </>
                  )}
                </Button>

                <Link
                  href={routes.BRAND.CAMPAIGNS}
                  className="flex-1 sm:flex-initial">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 h-12"
                    disabled={
                      createCampaignMutation.isPending ||
                      updateCampaignMutation.isPending
                    }>
                    Cancel
                  </Button>
                </Link>
              </div>

              {/* Status Messages */}
              {(createCampaignMutation.isError ||
                updateCampaignMutation.isError ||
                apiError) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {apiError ||
                        (isEditMode
                          ? "Failed to update campaign. Please try again."
                          : "Failed to create campaign. Please try again.")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      )}

      {/* Create/Update Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-fredoka text-xl">
              {isEditMode ? "Update Campaign" : "Create Campaign"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {isEditMode
                ? "Confirm to save your campaign changes."
                : "How would you like to proceed with your campaign?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {isEditMode ? (
              <>
                <Button
                  onClick={() => handleCreateCampaign("draft")}
                  disabled={updateCampaignMutation.isPending}
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12 flex items-center justify-center gap-3">
                  {updateCampaignMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>

                <Button
                  onClick={() => setShowCreateModal(false)}
                  disabled={updateCampaignMutation.isPending}
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white hover:bg-white/5">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleCreateCampaign("draft")}
                  disabled={
                    createCampaignMutation.isPending ||
                    initializePayment.isPending
                  }
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/90 h-12 flex items-center justify-center gap-3">
                  {createCampaignMutation.isPending &&
                  currentActionType === "draft" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save as Draft
                </Button>

                <Button
                  onClick={() => handleCreateCampaign("payment")}
                  disabled={
                    createCampaignMutation.isPending ||
                    initializePayment.isPending
                  }
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12 flex items-center justify-center gap-3">
                  {(createCampaignMutation.isPending ||
                    initializePayment.isPending) &&
                  currentActionType === "payment" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Proceed to Payment
                </Button>

                <Button
                  onClick={() => setShowCreateModal(false)}
                  disabled={createCampaignMutation.isPending}
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white hover:bg-white/5">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Success Modal */}
      <Dialog
        open={showUpdateSuccessModal}
        onOpenChange={setShowUpdateSuccessModal}>
        <DialogContent className="bg-card border-white/20 max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <DialogTitle className="text-white font-fredoka text-xl text-center">
              Campaign Updated Successfully
            </DialogTitle>
            <DialogDescription className="text-white/70 text-center">
              Your campaign changes have been saved.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            <Button
              onClick={() => {
                setShowUpdateSuccessModal(false);
                router.push(routes.BRAND.CAMPAIGNS);
              }}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground h-12">
              Back to Campaigns
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
