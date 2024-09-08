import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Search, Inbox, Send, Star, Trash, Menu, Plus, ChevronDown, ChevronRight, X, User, Settings, LogOut, Loader2, MoreVertical, Sparkles, Reply, Eye } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'

const SideBar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const sidebarItems = [
        { icon: Inbox, label: 'Inbox' },
        { icon: Send, label: 'Sent' },
        { icon: Star, label: 'Starred' },
        { icon: Trash, label: 'Trash' },
    ]

    
    return (
        <div
      className={cn(
        "bg-gray-100 border-r border-gray-200 transition-all duration-300 ease-in-out h-screen",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <Button
          className={cn(
            "justify-start",
            isSidebarOpen ? "w-full" : "w-8 h-8 p-0"
          )}
          variant="ghost"
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
                    "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-200",
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
    )
}

export default SideBar