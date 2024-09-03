'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import axios from 'axios'
import { Search, Inbox, Send, Star, Trash, Menu, Plus, ChevronDown, ChevronRight, X, User, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const sidebarItems = [
    { icon: Inbox, label: 'Inbox' },
    { icon: Send, label: 'Sent' },
    { icon: Star, label: 'Starred' },
    { icon: Trash, label: 'Trash' },
  ]

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

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
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
              <DropdownMenuItem className="text-red-600" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Email list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out cursor-pointer ${
                  !email.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold truncate">{email.subject}</h2>
                  <span className="text-sm text-gray-500">{email.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">{email.sender}</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{email.preview}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}