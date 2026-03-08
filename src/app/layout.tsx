import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Delight — Oscar's Piggy Bank",
    description: "Fun content API for a Bitcoin piggy bank",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=Fredoka:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <div className="dot-grid" />
                <div className="relative z-10">
                    {children}
                </div>
            </body>
        </html>
    )
}
