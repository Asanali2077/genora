import { AppNav } from "@/components/app/app-nav";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
