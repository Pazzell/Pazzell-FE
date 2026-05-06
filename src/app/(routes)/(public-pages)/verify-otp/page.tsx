'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GradientButton } from '@/components/ui/gradient-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { toast } from 'sonner'
import { BrandProfileData, GamerProfileData, UserData } from '@/types'
import { useSetAtom } from 'jotai/react'
import { userAtom } from '@/atom/user'
import { routes } from '@/app/_utils/routes'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

type VerifyOTPPayload = {
  activation_token: string
  activation_code: string
}

function VerifyOTPForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setUser = useSetAtom(userAtom)
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [activationToken, setActivationToken] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('activation_token')
    
    if (emailParam) setEmail(emailParam)
    if (tokenParam) setActivationToken(tokenParam)
    
    // Redirect if missing required params
    if (!emailParam || !tokenParam) {
      toast.error('Invalid verification link')
      router.push(routes.REGISTER)
    }
  }, [searchParams, router])

  const verifyOTPMutation = useMutation({
    mutationFn: (payload: VerifyOTPPayload) => {
      return axios.post(endpointUrl(ENDPOINTS.ACTIVATE_USER), payload)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed'
      toast.error('Error', {
        description: errorMessage,
      })
    },
    onSuccess: (data) => {
      const loginData = data.data
      if(loginData.user.role === 'gamer'){
        axios.get(endpointUrl(`${ENDPOINTS.GAMER_PROFILE}`), 
        {
          headers: {
              Authorization: `Bearer ${loginData.accessToken}`,
          },
        }).then((response) => {
          const gamerData: GamerProfileData = response.data.profile;
          console.log(gamerData)
          setUser({
            id: gamerData._id,
            firstName: gamerData.firstName,
            lastName: gamerData.lastName,
            fullName: `${gamerData.firstName} ${gamerData.lastName}`,
            avatar: gamerData.avatar,
            username: gamerData.username,
            email: gamerData.email,
            userType: gamerData.role,
            leaderboardPosition: gamerData.leaderboardPosition,
            isVerified: gamerData.isVerified,
            createdAt: gamerData.createdAt,
            accessToken: loginData.accessToken,
            refreshToken: loginData.refreshToken,
          });
          toast.success('Success', {
            description: 'Account verified successfully!',
          })
          router.push(routes.USER.DASHBOARD);
        });
      }else{
        axios.get(endpointUrl(`${ENDPOINTS.BRAND_PROFILE}`), 
        {
          headers: {
              Authorization: `Bearer ${loginData.accessToken}`,
          },
        }).then((response) => {
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
          toast.success('Success', {
            description: 'Account verified successfully!',
          })
            router.push(routes.BRAND.DASHBOARD);
        });
      }
    },
  })

  const handleOTPChange = (value: string) => {
    setOtp(value)
    
    // Auto-submit when OTP is complete
    if (value.length === 4) {
      handleSubmit(value)
    }
  }

  const handleSubmit = (otpValue?: string) => {
    const codeToSubmit = otpValue || otp
    
    if (codeToSubmit.length !== 4) {
      toast.error('Please enter a 4-digit code')
      return
    }

    verifyOTPMutation.mutate({
      activation_token: activationToken,
      activation_code: codeToSubmit,
    })
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
              Verify Your Account
            </h1>
            <p className="text-white/50 text-center text-sm mb-2">
              We&apos;ve sent a 4-digit code to
            </p>
            <p className="text-secondary text-center text-sm font-medium mb-6">
              {email}
            </p>

            <div className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={otp}
                  onChange={handleOTPChange}
                  disabled={verifyOTPMutation.isPending}
                  className="gap-3"
                >
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot 
                      index={0} 
                      className="w-12 h-12 text-lg font-bold bg-white/10 border-white/20 text-white focus:border-secondary focus:bg-white/20"
                    />
                    <InputOTPSlot 
                      index={1} 
                      className="w-12 h-12 text-lg font-bold bg-white/10 border-white/20 text-white focus:border-secondary focus:bg-white/20"
                    />
                    <InputOTPSlot 
                      index={2} 
                      className="w-12 h-12 text-lg font-bold bg-white/10 border-white/20 text-white focus:border-secondary focus:bg-white/20"
                    />
                    <InputOTPSlot 
                      index={3} 
                      className="w-12 h-12 text-lg font-bold bg-white/10 border-white/20 text-white focus:border-secondary focus:bg-white/20"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Verify Button */}
              <GradientButton 
                onClick={() => handleSubmit()}
                disabled={verifyOTPMutation.isPending || otp.length !== 4}
                className="w-full py-6 text-base"
                variant='secondary'
              >
                {verifyOTPMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Account'
                )}
              </GradientButton>

              {/* Resend Link */}
              <div className="text-center">
                <p className="text-white/50 text-sm mb-2">
                  Didn&apos;t receive the code?
                </p>
                <Button variant="link" className="p-0 h-auto text-secondary hover:text-secondary/80 font-medium">
                  Resend code
                </Button>
              </div>

              {/* Back to Registration Link */}
              <div className="text-center pt-4 border-t border-white/10">
                <Link href={routes.REGISTER} className="inline-flex items-center gap-2 text-white/70 hover:text-secondary transition-colors text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back to registration
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyOTPForm />
    </Suspense>
  )
}