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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PLAN_QUERY_KEY } from '@/hooks/use-plan'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'
import type { VerifyPaymentResponse } from '@/types'

const POLL_DELAYS_MS = [3000, 5000, 8000, 13000, 20000, 30000]

function PaymentVerify() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAtomValue(userAtom)
  const queryClient = useQueryClient()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [result, setResult] = useState<VerifyPaymentResponse | null>(null)
  // How many times a still-pending payment has been re-checked.
  const [pollCount, setPollCount] = useState(0)

  const reference = searchParams.get('reference') || searchParams.get('trxref')

  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      return api.get<VerifyPaymentResponse>(ENDPOINTS.PAYMENTS_VERIFY(reference as string))
    },
    onSuccess: (response) => {
      const data = response.data
      setResult(data)
      if (data.payment.status === 'success') {
        setVerificationStatus('success')
        queryClient.invalidateQueries({ queryKey: PLAN_QUERY_KEY })
      } else if (data.payment.status === 'pending') {
        setVerificationStatus('pending')
      } else {
        setVerificationStatus('failed')
      }
    },
    onError: () => {
      setVerificationStatus('failed')
    },
  })

  useEffect(() => {
    if (reference && user?.accessToken) {
      verifyPaymentMutation.mutate()
    } else if (!reference) {
      setVerificationStatus('failed')
    }
  }, [reference, user?.accessToken])

  // Poll while the gateway hasn't confirmed yet. The delays stretch out because the API
  // allows only a handful of verify calls per 10 minutes.
  const waitedTooLong = pollCount >= POLL_DELAYS_MS.length
  useEffect(() => {
    if (verificationStatus !== 'pending' || waitedTooLong) return
    const timeout = setTimeout(() => {
      setPollCount((count) => count + 1)
      verifyPaymentMutation.mutate()
    }, POLL_DELAYS_MS[pollCount])
    return () => clearTimeout(timeout)
  }, [verificationStatus, pollCount, waitedTooLong])

  const handleContinue = () => {
    if (result?.payment.purpose === 'pro') {
      router.push(routes.USER.PRO)
    } else if (result?.campaign) {
      router.push(routes.BRAND.CAMPAIGN_DASHBOARD(result.campaign.id))
    } else {
      router.push(routes.USER.HOME)
    }
  }

  const formatCurrency = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              {(verificationStatus === 'loading' || verificationStatus === 'pending') && (
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
              {verificationStatus === 'pending' && 'Waiting for Confirmation...'}
              {verificationStatus === 'success' && 'Payment Successful!'}
              {verificationStatus === 'failed' && 'Payment Verification Failed'}
            </CardTitle>

            <p className="text-white/70">
              {verificationStatus === 'loading' && 'Please wait while we confirm your payment'}
              {verificationStatus === 'pending' && (waitedTooLong
                ? 'This is taking longer than usual. Your payment is not lost: check again in a few minutes.'
                : 'The payment gateway is still processing this transaction')}
              {verificationStatus === 'success' && 'Your payment has been processed successfully'}
              {verificationStatus === 'failed' && 'There was an issue verifying your payment'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {result && verificationStatus === 'success' && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Purpose:</span>
                    <span className="text-white capitalize">{result.payment.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Amount:</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(result.payment.amount, result.payment.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Status:</span>
                    <span className="text-green-400 font-semibold capitalize">{result.payment.status}</span>
                  </div>
                </div>
              </div>
            )}

            {reference && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3">Transaction Reference</h3>
                <span className="text-white font-mono text-xs break-all">{reference}</span>
              </div>
            )}

            {verificationStatus === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">Verification Failed</span>
                </div>
                <p className="text-red-300 text-sm mb-3">
                  We were unable to verify your payment. This could be due to a network issue or invalid payment reference.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleContinue}
                disabled={verificationStatus === 'loading' || verificationStatus === 'pending'}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                Continue
              </Button>

              {verificationStatus === 'failed' && (
                <Button
                  onClick={() => verifyPaymentMutation.mutate()}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              )}
            </div>

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

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentVerify />
    </Suspense>
  )
}
