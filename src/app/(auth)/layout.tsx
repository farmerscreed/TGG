export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#1a5c38] via-[#2d7a50] to-[#1a5c38] flex items-center justify-center p-4">
            {children}
        </main>
    )
}
