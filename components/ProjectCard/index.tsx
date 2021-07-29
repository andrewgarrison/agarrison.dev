import React from "react";
import { useRouter } from "next/router";
import { organize } from "../../utils/tailwind-helpers";
import { Image } from "../Image";

interface ProjectCardProps {
  title: string;
  imageSrc: string;
  url: string;
  children?: string;
}

export const ProjectCard = (props: ProjectCardProps) => {
  const { title = "", imageSrc = "", children = "", url = "", ...rest } = props;
  const { push } = useRouter();

  return (
    <div
      className={organize([
        "mb-12",
        "bg-white",
        "dark:bg-gray-700",
        "border-2",
        "border-gray-200",
        "dark:border-gray-600",
        "hover:border-blue-600",
        "dark:hover:border-blue-300",
        "hover:-translate-y-2",
        "cursor-pointer",
        "rounded",
        "transition-all",
        "duration-300",
      ])}
      onClick={() => push(url)}
      {...rest}
    >
      <Image
        src={imageSrc}
        alt={title}
        className="object-none object-center h-full w-full"
        parentClasses="h-52 w-full"
      />
      <div className="p-4">
        <h3 className="text-2xl font-bold my-2 italic">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{children}</p>
      </div>
    </div>
  );
};
