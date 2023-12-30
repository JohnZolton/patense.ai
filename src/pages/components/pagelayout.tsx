import type { PropsWithChildren } from "react";

const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="flex h-screen justify-center">
      <div className="flex h-full w-full flex-col  text-slate-100 md:max-w-2xl">
        {props.children}
      </div>
    </main>
  );
};

export default PageLayout;
