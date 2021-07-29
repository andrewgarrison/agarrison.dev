import React, { useState } from "react";
import { FaImage } from "react-icons/fa";
import { PuffLoader } from "react-spinners";
import { useThemeContext } from "../../contexts/ThemeContext";

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  parentClasses?: string;
  iconSize?: number;
}

export const Video = (props: VideoProps) => {
  const { src, parentClasses, iconSize = 48, ...rest } = props;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const { theme } = useThemeContext();
  const color = theme === "dark" ? "#d1d5db" : "#4b5563";

  return (
    <div
      style={{ position: "relative" }}
      className={`flex items-center justify-center ${parentClasses}`}
    >
      <video
        controls
        onLoadedMetadata={() => setIsLoading(false)}
        style={
          isLoading || isError
            ? { opacity: "0", position: "absolute" }
            : { transition: "opacity 300ms ease-in-out" }
        }
        {...rest}
      >
        <source src={src} onError={() => setIsError(true)}></source>
      </video>
      {isError && <FaImage size={iconSize} color={color} />}
      {isLoading && !isError && <PuffLoader size={iconSize} color={color} />}
    </div>
  );
};
