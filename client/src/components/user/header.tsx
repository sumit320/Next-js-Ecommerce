"use client";

import { ArrowLeft, Menu, ShoppingBag, ShoppingCart, User, LogOut, UserCircle, X, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from "../common/SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Separator } from "../ui/separator";

const navItems = [
  {
    title: "Home",
    to: "/home",
    icon: null,
  },
  {
    title: "Shop",
    to: "/listing",
    icon: null,
  },
  {
    title: "Deals",
    to: "/deals",
    icon: null,
  },
  {
    title: "New Arrivals",
    to: "/new-arrivals",
    icon: null,
  },
  {
    title: "About Us",
    to: "/about",
    icon: null,
  },
  {
    title: "Contact",
    to: "/contact",
    icon: null,
  },
];

function Header() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileView, setMobileView] = useState<"menu" | "account">("menu");
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { fetchCart, items } = useCartStore();
  const { fetchWishlist, items: wishlistItems } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
    
    // Only fetch cart/wishlist if user is authenticated
    // Cart will load guest cart from localStorage if not authenticated
    if (user) {
      fetchCart();
      fetchWishlist();
    } else {
      // Load guest cart from localStorage
      useCartStore.getState().loadGuestCart();
    }
  }, [fetchCart, fetchWishlist, user]);

  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    // Set initial scroll state
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always redirect to login page, even if logout fails
      // Use window.location for more reliable redirect
      window.location.href = "/auth/login";
    }
  }

  const renderMobileMenuItems = () => {
    switch (mobileView) {
      case "account":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Account</h3>
              <Button
                onClick={() => setMobileView("menu")}
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            {user && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="font-semibold">{user.name || "User"}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            )}
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowSheetDialog(false);
                  router.push("/account");
                }}
              >
                <UserCircle className="mr-2 h-4 w-4" />
                Your Account
              </Button>
              <Separator />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setShowSheetDialog(false);
                  setMobileView("menu");
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        );

      default:
        return (
          <div className="space-y-6 py-4">
            <nav className="space-y-1">
              {navItems.map((navItem) => {
                const isActive = pathname === navItem.to || 
                  (navItem.to !== "/" && pathname.startsWith(navItem.to));
                return (
                  <Button
                    key={navItem.title}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start font-semibold"
                    onClick={() => {
                      setShowSheetDialog(false);
                      router.push(navItem.to);
                    }}
                  >
                    {navItem.title}
                  </Button>
                );
              })}
            </nav>
            <Separator />
            <div className="space-y-2">
              {user ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setMobileView("account")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                  <span className="ml-auto text-sm text-gray-500">
                    {user.name || user.email}
                  </span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowSheetDialog(false);
                      router.push("/auth/login");
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      setShowSheetDialog(false);
                      router.push("/auth/register");
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start relative"
                onClick={() => {
                  setShowSheetDialog(false);
                  router.push("/wishlist");
                }}
              >
                <Heart className="mr-2 h-4 w-4" />
                Wishlist
                {wishlistItems.length > 0 && (
                  <span className="ml-auto bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {wishlistItems.length}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start relative"
                onClick={() => {
                  setShowSheetDialog(false);
                  router.push("/cart");
                }}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Cart
                {items.length > 0 && (
                  <span className="ml-auto bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {items.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        mounted && isScrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-md" 
          : "bg-white shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="group flex items-center gap-1 transition-all duration-300 hover:scale-105 relative"
          >
            {/* E in Circle */}
            <div className="relative flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black text-white font-bold text-lg lg:text-xl transition-all duration-300 group-hover:bg-gray-900 group-hover:rotate-12 z-10">
              <span className="relative z-10">E</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            {/* COMMERCE Text */}
            <span className="text-xl lg:text-2xl font-bold tracking-tight relative z-10">
              <span className="text-black transition-colors duration-300 group-hover:text-gray-900">COMMERCE</span>
            </span>
            {/* Animated Underline */}
            <span className="absolute bottom-0 left-0 h-0.5 bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" 
                  style={{ width: 'calc(100% - 0.5rem)' }}></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-4xl">
            <nav className="flex items-center space-x-0.5 mr-4">
              {navItems.map((item) => {
                const isActive = pathname === item.to || 
                  (item.to !== "/" && pathname.startsWith(item.to));
                return (
                  <Link
                    href={item.to}
                    key={item.title}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-black bg-gray-100 font-semibold"
                        : "text-gray-700 hover:text-black hover:bg-gray-50"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
            <SearchBar />
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/wishlist")}
            >
              <Heart className="h-5 w-5" />
              {wishlistItems && wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white">
                  {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                </span>
              )}
            </Button>
            
            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {items && items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white">
                  {items.length > 99 ? "99+" : items.length}
                </span>
              )}
            </Button>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{user.name || "User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Your Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/auth/register")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {items && items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border border-white">
                  {items.length}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Sheet
              open={showSheetDialog}
              onOpenChange={(open) => {
                setShowSheetDialog(open);
                if (!open) setMobileView("menu");
              }}
            >
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                >
                  {showSheetDialog ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white font-bold text-lg">
                      E
                    </div>
                    <span className="text-xl font-bold tracking-tight text-black">COMMERCE</span>
                  </SheetTitle>
                </SheetHeader>
                {renderMobileMenuItems()}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
