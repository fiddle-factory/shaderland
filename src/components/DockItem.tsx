import { motion } from "framer-motion";
import { ReactNode, useRef } from "react";
import useCalculateSize from "../hooks/useCalculateSize";

interface Props {
  mouseX: number | undefined;
  size: number;
  magnification: number;
  icon: ReactNode;
  onClick: () => void;
}

const DockItem = ({ mouseX, size, magnification, icon, onClick }: Props) => {
  // Fix: useRef<HTMLButtonElement>(null) for correct type
  const el = useRef<HTMLButtonElement>(null);

  const dynamicSize = useCalculateSize(el as React.RefObject<HTMLButtonElement>, size, mouseX, magnification);

  return (
    <motion.button
      className="dock-item"
      whileTap={{ scale: 0.85 }}
      onTap={onClick}
      ref={el}
      style={{
        width: dynamicSize,
        height: dynamicSize
      }}
    >
      {icon}
    </motion.button>
  );
};

export default DockItem;
