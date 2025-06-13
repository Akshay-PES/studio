
// Layout for authentication pages (login, signup, etc.)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-blue-100">
      {children}
    </div>
  );
}
