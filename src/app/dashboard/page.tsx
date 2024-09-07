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

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const sidebarItems = [
        { icon: Inbox, label: 'Inbox' },
        { icon: Send, label: 'Sent' },
        { icon: Star, label: 'Starred' },
        { icon: Trash, label: 'Trash' },
    ]

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

    if (loading) return <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold text-primary">Loading...</p>
    </div>

    if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={cn(
                    "bg-white shadow-md transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="p-4 flex justify-between items-center">
                    <Button
                        className={cn(
                            "justify-start rounded-full",
                            isSidebarOpen ? "w-full" : "w-8 h-8 p-0"
                        )}
                        variant="outline"
                        onClick={toggleSidebar}
                    >
                        {isSidebarOpen ? (
                            <>
                                <Menu className="mr-2 h-4 w-4" />
                                Menu
                            </>
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                    {isSidebarOpen && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="lg:hidden"
                            onClick={toggleSidebar}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <nav className="mt-4 space-y-1 px-3">
                    <TooltipProvider>
                        {sidebarItems.map((item) => (
                            <Tooltip key={item.label} delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start rounded-full hover:bg-gray-100",
                                            !isSidebarOpen && "w-10 h-10 p-0"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isSidebarOpen && "mr-2")} />
                                        {isSidebarOpen && item.label}
                                    </Button>
                                </TooltipTrigger>
                                {!isSidebarOpen && (
                                    <TooltipContent side="right">
                                        <p>{item.label}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </nav>
            </div>

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
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-2 py-2">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer group 
              ${!email.isRead ? 'border-l-4 border-blue-500 pl-2' : 'pl-3'}
              hover:scale-[1.02] hover:-translate-y-1 hover:z-10 relative`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h2 className="text-sm font-semibold truncate pr-2 group-hover:text-blue-600 transition-colors duration-300">
                                                {email.subject}
                                            </h2>
                                            <span className="text-xs text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors duration-300">
                                                {email.date}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate group-hover:text-gray-800 transition-colors duration-300">
                                            {email.sender}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5 group-hover:hidden transition-opacity duration-300">
                                            {email.preview}
                                        </p>
                                        <p className="text-xs text-blue-500 mt-0.5 hidden group-hover:block transition-opacity duration-300">
                                            Click to open
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <MoreVertical className="h-4 w-4" />
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
                                </div>
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
                                        <Button onClick={() => { handleSendReply(aiReply) }}>
                                            Send Reply
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