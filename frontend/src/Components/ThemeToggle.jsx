/**
 * ThemeToggle — moon/sun button used in topbar and anywhere else
 */
import { useContext } from "react";
import { Context } from "../main";
import { PiMoon, PiSun } from "react-icons/pi";

const ThemeToggle = ({ size = "sm" }) => {
  const { theme, toggleTheme } = useContext(Context);

  const isDark = theme === "dark";
  const cls = size === "sm"
    ? "p-1.5 rounded-lg transition-all"
    : "p-2 rounded-xl transition-all";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`${cls} ${
        isDark
          ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
          : "text-slate-600 hover:text-sky-600 hover:bg-sky-100"
      }`}
    >
      {isDark
        ? <PiSun size={size === "sm" ? 17 : 20} />
        : <PiMoon size={size === "sm" ? 17 : 20} />
      }
    </button>
  );
};

export default ThemeToggle;
