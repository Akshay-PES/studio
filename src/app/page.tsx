
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

const standards = [
    { name: "1st Standard", id: "std-1" },
    { name: "2nd Standard", id: "std-2" },
    { name: "3rd Standard", id: "std-3" },
    { name: "4th Standard", id: "std-4" },
    { name: "5th Standard", id: "std-5" },
    { name: "6th Standard", id: "std-6" },
    { name: "7th Standard", id: "std-7" },
    { name: "8th Standard", id: "std-8" },
    { name: "9th Standard", id: "std-9" },
    { name: "10th Standard", id: "std-10" },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-blue-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image src="/jnanodaya-logo.png" alt="Jnanodaya school Logo" width={300} height={78} className="mx-auto mb-4" />
          <CardTitle className="text-4xl font-headline text-primary">Jnanodaya school</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your Unified Academic Planner
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-center text-foreground pb-2">
            Select a standard to view its academic calendar.
          </p>
          {standards.map((std) => (
            <Link key={std.id} href={`/dashboard?department=${std.id}`} className="w-full">
              <Button size="lg" className="w-full font-semibold group">
                {std.name} Calendar
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          ))}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
            <Link href="/login">
                <Button variant="link">Admin Login</Button>
            </Link>
        </CardFooter>
      </Card>
      <footer className="mt-12 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Jnanodaya school. Built for modern academic institutions.</p>
      </footer>
    </main>
  );
}
