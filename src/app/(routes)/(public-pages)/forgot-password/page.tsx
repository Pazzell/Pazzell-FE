'use client'

import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from "zod";
import { Button } from '@/components/ui/button'
import { GradientButton } from '@/components/ui/gradient-button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useRouter } from 'next/navigation'

type ForgotPasswordPayload = {
  email: string;
};

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => {
      return axios.post(endpointUrl(`${ENDPOINTS.FORGOT_PASSWORD}`), payload);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset link'
      toast.error('Error', {
        description: errorMessage,
      })
    },
    onSuccess: async (data) => {
      console.log(data)
      toast.success('Success', {
        description: data.data.message || 'Password reset link sent to your email!',
      })
      setEmailSent(true)
    },
  });

  function onSubmit(values: ForgotPasswordValues) {
    forgotPasswordMutation.mutate(values)
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
            {emailSent ? (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white text-center font-fredoka">
                    Check your email
                  </h1>
                  <p className="text-white/50 text-center text-sm mt-2">
                    We&apos;ve sent a password reset link to your email address
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-white/50 text-center text-sm">
                    Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setEmailSent(false)}
                      className="text-secondary font-semibold hover:underline"
                    >
                      try again
                    </button>
                  </p>

                  <Link href={routes.LOGIN} className="block">
                    <Button
                      variant="outline"
                      className="w-full p-5 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-white text-center mb-1 font-fredoka">
                  Forgot password?
                </h1>
                <p className="text-white/50 text-center text-sm mb-6">
                  No worries, we&apos;ll send you reset instructions
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    <GradientButton
                      type="submit"
                      disabled={forgotPasswordMutation.isPending}
                      variant="secondary"
                      className="w-full p-5 text-base border-0"
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send reset link'
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
  )
}
