"use client"

import { Badge } from "@/components/ui/badge"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useState } from "react"
import {
  Settings,
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  Sun,
  Smartphone,
  LogOut,
  ChevronRight,
  Check,
  Save,
} from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AnimatedSection } from "@/components/ui/animated-section"

export default function SettingsPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [mentionNotifications, setMentionNotifications] = useState(true)
  const [connectionRequests, setConnectionRequests] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    activityVisibility: "connections",
    searchVisibility: "everyone",
  })
  const [activeSection, setActiveSection] = useState("account")
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Settings sections
  const settingsSections = [
    {
      id: "account",
      title: "Account Settings",
      icon: <User className="h-5 w-5" />,
      description: "Manage your account information and preferences",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      description: "Control how you receive notifications",
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: <Lock className="h-5 w-5" />,
      description: "Manage your security settings and privacy preferences",
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: <Moon className="h-5 w-5" />,
      description: "Customize how Strivio looks for you",
    },
    {
      id: "devices",
      title: "Devices & Sessions",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Manage your connected devices and active sessions",
    },
  ]

  return (
    <DashboardLayout>
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="md:w-1/4">
            <AnimatedSection delay={0.1}>
              <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)] sticky top-20">
                <EnhancedCardHeader className="pb-2">
                  <EnhancedCardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-400" />
                    <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Settings</span>
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="p-0">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        className={cn(
                          "w-full flex items-center p-3 text-left transition-colors",
                          activeSection === section.id
                            ? "bg-blue-900/30 text-blue-400 border-r-2 border-blue-500 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white hover:border-r-2 hover:border-blue-700/40",
                        )}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <div className="mr-3">{section.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-white">{section.title}</div>
                          <div className="text-xs text-zinc-500 hidden md:block">{section.description}</div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            activeSection === section.id && "transform rotate-90",
                          )}
                        />
                      </button>
                    ))}

                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                    <button
                      className="w-full flex items-center p-3 text-left text-red-400 hover:bg-red-900/20 hover:border-r-2 hover:border-red-500/40 transition-colors"
                      onClick={() => console.log("Logout")}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      <div className="font-bold text-sm">Log Out</div>
                    </button>
                  </nav>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>
          </div>

          {/* Settings Content */}
          <div className="md:w-3/4 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Account Settings</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Profile Information</h3>
                        <p className="text-xs text-zinc-400">
                          Manage your personal information and how it appears on your profile
                        </p>
                        <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(80,0,255,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Personal Information</div>
                              <div className="text-xs text-zinc-500">Name, email, bio, and profile picture</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                            >
                              Edit
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/60 border border-purple-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(147,51,234,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Professional Information</div>
                              <div className="text-xs text-zinc-500">Work experience, education, and skills</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-purple-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(147,51,234,0.3)]"
                            >
                              Edit
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Account Preferences</h3>
                        <p className="text-xs text-zinc-400">Manage your account settings and preferences</p>
                        <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Language</div>
                              <div className="text-xs text-zinc-500">English (United States)</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-green-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(34,197,94,0.3)]"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/60 border border-fuchsia-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(217,70,239,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Time Zone</div>
                              <div className="text-xs text-zinc-500">Pacific Time (US & Canada)</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-fuchsia-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(217,70,239,0.3)]"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-red-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
                        <p className="text-xs text-zinc-400">Permanent actions that affect your account</p>
                        <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(239,68,68,0.3)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-red-400">Delete Account</div>
                              <div className="text-xs text-zinc-500">Permanently delete your account and all data</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-red-900/30 border-red-800/40 text-red-400 hover:bg-red-900/40 hover:shadow-[0_0_8px_0_rgba(239,68,68,0.4)]"
                            >
                              Delete
                            </EnhancedButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Notifications Settings */}
            {activeSection === "notifications" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Notification Settings</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white">Email Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications" className="flex items-center gap-2">
                              <span className="text-white font-medium">Email Notifications</span>
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="email-notifications"
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="weekly-digest" className="flex items-center gap-2">
                              <span className="text-white font-medium">Weekly Digest</span>
                              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">Summary</Badge>
                            </Label>
                            <Switch id="weekly-digest" checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white">Push Notifications</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications" className="flex items-center gap-2">
                              <span className="text-white font-medium">Push Notifications</span>
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                All
                              </Badge>
                            </Label>
                            <Switch
                              id="push-notifications"
                              checked={pushNotifications}
                              onCheckedChange={setPushNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="mention-notifications" className="text-white font-medium">Mentions & Comments</Label>
                            <Switch
                              id="mention-notifications"
                              checked={mentionNotifications}
                              onCheckedChange={setMentionNotifications}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="connection-requests" className="text-white font-medium">Connection Requests</Label>
                            <Switch
                              id="connection-requests"
                              checked={connectionRequests}
                              onCheckedChange={setConnectionRequests}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Security & Privacy Settings */}
            {activeSection === "security" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Security & Privacy</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Security Settings</h3>
                        <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(80,0,255,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Password</div>
                              <div className="text-xs text-zinc-500">Last changed 3 months ago</div>
                            </div>
                            <EnhancedButton
                              variant="outline"
                              size="sm"
                              rounded="full"
                              className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                            >
                              Change
                            </EnhancedButton>
                          </div>
                        </div>
                        <div className="bg-zinc-800/60 border border-purple-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(147,51,234,0.2)]">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                              <div className="text-xs text-zinc-500">{twoFactorAuth ? "Enabled" : "Disabled"}</div>
                            </div>
                            <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Privacy Settings</h3>
                        <div className="space-y-4 mt-2">
                          <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]">
                            <div className="space-y-3">
                              <div className="text-sm font-bold text-white">Profile Visibility</div>
                              <RadioGroup
                                value={privacySettings.profileVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, profileVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="profile-public" />
                                  <Label htmlFor="profile-public" className="text-white font-medium">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="profile-connections" />
                                  <Label htmlFor="profile-connections" className="text-white font-medium">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="profile-private" />
                                  <Label htmlFor="profile-private" className="text-white font-medium">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>

                          <div className="bg-zinc-800/60 border border-fuchsia-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(217,70,239,0.2)]">
                            <div className="space-y-3">
                              <div className="text-sm font-bold text-white">Activity Visibility</div>
                              <RadioGroup
                                value={privacySettings.activityVisibility}
                                onValueChange={(value) =>
                                  setPrivacySettings({ ...privacySettings, activityVisibility: value })
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="public" id="activity-public" />
                                  <Label htmlFor="activity-public" className="text-white font-medium">Public</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="connections" id="activity-connections" />
                                  <Label htmlFor="activity-connections" className="text-white font-medium">Connections Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="activity-private" />
                                  <Label htmlFor="activity-private" className="text-white font-medium">Private</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Appearance Settings */}
            {activeSection === "appearance" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Moon className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Appearance</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Theme</h3>
                        <p className="text-xs text-zinc-400">Choose how EliteScore looks for you</p>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all relative",
                              theme === "light"
                                ? "border-blue-500 bg-blue-900/20 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]"
                                : "border-zinc-700/50 bg-zinc-900/60 hover:bg-zinc-900 hover:border-blue-700/40",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("light")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-white text-black rounded-full p-2">
                                <Sun className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-bold text-white">Light</span>
                              {theme === "light" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all relative",
                              theme === "dark"
                                ? "border-blue-500 bg-blue-900/20 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]"
                                : "border-zinc-700/50 bg-zinc-900/60 hover:bg-zinc-900 hover:border-blue-700/40",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("dark")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-zinc-900 text-white rounded-full p-2">
                                <Moon className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-bold text-white">Dark</span>
                              {theme === "dark" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all relative",
                              theme === "system"
                                ? "border-blue-500 bg-blue-900/20 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]"
                                : "border-zinc-700/50 bg-zinc-900/60 hover:bg-zinc-900 hover:border-blue-700/40",
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme("system")}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-gradient-to-r from-white to-zinc-900 rounded-full p-2">
                                <Globe className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-bold text-white">System</span>
                              {theme === "system" && (
                                <div className="absolute top-2 right-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-blue-700/50 to-transparent" />

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Accent Color</h3>
                        <p className="text-xs text-zinc-400">Choose your preferred accent color</p>
                        <div className="grid grid-cols-5 gap-3 mt-3">
                          {["purple", "blue", "green", "red", "orange"].map((color) => (
                            <motion.div
                              key={color}
                              className={cn(
                                "h-10 rounded-lg cursor-pointer transition-all border-2 shadow-lg",
                                color === "purple"
                                  ? "bg-purple-500 border-purple-300 shadow-[0_0_8px_0_rgba(147,51,234,0.5)]"
                                  : color === "blue"
                                    ? "bg-blue-500 border-blue-300 shadow-[0_0_8px_0_rgba(59,130,246,0.5)]"
                                    : color === "green"
                                      ? "bg-green-500 border-green-300 shadow-[0_0_8px_0_rgba(34,197,94,0.5)]"
                                      : color === "red"
                                        ? "bg-red-500 border-red-300 shadow-[0_0_8px_0_rgba(239,68,68,0.5)]"
                                        : "bg-orange-500 border-orange-300 shadow-[0_0_8px_0_rgba(249,115,22,0.5)]",
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          Save Changes
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Devices & Sessions Settings */}
            {activeSection === "devices" && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="default" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader className="pb-2">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Devices & Sessions</span>
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="p-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Current Session</h3>
                        <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4 mt-2 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]">
                          <div className="flex items-start">
                            <div className="bg-blue-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]">
                              <Smartphone className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="text-sm font-bold text-white">Chrome on MacBook Pro</div>
                                <Badge className="ml-2 bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                  Current
                                </Badge>
                              </div>
                              <div className="text-xs text-zinc-400 mt-1">San Francisco, CA, USA</div>
                              <div className="text-xs text-zinc-500 mt-1">Last active: Just now</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white">Active Sessions</h3>
                        <div className="space-y-3 mt-2">
                          <div className="bg-zinc-800/60 border border-purple-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(147,51,234,0.2)]">
                            <div className="flex items-start">
                              <div className="bg-purple-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(147,51,234,0.3)]">
                                <Smartphone className="h-5 w-5 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-white">Safari on iPhone 13</div>
                                <div className="text-xs text-zinc-400 mt-1">San Francisco, CA, USA</div>
                                <div className="text-xs text-zinc-500 mt-1">Last active: 2 hours ago</div>
                              </div>
                              <EnhancedButton
                                variant="outline"
                                size="sm"
                                rounded="full"
                                className="bg-zinc-800/80 border-purple-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(147,51,234,0.3)]"
                              >
                                Log Out
                              </EnhancedButton>
                            </div>
                          </div>

                          <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-4 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]">
                            <div className="flex items-start">
                              <div className="bg-green-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(34,197,94,0.3)]">
                                <Smartphone className="h-5 w-5 text-green-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-white">Firefox on Windows PC</div>
                                <div className="text-xs text-zinc-400 mt-1">New York, NY, USA</div>
                                <div className="text-xs text-zinc-500 mt-1">Last active: 3 days ago</div>
                              </div>
                              <EnhancedButton
                                variant="outline"
                                size="sm"
                                rounded="full"
                                className="bg-zinc-800/80 border-green-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(34,197,94,0.3)]"
                              >
                                Log Out
                              </EnhancedButton>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <EnhancedButton
                          variant="outline"
                          rounded="full"
                          className="bg-red-900/30 border-red-800/40 text-red-400 hover:bg-red-900/40 hover:shadow-[0_0_8px_0_rgba(239,68,68,0.4)]"
                        >
                          Log Out of All Devices
                        </EnhancedButton>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

