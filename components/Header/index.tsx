import Link from "next/link";
import { useRouter } from "next/router";
import { useThemeContext } from "../../contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";
import { organize } from "../../utils/tailwind-helpers";

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
        "h-full",
        "w-full",
        "p-4",
        "mb-4",
        "bg-gray-100",
        "dark:bg-gray-800",
        "flex",
        "items-center",
        isHome ? "justify-end" : "justify-between",
      ])}
    >
      {!isHome && (
        <Link href="/">
          <h5
            className={organize([
              "text-blue-600",
              "dark:text-blue-200",
              "font-bold",
              "border-current",
              "rounded-md",
              "border-2",
              "cursor-pointer",
              "w-11",
              "h-11",
              "flex",
              "items-center",
              "justify-center",
              "hover:bg-blue-100",
              "dark:hover:bg-gray-900",
              "transition-all",
            ])}
          >
            a
          </h5>
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
