import { SignedIn, UserButton } from "@clerk/nextjs";

import Link from "next/link";
import { useState } from "react";
import MaxWidthWrapper from "./maxwidthwrapper";
import { buttonVariants } from "@/components/ui/button";

export const NavBar = () => {
  return (
        <nav className={`flex justify-end items-center pr-4 space-x-6 flex-row sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg trasnition-all`}>
        <MaxWidthWrapper>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200'">
              <Link
                href="home"
                className={buttonVariants({
                  size:'sm'
                })}
              >New Report</Link>

              <Link
                href="reports"
                className={buttonVariants({
                  variant:'ghost',
                  size:'sm'
                })}
              >
                All Reports
              </Link>

              <Link
                href="about"
                className={buttonVariants({
                  variant:'ghost',
                  size:'sm'
                })}
              >
                About
              </Link>
          
          <SignedIn>
            <div className={``}>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 35, height: 35 } },
                }}
              />
            </div>
          </SignedIn>
          </div>
        </MaxWidthWrapper>
      </nav>
  );
};

export default NavBar;