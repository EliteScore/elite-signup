"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface TermsAndPrivacyModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export function TermsAndPrivacyModal({ isOpen, onClose, onAccept }: TermsAndPrivacyModalProps) {
  const [agreed, setAgreed] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAgreed(false)
      setHasScrolled(false)
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50
    if (isScrolledToBottom && !hasScrolled) {
      setHasScrolled(true)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto p-6 max-h-[90vh] flex flex-col"
          initial={{ y: "-100vh", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100vh", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
        >
          <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900">Terms of Service</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
              <X size={24} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-4 py-4 text-zinc-700 text-sm" ref={scrollRef} onScroll={handleScroll}>
            <h3 className="text-lg font-semibold text-zinc-900 mb-3">EliteScore — Terms of Service and Privacy Policy</h3>
            <p className="text-xs text-zinc-500 mb-4">Last Updated: October 2025</p>

            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Overview</h4>
                <p className="mb-3">Welcome to EliteScore, a platform that helps users evaluate resumes, receive AI-powered feedback, and complete skill challenges, referred to as the Services. By using EliteScore, you agree to this Terms of Service and Privacy Policy, referred to as the Agreement. If you do not agree, please stop using the Services.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Eligibility and Use</h4>
                <p className="mb-3">You may use the Services only if you are at least 16 years old or older where required by law. You must use the Services only for lawful purposes and must not upload or submit any information that violates the rights of others or any applicable laws. You are responsible for all information and files you upload, called User Content.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">AI Processing and Third-Party Providers</h4>
                <p className="mb-3">EliteScore uses OpenAI's API Services to process and analyze your submissions. This includes resume scoring, challenge evaluations, and generating AI-based recommendations.</p>
                <p className="mb-3">OpenAI, L.L.C. provides the underlying AI technology. Certain data, called Designated Content, may be shared with OpenAI and used for model improvement, training, and research, in accordance with the OpenAI Content Sharing Agreement available at <a href="https://openai.com/policies/business-terms" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">https://openai.com/policies/business-terms</a>. Only data explicitly marked or designated for sharing is used this way. All other data is processed only for providing the EliteScore service.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Data Responsibility</h4>
                <ul className="list-disc list-inside space-y-1 pl-4 mb-3">
                  <li>EliteScore acts as a Data Controller for general user data.</li>
                  <li>OpenAI acts as an Independent Data Controller for any Designated Content used for research or model training.</li>
                  <li>For all other processing, OpenAI acts as a Data Processor under its Data Processing Addendum.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Prohibited Data</h4>
                <p className="mb-3">You agree not to upload health or medical data, also known as Protected Health Information, personal data of children under 13 years old or below the digital age of consent in your region, or any financial, biometric, or sensitive data you do not wish to be processed by AI services.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Ownership and Rights</h4>
                <p className="mb-3">You retain ownership of all User Content you upload. By submitting data, you grant EliteScore a limited, worldwide, royalty-free license to process and display that content for the operation of the Services. EliteScore and its licensors retain ownership of all intellectual property rights related to the platform, algorithms, and features.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Data We Collect</h4>
                <p className="mb-3">EliteScore may collect and process data that you provide, including resumes, text entries, uploads, or challenge submissions. It may also collect technical information such as device details, timestamps, and browser type, as well as optional data you provide when creating an account or upgrading your plan.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Purpose and Legal Basis of Processing</h4>
                <p className="mb-3">EliteScore processes data for the following purposes: to operate and improve the platform, to generate feedback and scoring using OpenAI, to prevent fraud and misuse, and to communicate updates and account information. The legal bases under GDPR include the performance of contract, legitimate interest, consent, and legal obligations.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Data Sharing and Third Parties</h4>
                <p className="mb-3">Your data may be shared only as necessary with OpenAI for AI processing, with hosting and infrastructure providers such as Heroku or AWS for secure data storage, and with payment processors for managing paid plans. EliteScore does not sell or rent personal data.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Data Retention</h4>
                <p className="mb-3">EliteScore retains data only as long as necessary to provide and improve the Services, comply with legal requirements, or resolve disputes. You may request deletion of your data at any time by contacting us as described below.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">International Data Transfers</h4>
                <p className="mb-3">Data may be transferred to and processed in the United States by OpenAI or other service providers. Such transfers are protected through Standard Contractual Clauses and other safeguards required under GDPR.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Your Rights under GDPR</h4>
                <p className="mb-3">You have the right to access your data, correct inaccuracies, delete your data, withdraw consent, request data portability, and object to certain processing activities. To exercise these rights, contact us at: <a href="mailto:support@elite-score.com" className="text-purple-600 hover:underline">support@elite-score.com</a></p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Security</h4>
                <p className="mb-3">EliteScore implements technical and organizational measures to protect your data, including encryption and secure transmission protocols. However, no system is entirely secure, and you use the Services at your own risk.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Limitation of Liability</h4>
                <p className="mb-3">To the maximum extent permitted by law, EliteScore and its affiliates are not liable for indirect, incidental, or consequential damages, or for loss of data arising from use of the Services.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Termination</h4>
                <p className="mb-3">EliteScore may suspend or terminate your access if you violate this Agreement or misuse the Services. Upon termination, your right to use the Services ends immediately.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Changes to this Agreement</h4>
                <p className="mb-3">EliteScore may update this Agreement periodically. Any updates will be posted within the application or on the official website. Continued use after updates are published means you accept the revised terms.</p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-zinc-900 mb-2">Summary</h4>
                <p className="mb-3">EliteScore values transparency, data protection, and user trust. We process only the information required to operate the service effectively and only share limited data with trusted partners such as OpenAI under strict agreements.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center pt-4 border-t border-zinc-200">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out rounded focus:ring-purple-500"
              />
              <label htmlFor="agreeTerms" className="text-sm text-zinc-700 select-none">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
              >
                I DISAGREE
              </button>
              <button
                onClick={onAccept}
                disabled={!agreed || !hasScrolled}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  agreed && hasScrolled
                    ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                }`}
              >
                I AGREE
              </button>
            </div>
            {!hasScrolled && (
              <p className="text-xs text-zinc-500 mt-2 animate-pulse">Please scroll to the bottom to enable the "I AGREE" button.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

