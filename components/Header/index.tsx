import { useThemeContext } from "../../contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export const Header = () => {
  const { theme, setTheme } = useThemeContext();
  const isDark = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="h-full w-full p-4 bg-gray-100 dark:bg-gray-800 flex justify-end">
      <button
        onClick={handleThemeToggle}
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
      >
        {isDark ? <FaSun /> : <FaMoon />}
      </button>
    </div>
  );
};
