"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  BarChart3,
  Clock,
  Crown,
  ExternalLink,
  Gamepad2,
  Grid3X3,
  Search as SearchIcon,
  Hammer,
  Copy,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { routes } from "@/app/_utils/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl, formatPuzzleType } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { AnyCampaignsResponse, AnyCampaign, isV2Campaign } from "@/types";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { toast } from "sonner";

const getGameIcon = (type: string) => {
  switch (type) {
    case "spot_the_difference":
      return <SearchIcon className="w-4 h-4" />;
    case "word_hunt":
      return <SearchIcon className="w-4 h-4" />;
    case "sliding_puzzle":
      return <Grid3X3 className="w-4 h-4" />;
    case "card_matching":
      return <Copy className="w-4 h-4" />;
    default:
      return <Gamepad2 className="w-4 h-4" />;
  }
};

const getTimeLeft = (endDate: string | undefined) => {
  if (!endDate) return "Unlimited Time";
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff < 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

export default function CampaignsPage() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  console.log(selectedCampaignId);
  // Fetch brand campaigns using the brand ID from user data
  const {
    data: campaigns,
    error: campaignsError,
    isLoading: loadingCampaigns,
  } = useQuery<AnyCampaign[]>({
    queryKey: ["brand-campaigns", user?.id],
    queryFn: () =>
      axios
        .get<AnyCampaignsResponse>(
          endpointUrl(ENDPOINTS.BRAND_CAMPAIGNS_BY_ID(user?.id || "")),
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        )
        .then((res) => {
          console.log("[Brand Campaigns API] raw response:", res.data);
          console.log("[Brand Campaigns API] first campaign sample:", res.data.campaigns?.[0]);
          return res.data.campaigns;
        }),
    enabled: !!user?.id && !!user?.accessToken,
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return axios.delete(endpointUrl(ENDPOINTS.DELETE_CAMPAIGN(campaignId)), {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      toast.success("Campaign deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete campaign");
    },
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({
      campaignId,
      status,
    }: {
      campaignId: string;
      status: string;
    }) => {
      return axios.patch(
        endpointUrl(ENDPOINTS.UPDATE_CAMPAIGN(campaignId)),
        { status },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      toast.success("Campaign status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update campaign status");
    },
  });

  // Filter campaigns based on search and status, then sort by creation date (latest first)
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];

    return campaigns
      .filter((campaign) => {
        const matchesSearch =
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (campaign.status || "active") === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [campaigns, searchQuery, statusFilter]);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTrendIcon = (rate: number) => {
    return rate > 10 ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
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
    onSuccess: (response) => {
      const paymentResponse = response.data.data;
      window.location.href = paymentResponse.authorization_url;
    },
    onError: (error) => {
      console.error("Failed to initialize payment:", error);
      toast.error("Failed to initialize payment");
    },
  });

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "unpaid":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <CheckCircle className="w-3 h-3" />;
      case "unpaid":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`
      )
    ) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleToggleCampaignStatus = (
    campaignId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateCampaignStatusMutation.mutate({ campaignId, status: newStatus });
  };

  const handleProceedToPayment = (campaign: AnyCampaign) => {
    initializePayment.mutate({
      campaignId: campaign._id,
      packageType: campaign.packageName,
      email: user?.email as string,
    });
  };

  if (loadingCampaigns) {
    return <PageLoader message="Loading campaigns..." />;
  }

  if (campaignsError) {
    return (
      <PageError
        title="Failed to Load Campaigns"
        message="Unable to load your campaigns. Please check your connection and try again."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">
            Campaign Management
          </h1>
          <p className="text-white/70">
            Create and manage your brand&apos;s puzzle campaigns
          </p>
        </div>
        <Link href={routes.BRAND.CAMPAIGNS_CREATE}>
          <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            placeholder="Search campaigns by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            {
              key: "all",
              label: "All Campaigns",
              count: campaigns?.length || 0,
            },
            {
              key: "active",
              label: "Active",
              count:
                campaigns?.filter((c) => (c.status || "active") === "active")
                  .length || 0,
            },
            {
              key: "draft",
              label: "Draft",
              count: campaigns?.filter((c) => c.status === "draft").length || 0,
            },
            {
              key: "completed",
              label: "Completed",
              count:
                campaigns?.filter((c) => c.status === "completed").length || 0,
            },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.key
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}>
              <span>{filter.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  statusFilter === filter.key
                    ? "bg-secondary-foreground/20 text-secondary-foreground"
                    : "bg-white/10 text-white/60"
                }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results Summary */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">
              {filteredCampaigns.length === 0
                ? "No campaigns found"
                : `Showing ${filteredCampaigns.length} campaign${
                    filteredCampaigns.length !== 1 ? "s" : ""
                  }`}
              {searchQuery && <span> matching "{searchQuery}"</span>}
              {statusFilter !== "all" && (
                <span> with status "{statusFilter}"</span>
              )}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8">
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCampaigns.map((campaign) => {
          const isPremium = campaign.packageName === "premium";
          const timeLeft = getTimeLeft(campaign.endDate);

          return (
            <div
              key={campaign._id}
              className={`group relative flex flex-col rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border border-white/10 ${
                isPremium ? "border-yellow-500/50 shadow-yellow-500/20" : ""
              }`}>
              {/* Premium Badge */}
              {isPremium && (
                <div className="absolute top-0 right-0 z-20 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>PREMIUM</span>
                </div>
              )}

              {/* Image Container */}
              <div className="relative h-52 overflow-hidden bg-white/5">
                <Image
                  src={
                    campaign.puzzleImageUrl ||
                    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000"
                  }
                  alt={campaign.title}
                  fill
                  unoptimized
                  style={{ objectFit: "cover" }}
                  className=""
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />

                {/* Game Type Badge(s) (On Image) */}
                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 z-20">
                  {isV2Campaign(campaign) ? (
                    campaign.gameTypes.map((gt) => (
                      <div
                        key={gt}
                        className="flex items-center gap-1.5 text-white bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30 text-xs font-medium">
                        {getGameIcon(gt)}
                        <span>{formatPuzzleType(gt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-xs font-medium">
                      {getGameIcon(campaign.gameType)}
                      <span>{formatPuzzleType(campaign.gameType)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                      {campaign.brandName}
                    </span>
                    {campaign.status !== "draft" && (
                      <div
                        className={`flex items-center gap-1 text-xs font-medium ${
                          timeLeft === "Ended"
                            ? "text-red-400"
                            : "text-green-500"
                        }`}>
                        <Clock className="w-3 h-3" />
                        {timeLeft}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white leading-tight mb-2 font-fredoka">
                    {campaign.title}
                  </h3>

                  <p
                    className="text-sm text-white/70 mb-4 overflow-hidden text-ellipsis"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: "1.4em",
                      maxHeight: "2.8em",
                    }}>
                    {campaign.description}
                  </p>

                  {/* Status Badges */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`${getStatusColor(
                        timeLeft === "Ended" ? "completed" : campaign.status
                      )} capitalize`}>
                      {timeLeft === "Ended" ? "completed" : campaign.status}
                    </Badge>
                    <Badge
                      className={`${getPaymentStatusColor(
                        campaign.paymentStatus
                      )} flex items-center gap-1.5`}>
                      {getPaymentStatusIcon(campaign.paymentStatus)}
                      <span className="capitalize">
                        {campaign.paymentStatus}
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    {/* <div className="text-white font-semibold">
                      {formatCurrency(7500)} spent
                    </div> */}
                    <div className="text-xs text-white/60">
                      Created {formatDate(campaign.createdAt)}
                    </div>
                  </div>

                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) {
                        setSelectedCampaignId(campaign._id);
                      }
                    }}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="hover:text-white hover:bg-transparent text-white border-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 font-fredoka">
                        {initializePayment.isPending &&
                        selectedCampaignId === campaign._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                        {/* Actions */}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-card border-white/10">
                      <DropdownMenuLabel className="text-white">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <Link href={`${routes.BRAND.CAMPAIGNS}/${campaign._id}`}>
                        <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/10 w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </Link>
                      {!isV2Campaign(campaign) && (
                        <Link
                          href={`${routes.BRAND.CAMPAIGNS_NEW}?edit=${campaign._id}`}>
                          <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/10 w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Campaign
                          </DropdownMenuItem>
                        </Link>
                      )}
                      {/* <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/10">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem> */}
                      {campaign.paymentStatus === "unpaid" && (
                        <>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            className="text-secondary hover:bg-secondary/10"
                            onClick={() => handleProceedToPayment(campaign)}
                            disabled={initializePayment.isPending}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Proceed to Payment
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-white/10" />
                      {(campaign.status || "active") === "active" ? (
                        <DropdownMenuItem
                          className="text-yellow-400 hover:bg-yellow-500/10"
                          onClick={() =>
                            handleToggleCampaignStatus(
                              campaign._id,
                              campaign.status || "active"
                            )
                          }
                          disabled={updateCampaignStatusMutation.isPending}>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Campaign
                        </DropdownMenuItem>
                      ) : (campaign.status || "active") === "paused" ? (
                        <DropdownMenuItem
                          className="text-green-400 hover:bg-green-500/10"
                          onClick={() =>
                            handleToggleCampaignStatus(
                              campaign._id,
                              campaign.status || "active"
                            )
                          }
                          disabled={updateCampaignStatusMutation.isPending}>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Campaign
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() =>
                          handleDeleteCampaign(campaign._id, campaign.title)
                        }
                        disabled={deleteCampaignMutation.isPending}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Campaign
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No campaigns found
          </h3>
          <p className="text-white/60 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first campaign to start engaging with users"}
          </p>
          <Link href={routes.BRAND.CAMPAIGNS_CREATE}>
            <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Create First Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
