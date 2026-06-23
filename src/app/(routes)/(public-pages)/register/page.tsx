'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAtomValue } from 'jotai/react'
import { userAtom } from '@/atom/user'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { GradientButton } from '@/components/ui/gradient-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from 'zod'
import { User, Building, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { routes } from '@/app/_utils/routes'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import GoogleAuthBtn from '@/components/auth/google-auth'

type RegisterUserPayload  = {
  firstName: string
  lastName: string
  email: string
  password: string
  referrerUsername?: string
}

type RegisterBrandPayload = {
  name: string
  email: string
  password: string
  companyName: string
}

const userRegistrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
})

const brandRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.email('Please enter a valid email address'),
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
})

type UserRegistrationValues = z.infer<typeof userRegistrationSchema>
type BrandRegistrationValues = z.infer<typeof brandRegistrationSchema>

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const [userType, setUserType] = useState<'user' | 'brand'>(
    (searchParams.get('type') as 'user' | 'brand') || 'user'
  )
  const referrerUsername =
    searchParams.get('ref') ||
    searchParams.get('referralCode') ||
    searchParams.get('referrerUsername') ||
    searchParams.get('referrerId') ||
    undefined

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      if (user.userType === 'gamer') {
        router.push(routes.USER.DASHBOARD);
      } else if (user.userType === 'brand') {
        router.push(routes.BRAND.DASHBOARD);
      }
    }
  }, [user, router]);
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showBrandPassword, setShowBrandPassword] = useState(false)


  const registerUser = useMutation({
    mutationFn: (payload: RegisterUserPayload) => {
        return axios.post(endpointUrl(`${ENDPOINTS.REGISTER_GAMER}`), payload);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      toast.error('Error', {
        description: errorMessage,
      })
      console.log(error);
    },
    onSuccess: async (data, variables) => {
      toast.success('Success', {
        description: 'Registered successfully!',
      })
      router.push(`${routes.VERIFY_OTP}?email=${variables.email}&activation_token=${data.data.activationToken}`);
    },
  });

  const registerBrand = useMutation({
    mutationFn: (payload: RegisterBrandPayload) => {
        return axios.post(endpointUrl(`${ENDPOINTS.REGISTER_BRAND}`), payload);
    },
    onError: (error:any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      toast.error('Error', {
        description: errorMessage,
      })
      console.log(error);
    },
    onSuccess: async (data, variables) => {
      toast.success('Success', {
        description: 'Registered successfully!',
      })
      router.push(`${routes.VERIFY_OTP}?email=${variables.email}&activation_token=${data.data.activationToken}`);
    },
  });
  
  const userForm = useForm<UserRegistrationValues>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  })
  
  const brandForm = useForm<BrandRegistrationValues>({
    resolver: zodResolver(brandRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      password: '',
    },
  })
  
  const googleAuthMutation = useMutation({
    mutationFn: () => {
      return axios.post(endpointUrl(`${ENDPOINTS.GOOGLE_AUTH}`), {});
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Google authentication failed'
      toast.error('Error', {
        description: errorMessage,
      })
      console.log(error);
    },
    onSuccess: async (data) => {
      const authData = data.data
      toast.success('Success', {
        description: 'Google registration successful!',
      })
      // Redirect to appropriate dashboard based on user role
      if (authData.user.role === 'gamer') {
        router.push(routes.USER.DASHBOARD);
      } else {
        router.push(routes.BRAND.DASHBOARD);
      }
    },
  });

  const onSubmitUser = (data: UserRegistrationValues) => {
    registerUser.mutate(referrerUsername ? { ...data, referrerUsername } : data)
  }
  
  const onSubmitBrand = (data: BrandRegistrationValues) => {
    registerBrand.mutate(data)
  }

  function handleGoogleAuth() {
    googleAuthMutation.mutate()
  }

  return (
    <div className="min-h-[120vh] flex flex-col">
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
              Create account
            </h1>
            <p className="text-white/50 text-center text-sm mb-6">
              Start your puzzle journey
            </p>
            
            {/* User Type Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setUserType('user')
                  userForm.reset()
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'user'
                    ? 'bg-[#00E676] text-secondary-foreground'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Player
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType('brand')
                  brandForm.reset()
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  userType === 'brand'
                    ? 'bg-[#6C5CE7] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Building className="h-4 w-4 inline mr-2" />
                Brand
              </button>
            </div>

            {userType === 'user' ? (
              <Form {...userForm} key="user-form">
                <form className="space-y-4" onSubmit={userForm.handleSubmit(onSubmitUser)}>
                  <FormField
                    control={userForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="First name"
                            className='focus:border-secondary focus:ring-secondary' 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Last name" 
                            className='focus:border-secondary focus:ring-secondary' 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Email address" 
                            className='focus:border-secondary focus:ring-secondary' 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showUserPassword ? "text" : "password"} 
                              className='focus:border-secondary focus:ring-secondary' 
                              placeholder="Password" 
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                              onClick={() => setShowUserPassword(!showUserPassword)}
                            >
                              {showUserPassword ? (
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

                  <GradientButton 
                    type="submit" 
                    disabled={registerUser.isPending}
                    variant="secondary"
                    className="w-full p-5 text-base border-0 mt-6"
                  >
                    {registerUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </GradientButton>

                  {registerUser.error && (
                    <div className="text-red-600 text-sm text-center">
                      {(registerUser.error as any)?.response?.data?.message || 'Registration failed'}
                    </div>
                  )}
                </form>
              </Form>
            ) : (
              <Form {...brandForm} key="brand-form">
                <form className="space-y-4" onSubmit={brandForm.handleSubmit(onSubmitBrand)}>
                  <FormField
                    control={brandForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Your name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={brandForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={brandForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Company name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={brandForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showBrandPassword ? "text" : "password"} 
                              placeholder="Password" 
                              {...field} 
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                              onClick={() => setShowBrandPassword(!showBrandPassword)}
                            >
                              {showBrandPassword ? (
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

                  <GradientButton 
                    type="submit" 
                    disabled={registerBrand.isPending}
                    className="w-full p-5 text-base border-0 mt-6"
                  >
                    {registerBrand.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </GradientButton>

                  {registerBrand.error && (
                    <div className="text-red-600 text-sm text-center">
                      {(registerBrand.error as any)?.response?.data?.message || 'Registration failed'}
                    </div>
                  )}
                </form>
              </Form>
            )}
            
            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            {/* Google Button */}
            <GoogleAuthBtn referrerUsername={userType === 'user' ? referrerUsername : undefined} />
            
            <p className="text-center text-white/50 text-sm mt-6">
              Already have an account?{' '}
              <Link href={routes.LOGIN} className="text-secondary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
            
            <p className="text-sm text-center text-white/30 mt-4">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-secondary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-secondary hover:underline">
                Privacy Policy
              </Link>
            </p>
            
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}