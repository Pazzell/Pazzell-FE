"use client";

import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { toast } from "sonner";
import { BrandProfileData, GamerProfileData } from "@/types";
import { useSetAtom, useAtomValue } from "jotai/react";
import { userAtom } from "@/atom/user";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import GoogleAuthBtn from "@/components/auth/google-auth";

type LoginPayload = {
  email: string;
  password: string;
};

const loginSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const user = useAtomValue(userAtom);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      if (user.userType === "gamer") {
        router.push(routes.USER.DASHBOARD);
      } else if (user.userType === "brand") {
        router.push(routes.BRAND.DASHBOARD);
      }
    }
  }, [user, router]);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getUserProfile = async (loginData: any) => {
    if (loginData.user.role === "gamer") {
      axios
        .get(endpointUrl(`${ENDPOINTS.GAMER_PROFILE}`), {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
          },
        })
        .then((response) => {
          const gamerData: GamerProfileData = response.data.profile;
          console.log(gamerData);
          setUser({
            id: gamerData._id,
            firstName: gamerData.firstName,
            lastName: gamerData.lastName,
            fullName: `${gamerData.firstName} ${gamerData.lastName}`,
            avatar: gamerData.avatar,
            username: gamerData.username,
            email: gamerData.email,
            leaderboardPosition: gamerData.leaderboardPosition,
            userType: gamerData.role,
            isVerified: gamerData.isVerified,
            createdAt: gamerData.createdAt,
            accessToken: loginData.accessToken,
            refreshToken: loginData.refreshToken,
          });

          toast.success("Success", {
            description: "Login successful!",
          });
          router.push(routes.USER.DASHBOARD);
        });
    } else {
      axios
        .get(endpointUrl(`${ENDPOINTS.BRAND_PROFILE}`), {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
          },
        })
        .then((response) => {
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

          toast.success("Success", {
            description: "Login successful!",
          });
          router.push(routes.BRAND.DASHBOARD);
        });
    }
  };

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => {
      return axios.post(endpointUrl(`${ENDPOINTS.LOGIN}`), payload);
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error("Error", {
        description: errorMessage,
      });
      console.log(error);
    },
    onSuccess: async (data) => {
      const loginData = data.data;
      await getUserProfile(loginData);
    },
  });

  function onSubmit(values: LoginValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-[#6C5CE7] opacity-30 rounded-full filter blur-[80px] -top-24 -right-24" />
          <div className="absolute w-72 h-72 bg-[#00E676] opacity-30 rounded-full filter blur-[80px] -bottom-12 -left-12" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h1 className="text-2xl font-semibold text-white text-center mb-1 font-fredoka">
              Welcome back
            </h1>
            <p className="text-white/50 text-center text-sm mb-6">
              Sign in to continue
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Email address"
                          type="email"
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Password"
                            type={showPassword ? "text" : "password"}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end -mt-2 mb-4">
                  <Link
                    href={routes.FORGOT_PASSWORD}
                    className="text-secondary text-sm hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <GradientButton
                  type="submit"
                  disabled={loginMutation.isPending}
                  variant="secondary"
                  className="w-full p-5 text-base border-0">
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </GradientButton>
              </form>
            </Form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Button */}
            <GoogleAuthBtn />

            <p className="text-center text-white/50 text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href={routes.REGISTER}
                className="text-secondary font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
