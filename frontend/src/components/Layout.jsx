import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
