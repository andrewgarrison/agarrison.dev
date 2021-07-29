import React, { useState } from "react";
import { FaImage } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useThemeContext } from "../../contexts/ThemeContext";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  parentClasses?: string;
  iconSize?: number;
}

export const Image = (props: ImageProps) => {
  const { src, alt, parentClasses, iconSize = 48, ...rest } = props;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const { theme } = useThemeContext();
  const color = theme === "dark" ? "#d1d5db" : "#4b5563";

  return (
    <div
      style={{ position: "relative" }}
      className={`flex items-center justify-center ${parentClasses}`}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsError(true)}
        style={
          isLoading || isError
            ? { opacity: "0", position: "absolute" }
            : { transition: "opacity 300ms ease-in-out" }
        }
        {...rest}
      />
      {isError && <FaImage size={iconSize} color={color} />}
      {isLoading && !isError && <PuffLoader size={iconSize} color={color} />}
    </div>
  );
};
