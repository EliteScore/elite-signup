"use client"

import React, { useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Image, Link as LinkIcon, Type, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { cn } from "@/lib/utils"

interface VerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  verificationType: "photo" | "link" | "text"
  verificationPhoto: File | null
  verificationLink: string
  verificationText: string
  isSubmittingVerification: boolean
  onTypeChange: (type: "photo" | "link" | "text") => void
  onPhotoChange: (file: File | null) => void
  onLinkChange: (link: string) => void
  onTextChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function VerificationModal({
  open,
  onOpenChange,
  verificationType,
  verificationPhoto,
  verificationLink,
  verificationText,
  isSubmittingVerification,
  onTypeChange,
  onPhotoChange,
  onLinkChange,
  onTextChange,
  onSubmit,
  onCancel,
}: VerificationModalProps) {
  const verificationPhotoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onPhotoChange(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Verify Challenge Completion
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Please provide verification to complete this challenge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Tabs value={verificationType} onValueChange={(v) => onTypeChange(v as "photo" | "link" | "text")}>
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
              <TabsTrigger value="photo" className="data-[state=active]:bg-purple-600">
                <Image className="h-4 w-4 mr-1" />
                Photo
              </TabsTrigger>
              <TabsTrigger value="link" className="data-[state=active]:bg-purple-600">
                <LinkIcon className="h-4 w-4 mr-1" />
                Link
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-purple-600">
                <Type className="h-4 w-4 mr-1" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="space-y-4 mt-4">
              <div
                className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-purple-500 transition-all cursor-pointer"
                onClick={() => verificationPhotoInputRef.current?.click()}
              >
                {verificationPhoto ? (
                  <div className="space-y-2">
                    <Image className="h-12 w-12 mx-auto text-green-400" />
                    <p className="text-sm text-white font-medium">{verificationPhoto.name}</p>
                    <p className="text-xs text-zinc-400">Click to change photo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Image className="h-12 w-12 mx-auto text-zinc-500" />
                    <p className="text-sm text-zinc-400">Click to upload photo</p>
                    <p className="text-xs text-zinc-500">JPG, PNG, or GIF • Max 10MB</p>
                  </div>
                )}
                <input
                  ref={verificationPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Verification Link</label>
                <Input
                  type="url"
                  placeholder="https://example.com/proof"
                  value={verificationLink}
                  onChange={(e) => onLinkChange(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">
                  Provide a link that proves you completed this challenge
                </p>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Verification Description</label>
                  <span className={cn(
                    "text-xs",
                    verificationText.trim().length < 50 
                      ? "text-yellow-400" 
                      : "text-green-400"
                  )}>
                    {verificationText.trim().length} / 50 characters
                  </span>
                </div>
                <Textarea
                  placeholder="Describe how you completed this challenge... (minimum 50 characters)"
                  value={verificationText}
                  onChange={(e) => onTextChange(e.target.value)}
                  className={cn(
                    "bg-zinc-800 border-zinc-700 text-white min-h-[120px]",
                    verificationText.trim().length > 0 && verificationText.trim().length < 50 && "border-yellow-500/50"
                  )}
                />
                <p className="text-xs text-zinc-500">
                  Provide a detailed description of how you completed this challenge (minimum 50 characters required)
                </p>
                {verificationText.trim().length > 0 && verificationText.trim().length < 50 && (
                  <p className="text-xs text-yellow-400">
                    {50 - verificationText.trim().length} more characters needed
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4">
            <EnhancedButton
              variant="outline"
              className="flex-1 border-zinc-700"
              onClick={onCancel}
              disabled={isSubmittingVerification}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              variant="gradient"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              onClick={onSubmit}
              disabled={isSubmittingVerification}
            >
              {isSubmittingVerification ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Verification
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </EnhancedButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

