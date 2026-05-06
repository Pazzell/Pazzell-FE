"use client"

import React, {useState} from 'react'
import {QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient()

const TanstackProvider = ({children}:{children:React.ReactNode}) => { 
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
      // If no Google Client ID is provided, skip Google OAuth provider
      if (!googleClientId) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
                {/* <ReactQueryDevtools initialIsOpen={false} position="top"/> */}
            </QueryClientProvider>
        );
      }
    
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <QueryClientProvider client={queryClient}>
                {children}
                {/* <ReactQueryDevtools initialIsOpen={false} position="top"/> */}
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
}

export default TanstackProvider