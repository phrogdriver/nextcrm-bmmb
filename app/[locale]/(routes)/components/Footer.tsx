import Link from "next/link";
import React from "react";

const Footer = async () => {
  return (
    <footer className="flex flex-row h-8 justify-end items-center w-full text-xs text-muted-foreground p-5">
      <div className="hidden md:flex pr-5">
        <Link href="/">
          <h1 className="text-muted-foreground hover:text-foreground transition-colors">
            {process.env.NEXT_PUBLIC_APP_NAME} - {process.env.NEXT_PUBLIC_APP_V}
          </h1>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
