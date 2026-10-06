import React from 'react';
import Header from "@/components/Header";
import AIChatWidget from "@/components/AIChatWidget";
import { ChatProvider } from "@/components/ChatProvider";

const  Layout = ({children}: {children: React.ReactNode}) => {
    return (
        <ChatProvider>
            <main className="min-h-screen text-gray-400">
                <Header />
                <div className='container py-10'>
                    {children}
                </div>
                <AIChatWidget />
            </main>
        </ChatProvider>
    );
};

export default  Layout;
