'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User,
  Camera,
  Save,
  ArrowLeft,
  Edit,
  CheckCircle,
  Upload,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GamerProfileData } from '@/types'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { useAtomValue, useSetAtom } from 'jotai'
import { userAtom } from '@/atom/user'
import { PageLoader } from '@/components/ui/page-loader'
import { PageError } from '@/components/ui/page-error'
import Image from 'next/image'
import { toast } from 'sonner'

export default function ProfilePage() {
  const user = useAtomValue(userAtom)
  const setUser = useSetAtom(userAtom);
  const queryClient = useQueryClient()
  
  // Form states
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Fetch user profile data
  const { data: profileData, error: profileError, isLoading: loadingProfile } = useQuery<GamerProfileData>({
    queryKey: ["profile"],
    queryFn: () => axios.get(endpointUrl(`${ENDPOINTS.GAMER_PROFILE}`), {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }).then((res) => {
      const profile = res.data.profile
      // Initialize form data when profile loads
      setFirstName(profile.firstName || '')
      setLastName(profile.lastName || '')
      setUsername(profile.username || '')
      setAvatarPreview(profile.avatar || '')
      return profile
    }),
    enabled: !!user?.accessToken,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      firstName: string;
      lastName: string;
      username: string;
      avatar?: string;
    }) => {
      return axios.put(endpointUrl(ENDPOINTS.UPDATE_PROFILE), profileData, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });
    },
    onSuccess: (response: any) => {
      const profileData: GamerProfileData = response.data.profile
      console.log(profileData)
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      
      // Update user atom with new profile data
      if (user) {
        setUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          fullName: `${profileData.firstName} ${profileData.lastName}`,
          username: profileData.username,
          avatar: profileData.avatar
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || "Failed to update profile. Please try again.");
    },
  })

  // Separate mutation for avatar upload
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      return axios.put(endpointUrl(ENDPOINTS.UPDATE_PROFILE), formData, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (response: any) => {
      const profileData: GamerProfileData = response.data.profile
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile picture updated successfully!");
      
      // Update user atom with new avatar
      if (user) {
        setUser({
          ...user,
          avatar: profileData.avatar
        });
      }
      setIsUploadingAvatar(false);
    },
    onError: (error: any) => {
      console.error('Failed to upload avatar:', error);
      toast.error(error.response?.data?.message || "Failed to upload profile picture. Please try again.");
      setIsUploadingAvatar(false);
    },
  })

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload the file immediately
      setIsUploadingAvatar(true)
      uploadAvatarMutation.mutate(file)
    }
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = ''
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Prepare profile data for submission (excluding avatar)
      const profileUpdateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
      }

      // Validate required fields
      if (!profileUpdateData.firstName || !profileUpdateData.lastName || !profileUpdateData.username) {
        toast.error("Please fill in all required fields");
        setIsSaving(false);
        return;
      }

      await updateProfileMutation.mutateAsync(profileUpdateData);
    } catch (error) {
      // Error handling is done in the mutation's onError
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancel = () => {
    // Reset form data to original values (excluding avatar)
    if (profileData) {
      setFirstName(profileData.firstName || '')
      setLastName(profileData.lastName || '')
      setUsername(profileData.username || '')
    }
    setIsEditing(false)
  }

  if (loadingProfile) {
    return <PageLoader message="Loading profile..." />
  }

  if (profileError) {
    return (
      <PageError 
        title="Failed to Load Profile"
        message="Unable to load your profile data. Please check your connection and try again."
      />
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Link href={routes.USER.DASHBOARD}>
            <Button variant="outline" size="icon" className="border-white/20 text-white/70 hover:bg-white/90">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white font-fredoka">
              Profile Settings
            </h1>
            <p className="text-white/70">
              Update your personal information and avatar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-secondary" />
                Profile Picture
              </CardTitle>
              <CardDescription className="text-white/70">
                Upload a new avatar or keep your current one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-white/90 border-4 border-white/20 flex items-center justify-center">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Profile"
                        width={128}
                        height={128}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-white/60" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
                <div className="mt-4 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-file-input"
                    disabled={isUploadingAvatar}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border-white/20 text-white/70 hover:bg-white/90"
                    onClick={() => document.getElementById('avatar-file-input')?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-white/70" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-secondary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      Update your name and username
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      variant="outline" 
                      className="border-white/20 text-white/70 hover:bg-white/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 text-white focus:ring-secondary focus:border-secondary placeholder:text-white/40 disabled:opacity-50"
                      placeholder="Enter your first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 text-white focus:ring-secondary focus:border-secondary placeholder:text-white/40 disabled:opacity-50"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                    className="bg-white/5 border-white/20 text-white focus:ring-secondary focus:border-secondary placeholder:text-white/40 disabled:opacity-50"
                    placeholder="Choose a unique username"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData?.email || ''}
                    disabled
                    className="bg-white/5 border-white/20 text-white/60 focus:ring-secondary focus:border-secondary cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || updateProfileMutation.isPending}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
                    >
                      {(isSaving || updateProfileMutation.isPending) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin text-secondary-foreground" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving || updateProfileMutation.isPending}
                      className="border-white/20 text-white/70 hover:bg-white/90"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Account Stats */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Account Information
            </CardTitle>
            <CardDescription className="text-white/70">
              Your account statistics and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white font-fredoka">
                  {profileData?.analytics?.lifetime?.puzzlesSolved || 0}
                </p>
                <p className="text-white/60 text-sm">Puzzles Solved</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white font-fredoka">
                  {profileData?.analytics?.lifetime?.totalPoints || 0}
                </p>
                <p className="text-white/60 text-sm">Total Points</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-white font-fredoka">
                  ₦{profileData?.analytics?.lifetime?.totalEarnings || 0}
                </p>
                <p className="text-white/60 text-sm">Total Earnings</p>
              </div>
            </div>
            <div className={`mt-6 p-4 rounded-lg border ${
              profileData?.isVerified 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className={`flex items-center gap-2 ${
                profileData?.isVerified ? 'text-green-400' : 'text-yellow-400'
              }`}>
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">
                  Account Status: {profileData?.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <p className="text-white/70 text-sm mt-1">
                {profileData?.isVerified 
                  ? 'Your account is verified and you can participate in all campaigns.'
                  : 'Your account is not yet verified. Some features may be limited.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}