"use client";

import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { useState, useEffect, Suspense } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type ResetPasswordPayload = {
  new_password: string;
  token: string;
};

const resetPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  console.log(token)

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      return axios.post(endpointUrl(ENDPOINTS.RESET_PASSWORD), payload);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password'
      toast.error('Error', {
        description: errorMessage,
      })
    },
    onSuccess: () => {
      toast.success("Success", {
        description: "Password reset successfully!",
      });
      setPasswordReset(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(routes.LOGIN);
      }, 3000);
    },
  });

  function onSubmit(values: ResetPasswordValues) {
    resetPasswordMutation.mutate({ 
      new_password: values.password,
      token: token as string
    });
  }

  // Check if token exists and is valid
  useEffect(() => {
    if (!token) {
      toast.error("Error", {
        description: "Invalid or missing reset token",
      });
      router.push(routes.FORGOT_PASSWORD);
    }
  }, [token, router]);

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
            {passwordReset ? (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white text-center font-fredoka">
                    Password reset!
                  </h1>
                  <p className="text-white/50 text-center text-sm mt-2">
                    Your password has been reset successfully
                  </p>
                </div>

                <p className="text-white/40 text-center text-xs mb-6">
                  Redirecting to login page...
                </p>

                <Link href={routes.LOGIN} className="block">
                  <GradientButton
                    variant="secondary"
                    className="w-full p-5 text-base border-0"
                  >
                    Go to sign in
                  </GradientButton>
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-white text-center mb-1 font-fredoka">
                  Reset password
                </h1>
                <p className="text-white/50 text-center text-sm mb-6">
                  Enter your new password below
                </p>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="New password"
                                type={showPassword ? "text" : "password"}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary pr-12"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
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

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Confirm new password"
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary pr-12"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
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

                    <p className="text-white/40 text-xs">
                      Password must be at least 8 characters
                    </p>

                    <GradientButton
                      type="submit"
                      disabled={resetPasswordMutation.isPending}
                      variant="secondary"
                      className="w-full p-5 text-base border-0"
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset password"
                      )}
                    </GradientButton>

                    <Link href={routes.LOGIN} className="block">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-white/50 hover:text-white hover:bg-white/5"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                      </Button>
                    </Link>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
