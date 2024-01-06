import { SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  function handleMenuToggle() {
    setIsMenuOpen((prevState) => !prevState);
  }
  return (
    <>
        <nav className={`flex justify-end items-center pr-4 space-x-6 sm:flex-row`}>
          <div className="hidden sm:block">
            <NavMenuItems />
          </div>
          
          {/* Hamburger menu for mobile */}
          <div
            onClick={handleMenuToggle}
            className={`px-4 menu-icon hover:cursor-pointer sm:hidden`}
          >
            ☰
          </div>
          <div className={`sm:hidden ${isMenuOpen ? "block" : "hidden"}`}>
              <NavMenuItems />
          </div>
          <SignedIn>
            <div className={`mt-4`}>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 45, height: 45 } },
                }}
              />
            </div>
          </SignedIn>
      </nav>
    </>
  );
};

export default NavBar;

function NavMenuItems() {
  return (
    <ul
      className={`flex flex-col items-end mt-4 space-y-1 sm:flex-row sm:gap-x-3`}
    >
      <li>
        <Link
          href="home"
          className="hover:underline"
        >
          Home
        </Link>
      </li>


      <li>
        <Link
          href="reports"
          className="hover:underline"
        >
          Reports
        </Link>
      </li>
      <li>
        <Link
          href="about"
          className="hover:underline"
        >
          About
        </Link>
      </li>
    </ul>
  );
}
