'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"

export default function SignInPage() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 bg-white rounded-lg shadow-md">
                    <p className="mb-4 text-lg text-center text-gray-800">
                        Signed in as <span className="font-semibold">{session.user?.email}</span>
                    </p>
                    <Button 
                        onClick={() => signOut()}
                        className="w-full"
                        variant="destructive"
                    >
                        Sign out
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
                <p className="mb-4 text-lg text-center text-gray-800">Not signed in</p>
                <Button 
                    onClick={() => signIn('google')}
                    className="w-full"
                >
                    Sign in with Google
                </Button>
            </div>
        </div>
    )
}