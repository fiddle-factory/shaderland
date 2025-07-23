import { ReactNode } from "react";

export interface DockButton {
  icon: ReactNode;
  action: () => void;
}
