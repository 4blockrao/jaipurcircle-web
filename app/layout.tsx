import "./globals.css";

export const metadata = {
  title: "JaipurCircle",
  description: "Jaipur's locality-first discovery platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}