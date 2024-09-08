'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import axios from 'axios'
import { Search, Inbox, Send, Star, Trash, Menu, Plus, ChevronDown, ChevronRight, X, User, Settings, LogOut, Loader2, MoreVertical, Sparkles, Reply, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import DashboardLoading from '@/components/shared/DashboardLoading'
import SideBar from '@/components/shared/SideBar'
import dynamic from 'next/dynamic'
import SuccessMessage from '@/components/shared/SuccessMessage'

// Dynamically import react-confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false });

interface CustomSession extends Session {
    accessToken?: string
}

interface Email {
    id: string
    subject: string
    sender: string
    preview: string
    date: string
    isRead: boolean
}

export default function Dashboard() {
    const { data: session } = useSession() as { data: CustomSession | null }
    const [emails, setEmails] = useState<Email[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
    const [summary, setSummary] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [aiReply, setAiReply] = useState('');
    const [isReplyLoading, setIsReplyLoading] = useState(false);


    const [isSendLoading, setIsSendLoading] = useState(false);

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleSummarize = async (email: Email) => {
        setSelectedEmail(email);
        setIsModalOpen(true);
        setIsLoading(true);

        try {
            if (session?.accessToken) {
                // Construct the payload for the request
                const response = await axios.post('/api/emails/summarize',
                    {
                        emailId: email.id
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.accessToken}`
                        },
                    }
                );

                const data = await response.data;
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error summarizing email:', error);
            setSummary('Failed to generate summary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReply = async (email: any) => {
        setSelectedEmail(email);
        setIsReplyModalOpen(true);
        setIsReplyLoading(true);
        try {
            if (session?.accessToken) {
                const response = await axios.post('/api/emails/reply',
                    { emailId: email.id },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    }
                );
                setAiReply(response.data.reply);
            }
        } catch (error) {
            console.error('Error generating reply:', error);
            setAiReply('Failed to generate reply. Please try again.');
        } finally {
            setIsReplyLoading(false);
        }
    };

    const handleSendReply = async (email: any) => {
        // setSelectedEmail(email);
        setIsSendLoading(true);
        try {
            if (session?.accessToken) {
                const response = await axios.post('/api/emails',
                    {
                        emailId: selectedEmail?.id,
                        replyBody: aiReply
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.accessToken}`
                        }
                    }
                );
                setAiReply('');
                setShowConfetti(true);
                setShowSuccessMessage(true);
                // Hide success message after 3 seconds
                setTimeout(() => setShowSuccessMessage(false), 3000);
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            setAiReply('Failed to send reply. Please try again.');
        } finally {
            setIsSendLoading(false);
            handleCloseSendModal()
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmail(null);
        setAiReply('');
    };

    const handleCloseSendModal = () => {
        setIsReplyModalOpen(false);
        setSelectedEmail(null);
        setAiReply('');
    };

    const handleReplyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAiReply(event.target.value)
    }


    useEffect(() => {
        async function loadEmails() {
            if (session?.accessToken) {
                try {
                    const response = await axios.get('/api/emails', {
                        headers: { Authorization: `Bearer ${session.accessToken}` },
                    })
                    setEmails(response.data)
                } catch (error) {
                    setError('Error fetching emails.')
                } finally {
                    setLoading(false)
                }
            }
        }

        loadEmails()
    }, [session])

    useEffect(() => {
        if (showConfetti) {
            const timer = setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [showConfetti]);

    if (loading) return <DashboardLoading />

    if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <SideBar />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm p-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Email Dashboard</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'User'} />
                                    <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => signOut({ callbackUrl: '/signin' })}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Email list */}
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-gray-200">
                        {emails.map((email, index) => (
                            <div
                                key={email.id}
                                className={`flex items-center justify-between py-3 px-4 ${index % 2 !== 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                            >
                                <h2 className="text-sm text-gray-900 truncate flex-grow">
                                    {email.subject}
                                </h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-5 w-5 text-gray-600" />
                                            <span className="sr-only">Open actions menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onSelect={() => handleSummarize(email)}>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            <span>Summarize with AI</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleGenerateReply(email)}>
                                            <Reply className="mr-2 h-4 w-4" />
                                            <span>Generate AI Reply</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>View Original</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </ScrollArea>


                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="ml-2">Generating summary...</span>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">{summary}</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {showConfetti && <ReactConfetti />}
                <SuccessMessage
                    message="Email Sent Successfully"
                    isVisible={showSuccessMessage}
                    onClose={() => setShowSuccessMessage(false)}
                />

                <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>{selectedEmail?.subject}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            {isReplyLoading ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                    <span className="ml-2">Generating AI Reply...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Textarea
                                        value={aiReply}
                                        onChange={handleReplyChange}
                                        placeholder="Edit your reply here..."
                                        className="min-h-[200px]"
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <Button variant="outline" onClick={() => {
                                            // onOpenChange(false)
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={() => { handleSendReply(aiReply) }}
                                            disabled={isSendLoading}
                                        >
                                            {isSendLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                'Send Reply'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}