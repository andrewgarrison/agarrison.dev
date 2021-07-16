import Link from "next/link";
import { useRouter } from "next/router";
import { useThemeContext } from "../../contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
import { organize } from "../../utils/tailwind-helpers";
import { Logo } from "../Logo";

export const Header = () => {
  const { pathname } = useRouter();
  const { theme, setTheme } = useThemeContext();
  const isDark = theme === "dark";
  const isHome = pathname === "/";

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div
      className={organize([
        "w-full",
        "p-4",
        "mb-4",
        "h-[74px]",
        "bg-gray-100",
        "dark:bg-gray-800",
        "flex",
        "items-center",
        isHome ? "justify-end" : "justify-between",
      ])}
    >
      {!isHome && (
        <Link href="/" passHref>
          <Logo classes={["hover:bg-blue-100", "dark:hover:bg-gray-700"]} />
        </Link>
      )}
      <button
        onClick={handleThemeToggle}
        className="p-2 max-h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
      >
        {isDark ? <FaSun /> : <FaMoon />}
      </button>
    </div>
  );
};
