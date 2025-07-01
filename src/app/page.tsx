import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
// import Image from 'next/image'; // Logo removed

const departments = [
    { name: "MBA", id: "mba" },
    { name: "BBA", id: "bba" },
    { name: "BBA (Hons) Business Analytics", id: "bba-hons-ba" },
    { name: "B.Com", id: "bcom" },
    { name: "B.Com (Hons) ACCA", id: "bcom-hons-acca" },
    { name: "B.Com (Hons) CMA", id: "bcom-hons-cma" },
    { name: "B.Sc (Hons) Economics", id: "bsc-hons-eco" },
    { name: "B.Sc (Hons) Psychology", id: "bsc-hons-psy" },
    { name: "M.Sc Psychology", id: "msc-psy" },
    { name: "BBA-LLB", id: "bba-llb" },
    { name: "BA-LLB", id: "ba-llb" },
    { name: "LLB (Hons)", id: "llb-hons" },
    { name: "BBA (EC Campus)", id: "bba-ec" },
    { name: "B.Com(EC Campus)", id: "bcom-ec" },
    { name: "BBA (Hospitality and Event management)", id: "bba-hem" },
    { name: "B.Sc(JMC)", id: "bsc-jmc" },
    { name: "M A Public policy", id: "ma-pp" },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-blue-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          {/* <Image src="/pes-logo.png" alt="PES University Logo" width={133} height={48} className="mx-auto mb-4" /> */}
          <CardTitle className="text-4xl font-headline text-primary">PESU Playbook</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your Unified Academic Planner
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-center text-foreground pb-2">
            Select a department to view its academic calendar.
          </p>
          {departments.map((dept) => (
            <Link key={dept.id} href={`/dashboard?department=${dept.id}`} className="w-full">
              <Button size="lg" className="w-full font-semibold group">
                {dept.name} Calendar
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
        <p>&copy; {new Date().getFullYear()} PESU Playbook. Built for modern academic institutions.</p>
      </footer>
    </main>
  );
}
