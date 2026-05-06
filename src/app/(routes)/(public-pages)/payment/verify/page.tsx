'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  CreditCard,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'

interface PaymentVerificationResponse {
  success: boolean
  message: string
  transaction: {
    reference: string
    amount: number
    status: 'success' | 'failed' | 'pending'
    packageType: string
  }
}

function PaymentVerify() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAtomValue(userAtom)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [paymentData, setPaymentData] = useState<PaymentVerificationResponse | null>(null)

  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')

  // Payment verification mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      return axios.get<PaymentVerificationResponse>(
        endpointUrl(`${ENDPOINTS.VERIFY_PAYMENT}/${reference}`),
        {
          headers:{
            Authorization: `Bearer ${user?.accessToken}`
          }
        }
      )
    },
    onSuccess: (response) => {
      const data = response.data
      setPaymentData(data)
      
      if (data.success && data.transaction.status === 'success') {
        setVerificationStatus('success')
      } else {
        setVerificationStatus('failed')
      }
    },
    onError: (error) => {
      console.error('Payment verification failed:', error)
      setVerificationStatus('failed')
    },
  })

  // const { data: verifyPaymentData, error: verifyPaymentError, isLoading: loadingVerifyPayment } = useQuery<PaymentVerificationResponse>({
  //   queryKey: ["brand-campaigns", user?.id],
  //   queryFn: () => axios.get<PaymentVerificationResponse>(endpointUrl(`${ENDPOINTS.VERIFY_PAYMENT}/${reference}`),
  //     {
  //       headers: {
  //         Authorization: `Bearer ${user?.accessToken}`,
  //       },
  //     }).then((res) => {
  //       return res.data;
  //     }),
  //   enabled: !!reference && !!user?.accessToken,
  // })

  useEffect(() => {
    if (reference && trxref && user?.accessToken) {
      verifyPaymentMutation.mutate()
    } else if (!reference || !trxref) {
      setVerificationStatus('failed')
    }
  }, [reference, trxref, user?.accessToken])

  const handleReturnToCampaigns = () => {
    if (user?.userType === 'brand') {
      router.push(routes.BRAND.CAMPAIGNS)
    } else {
      router.push(routes.CAMPAIGNS)
    }
  }

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              {verificationStatus === 'loading' && (
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              )}
              {verificationStatus === 'success' && (
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              )}
              {verificationStatus === 'failed' && (
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-white font-fredoka text-2xl mb-2">
              {verificationStatus === 'loading' && 'Verifying Payment...'}
              {verificationStatus === 'success' && 'Payment Successful!'}
              {verificationStatus === 'failed' && 'Payment Verification Failed'}
            </CardTitle>
            
            <p className="text-white/70">
              {verificationStatus === 'loading' && 'Please wait while we confirm your payment'}
              {verificationStatus === 'success' && 'Your payment has been processed successfully'}
              {verificationStatus === 'failed' && 'There was an issue verifying your payment'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Details */}
            {paymentData && verificationStatus === 'success' && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Brand:</span>
                    <span className="text-white">{user?.companyName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Package Type:</span>
                    <span className="text-white capitalize">{paymentData.transaction.packageType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Amount:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(paymentData.transaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Status:</span>
                    <span className="text-green-400 font-semibold capitalize">{paymentData.transaction.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction References */}
            {(reference || trxref || paymentData?.transaction.reference) && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3">Transaction References</h3>
                <div className="space-y-2 text-sm">
                  {/* {paymentData?.transaction.reference && (
                    <div className="flex flex-col gap-1">
                      <span className="text-white/70">Payment Reference:</span>
                      <span className="text-white font-mono text-xs break-all">{paymentData.transaction.reference}</span>
                    </div>
                  )}
                  {reference && reference !== paymentData?.transaction.reference && (
                    <div className="flex flex-col gap-1">
                      <span className="text-white/70">URL Reference:</span>
                      <span className="text-white font-mono text-xs break-all">{reference}</span>
                    </div>
                  )} */}
                  {trxref && (
                    <div className="flex flex-col gap-1">
                      <span className="text-white/70">Transaction Ref:</span>
                      <span className="text-white font-mono text-xs break-all">{trxref}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {verificationStatus === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">Verification Failed</span>
                </div>
                <p className="text-red-300 text-sm mb-3">
                  {paymentData?.message || 
                   'We were unable to verify your payment. This could be due to a network issue or invalid payment reference.'}
                </p>
                <p className="text-red-300/80 text-xs">
                  If you believe this is an error, please contact support with your transaction reference.
                </p>
              </div>
            )}

            {/* Loading State */}
            {verificationStatus === 'loading' && (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-3 text-white/70">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Contacting payment processor...</span>
                </div>
                <p className="text-white/50 text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleReturnToCampaigns}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {verificationStatus === 'success' ? 'View Campaigns' : 'Return to Campaigns'}
              </Button>
              
              {verificationStatus === 'failed' && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              )}
            </div>

            {/* Support Link */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm mb-2">
                Need help with your payment?
              </p>
              <Link 
                href={routes.CONTACT} 
                className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80 text-sm font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Contact Support
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link 
            href={routes.HOME}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentVerify />
    </Suspense>
  )
}