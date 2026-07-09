import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Space Oracle CRM | Premium Real Estate Management",
  description: "An exclusive platform for managing real estate properties and client relations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-24 pb-12">
              <div className="premium-container">
                {children}
              </div>
            </main>
            <footer className="py-8 bg-[#1a2e29] text-white">
              <div className="premium-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="relative h-8 w-8">
                        <div className="relative flex items-center justify-center h-full w-full rounded-full bg-gradient-to-br from-[#1a2e29] to-[#264a42]">
                          <span className="text-[#c69c6d] font-bold text-sm">SO</span>
                        </div>
                      </div>
                      <div className="font-bold text-lg">SPACE ORACLE</div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Delivering exceptional real estate solutions with unparalleled client experience and support.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[#c69c6d] font-medium mb-4">Quick Links</h3>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link></li>
                      <li><Link href="/enquiry/new" className="text-gray-300 hover:text-white transition-colors">New Enquiry</Link></li>
                      <li><Link href="/enquiry/list" className="text-gray-300 hover:text-white transition-colors">Enquiries</Link></li>
                      <li><Link href="/site-visits" className="text-gray-300 hover:text-white transition-colors">Site Visits</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[#c69c6d] font-medium mb-4">Connect With Us</h3>
                    <p className="text-gray-300 text-sm mb-2">
                      Need assistance? Our support team is available 24/7.
                    </p>
                    <a href="#" className="inline-block px-4 py-2 bg-[#c69c6d] text-white rounded-lg text-sm font-medium hover:bg-[#9d7952] transition-colors">
                      Contact Support
                    </a>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-600 text-center text-gray-400 text-sm">
                  &copy; {new Date().getFullYear()} Space Oracle CRM. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
