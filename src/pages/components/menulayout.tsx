import type { PropsWithChildren } from "react";

const MenuLayout = (props: PropsWithChildren) => {
  return (
    <div
      style={{ maxWidth: "600px", margin: "0 auto" }}
      className="m-2 flex flex-col items-center rounded-lg  bg-slate-800  p-2  text-center font-semibold "
    >
      {props.children}
    </div>
  );
};

export default MenuLayout;
