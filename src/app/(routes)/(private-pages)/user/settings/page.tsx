"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Lock,
  Bell,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Trophy,
  Zap,
  Mail,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom } from "@/atom/user";
import { toast } from "sonner";
import { GamerProfileData } from "@/types";
import { useRouter } from "next/navigation";
import { routes } from "@/app/_utils/routes";

// ── Inline toggle (Switch component not installed) ──────────────────────────
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none ${
        checked ? "bg-secondary" : "bg-white/20"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function NotifRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-1.5 bg-white/5 rounded-lg mt-0.5 flex-shrink-0">
          <Icon className="h-4 w-4 text-white/50" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${disabled ? "text-white/40" : "text-white"}`}>
            {label}
          </p>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

interface NotifPrefs {
  emailNotifications: boolean;
  referralAlerts: boolean;
  leaderboardUpdates: boolean;
  newCampaignAlerts: boolean;
  weeklyDigest: boolean;
}

export default function SettingsPage() {
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  // ── Password ────────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Notifications ───────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotifPrefs>({
    emailNotifications: true,
    referralAlerts: true,
    leaderboardUpdates: true,
    newCampaignAlerts: true,
    weeklyDigest: false,
  });
  const [notifsDirty, setNotifsDirty] = useState(false);

  // ── Privacy ─────────────────────────────────────────────────────────────────
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [privacyDirty, setPrivacyDirty] = useState(false);

  // ── Delete account ──────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Load profile — merges notification/privacy prefs when backend supports them
  useQuery<GamerProfileData>({
    queryKey: ["profile"],
    queryFn: () =>
      axios
        .get(endpointUrl(ENDPOINTS.GAMER_PROFILE), {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        })
        .then((res) => {
          const profile = res.data.profile;
          if (profile.notifications) {
            setNotifs((p) => ({ ...p, ...profile.notifications }));
          }
          if (profile.privacy) {
            setShowOnLeaderboard(profile.privacy.showOnLeaderboard ?? true);
          }
          return profile;
        }),
    enabled: !!user?.accessToken,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      axios.patch(endpointUrl(ENDPOINTS.CHANGE_PASSWORD), payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change password.");
    },
  });

  const saveNotifsMutation = useMutation({
    mutationFn: (payload: NotifPrefs) =>
      axios.patch(endpointUrl(ENDPOINTS.UPDATE_NOTIFICATIONS), payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: () => {
      toast.success("Notification preferences saved.");
      setNotifsDirty(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save preferences.");
    },
  });

  const savePrivacyMutation = useMutation({
    mutationFn: (payload: { showOnLeaderboard: boolean }) =>
      axios.patch(endpointUrl(ENDPOINTS.UPDATE_PRIVACY), payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: () => {
      toast.success("Privacy settings saved.");
      setPrivacyDirty(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save privacy settings.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (payload: { password: string }) =>
      axios.delete(endpointUrl(ENDPOINTS.DELETE_ACCOUNT), {
        data: payload,
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: () => {
      toast.success("Account deleted.");
      setUser(null);
      router.push(routes.HOME);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete account.");
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const updateNotif = (key: keyof NotifPrefs, value: boolean) => {
    setNotifs((p) => ({ ...p, [key]: value }));
    setNotifsDirty(true);
  };

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm.");
      return;
    }
    deleteAccountMutation.mutate({ password: deletePassword });
  };

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-fredoka flex items-center gap-3">
            <Shield className="h-8 w-8 text-secondary" />
            Settings
          </h1>
          <p className="text-white/70">
            Manage your security, notifications, and privacy.
          </p>
        </div>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Lock className="h-5 w-5 text-secondary" />
              Change Password
            </CardTitle>
            <CardDescription className="text-white/70">
              Use a strong password you don&apos;t use anywhere else.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-10 ${
                    !passwordsMatch ? "border-red-500/60" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-red-400 text-xs">Passwords do not match.</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                !passwordsMatch
              }
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Notifications ──────────────────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Bell className="h-5 w-5 text-secondary" />
              Notifications
            </CardTitle>
            <CardDescription className="text-white/70">
              Choose what you want to be notified about.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotifRow
              icon={Mail}
              label="Email Notifications"
              description="Master toggle — turns all email alerts on or off."
              checked={notifs.emailNotifications}
              onChange={(v) => updateNotif("emailNotifications", v)}
            />
            <NotifRow
              icon={Zap}
              label="Referral Bonus Alerts"
              description="Get notified when a referred friend completes their first puzzle and you earn +3 pts."
              checked={notifs.referralAlerts}
              onChange={(v) => updateNotif("referralAlerts", v)}
              disabled={!notifs.emailNotifications}
            />
            <NotifRow
              icon={BarChart3}
              label="Leaderboard Updates"
              description="Know when your position on the monthly leaderboard changes significantly."
              checked={notifs.leaderboardUpdates}
              onChange={(v) => updateNotif("leaderboardUpdates", v)}
              disabled={!notifs.emailNotifications}
            />
            <NotifRow
              icon={Megaphone}
              label="New Campaign Alerts"
              description="Be the first to know when new brand campaigns go live."
              checked={notifs.newCampaignAlerts}
              onChange={(v) => updateNotif("newCampaignAlerts", v)}
              disabled={!notifs.emailNotifications}
            />
            <NotifRow
              icon={Trophy}
              label="Weekly Progress Summary"
              description="Receive a weekly email recap of your puzzle activity and ranking."
              checked={notifs.weeklyDigest}
              onChange={(v) => updateNotif("weeklyDigest", v)}
              disabled={!notifs.emailNotifications}
            />

            {notifsDirty && (
              <div className="pt-4 border-t border-white/5">
                <Button
                  onClick={() => saveNotifsMutation.mutate(notifs)}
                  disabled={saveNotifsMutation.isPending}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
                  {saveNotifsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Privacy ────────────────────────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary" />
              Privacy
            </CardTitle>
            <CardDescription className="text-white/70">
              Control how others see you on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-1.5 bg-yellow-400/10 rounded-lg mt-0.5 flex-shrink-0">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">
                    Show on Public Leaderboard
                  </p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
                    When off, your name and score are hidden from both monthly and weekly leaderboards.
                  </p>
                </div>
              </div>
              <Toggle
                checked={showOnLeaderboard}
                onChange={(v) => {
                  setShowOnLeaderboard(v);
                  setPrivacyDirty(true);
                }}
              />
            </div>

            {privacyDirty && (
              <div className="pt-4 border-t border-white/5 mt-3">
                <Button
                  onClick={() =>
                    savePrivacyMutation.mutate({ showOnLeaderboard })
                  }
                  disabled={savePrivacyMutation.isPending}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
                  {savePrivacyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Privacy Settings"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Danger Zone ────────────────────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 font-fredoka flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-white/70">
              Irreversible actions — proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm">Delete Account</p>
                <p className="text-white/50 text-xs mt-1 leading-relaxed">
                  Permanently removes your account, points, referral history, and all data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600/80 hover:bg-red-600 flex-shrink-0">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) setDeletePassword("");
        }}>
        <DialogContent className="bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-fredoka flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Your Account?
            </DialogTitle>
            <DialogDescription className="text-white/70">
              This will permanently delete your account and all data — points, referral history, and puzzle
              progress included. This action <span className="text-white font-semibold">cannot</span> be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">
                Enter your password to confirm
              </Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDeleteAccount();
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={
                  deleteAccountMutation.isPending || !deletePassword
                }
                className="bg-red-600 hover:bg-red-700">
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="border-white/20 text-white/70 hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
