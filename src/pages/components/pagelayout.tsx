import type { PropsWithChildren } from "react";
import Head from "next/head";

const PageLayout = (props: PropsWithChildren) => {
  return (
    <body className="min-h-screen font-sans antialiased">
        {props.children}
    </body>
  );
};

export default PageLayout;
