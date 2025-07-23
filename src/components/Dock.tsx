import { motion } from "framer-motion";
import { useState } from "react";
import DockItem from "./DockItem";
import { DockButton } from "../types";

interface Props {
  items: DockButton[];
}

const Dock = ({ items }: Props) => {
  const [mouseX, setMouseX] = useState<number | undefined>(undefined);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    setMouseX(event.clientX);
  }

  return (
    <motion.div
      className="dock"
      onMouseMove={handleMouse}
      onMouseLeave={() => {
        setMouseX(undefined);
      }}
    >
      {items.map((item, index) => (
        <DockItem
          key={index}
          size={48}
          magnification={1.8}
          mouseX={mouseX}
          icon={item.icon}
          onClick={item.action}
        />
      ))}
    </motion.div>
  );
};

export default Dock;
