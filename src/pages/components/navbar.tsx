import { SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  function handleMenuToggle() {
    setIsMenuOpen((prevState) => !prevState);
  }
  return (
    <div>
      <nav className="flex items-center justify-between">
        <SignedIn>
          <div className={`m-2 flex flex-col text-white`}>
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: { width: 45, height: 45 } },
              }}
            />
          </div>
        </SignedIn>
        <div className={`flex flex-col items-end space-x-6 pr-4 sm:flex-row`}>
          <div className="hidden sm:block">
            <NavMenuItems />
          </div>
        {/* Hamburger menu for mobile */}
          <div
            onClick={handleMenuToggle}
            className={`menu-icon mt-2 px-4 hover:cursor-pointer sm:hidden`}
          >
            ☰
          </div>
        <div className={`sm:hidden ${isMenuOpen ? "block" : "hidden"}`}>
            <NavMenuItems />
        </div>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;

function NavMenuItems() {
  return (
    <ul
      className={`flex flex-col items-end space-y-1 sm:flex-row sm:gap-x-3`}
    >
      <li>
        <Link
          href="home"
          className="text-slate-300 hover:text-white hover:underline"
        >
          Home
        </Link>
      </li>


      <li>
        <Link
          href="allworkouts"
          className="text-slate-300 hover:text-white hover:underline"
        >
          History
        </Link>
      </li>
    </ul>
  );
}
