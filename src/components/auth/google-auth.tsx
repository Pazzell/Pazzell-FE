"use client";

import { ENDPOINTS } from "@/app/_utils/endpoints";
import { api } from "@/lib/api";
import { userAtom } from "@/atom/user";
import { BrandProfileData, GamerProfileData, UserData } from "@/types";
import { useGoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { routes } from "@/app/_utils/routes";

type GoogleLoginPayload = {
  googleId: string;
  email: string;
  fullName: string;
  avatar: string;
  givenName: string;
  familyName: string;
};

interface GoogleLoginResult {
  user: Pick<UserData, "userType" | "email">;
  accessToken: string;
  refreshToken: string;
}

const GoogleAuthBtn = () => {
  const setUser = useSetAtom(userAtom);
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const getUserProfile = async (loginData: GoogleLoginResult) => {
    if (loginData.user.userType === "gamer") {
      const response = await api.get(ENDPOINTS.GAMER_PROFILE, {
        headers: { Authorization: `Bearer ${loginData.accessToken}` },
      });
      const gamerData: GamerProfileData = response.data.profile;
      setUser({
        id: gamerData._id,
        firstName: gamerData.firstName,
        lastName: gamerData.lastName,
        fullName: `${gamerData.firstName} ${gamerData.lastName}`,
        avatar: gamerData.avatar,
        username: gamerData.username,
        email: gamerData.email,
        userType: gamerData.role,
        isVerified: gamerData.isVerified,
        createdAt: gamerData.createdAt,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });

      toast.success("Success", { description: "Login successful!" });
      router.push(routes.USER.HOME);
    } else {
      const response = await api.get(ENDPOINTS.BRAND_PROFILE, {
        headers: { Authorization: `Bearer ${loginData.accessToken}` },
      });
      const brandData: BrandProfileData = response.data.profile;
      setUser({
        id: brandData._id,
        fullName: brandData.name,
        email: brandData.email,
        userType: brandData.role,
        isVerified: brandData.isVerified,
        createdAt: brandData.createdAt,
        companyName: brandData?.companyName,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });

      toast.success("Success", { description: "Login successful!" });
      router.push(routes.BRAND.DASHBOARD);
    }
  };

  const googleAuthMutation = useMutation({
    mutationFn: (payload: GoogleLoginPayload) => {
      return api.post<GoogleLoginResult>(ENDPOINTS.GOOGLE_AUTH, payload);
    },
    onError: (error) => {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Google authentication failed";
      toast.error("Error", { description: errorMessage });
    },
    onSuccess: async (data) => {
      await getUserProfile(data.data);
    },
  });

  // If no Google client ID is configured, don't attempt to use Google hooks during SSR/prerender
  if (!googleClientId) {
    return null;
  }

  // Inner component uses the hook; only rendered when client id exists
  const GoogleAuthInner = () => {
    const handleGoogleAuth = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        try {
          const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            }
          ).then((res) => res.json());

          const {
            sub: googleId,
            email,
            name,
            picture,
            given_name,
            family_name,
          } = userInfoResponse;

          googleAuthMutation.mutate({
            googleId,
            email,
            fullName: name,
            avatar: picture,
            givenName: given_name,
            familyName: family_name,
          });
          toast.info("Please wait, while we log you in.");
        } catch (error) {
          toast.error("Google login failed. Please try again.");
          console.error("Google login error:", error);
        }
      },
      onError: () => {
        toast.error("Google login failed. Please try again.");
      },
    });

    return (
      <button
        onClick={() => handleGoogleAuth()}
        disabled={googleAuthMutation.isPending}
        className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {googleAuthMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>
    );
  };

  return <GoogleAuthInner />;
};

export default GoogleAuthBtn;
