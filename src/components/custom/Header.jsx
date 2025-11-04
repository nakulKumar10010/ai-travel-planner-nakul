import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

function Header() {
  const [openDialog, setOpenDialog] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (user) console.log("User:", user);
  }, [user]);

  const login = useGoogleLogin({
    onSuccess: (res) => getUserProfile(res),
    onError: (error) => console.error(error),
  });

  const getUserProfile = (tokenInfo) => {
    axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
            Accept: "application/json",
          },
        }
      )
      .then((resp) => {
        localStorage.setItem("user", JSON.stringify(resp.data));
        setOpenDialog(false);
        window.location.reload();
      })
      .catch((err) => console.error("Error fetching user profile:", err));
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* LEFT: Brand */}
        <Link
          to="/"
          aria-label="Go to Home"
          className="flex items-center gap-3 group"
        >
          <div className="h-14 w-14 flex items-center justify-center rounded-full group-hover:scale-110 transition-all duration-300">
            <img
              src="/logo.svg"
              alt="TripPlanner logo"
              className="h-40 w-40 object-contain"
            />
          </div>
        </Link>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {/* Create Trip (always visible) */}
          <Link to="/create-trip" aria-label="Create Trip">
            <Button variant="outline" className="rounded-full px-5 text-sm">
              + Create Trip
            </Button>
          </Link>

          {/* My Trips (only if logged in) */}
          {user && (
            <Link to="/my-trips" aria-label="My Trips">
              <Button variant="outline" className="rounded-full px-5 text-sm">
                My Trips
              </Button>
            </Link>
          )}

          {/* If user logged in show avatar, else Sign In */}
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <img
                    src={user?.picture}
                    alt={user?.name || "User"}
                    className="h-10 w-10 rounded-full border object-cover"
                  />
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-56 p-3" sideOffset={8}>
                <div className="flex items-center gap-3">
                  <img
                    src={user?.picture}
                    alt={user?.name || "User"}
                    className="h-9 w-9 rounded-full border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="mt-3 w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              variant="outline"
              className="rounded-full px-5 text-sm"
              onClick={() => setOpenDialog(true)}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Sign In Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogDescription>
              <div className="flex flex-col items-center text-center">
                <img src="/logo.svg" alt="logo" width="84" className="mb-3" />
                <h2 className="mb-1 text-lg font-semibold">
                  Sign in to TripPlanner
                </h2>
                <p className="text-sm text-gray-500">
                  Continue with secure Google authentication
                </p>
                <Button
                  onClick={login}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-full"
                >
                  <FcGoogle className="h-6 w-6" />
                  Sign in with Google
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export default Header;
