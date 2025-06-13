
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-blue-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image src="/pes-logo.png" alt="PES University Logo" width={133} height={48} className="mx-auto mb-4" />
          <CardTitle className="text-4xl font-headline text-primary">AcademiaSync</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your Unified Academic Planner
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <p className="text-center text-foreground">
            Streamline your academic schedule, manage events, and stay organized with AcademiaSync.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="w-full font-semibold group">
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AcademiaSync. Built for modern academic institutions.</p>
      </footer>
    </main>
  );
}
