import { ProjectCardProps } from "./components/ProjectCard";

export const WORK: ProjectCardProps[] = [
  {
    title: "Lofi Earn",
    imageSrc:
      "https://cdnb.artstation.com/p/assets/images/images/029/320/295/original/bogdan-mb0sco-coffeeanim.gif?1601147277",
    url: "/work/lofi-earn",
    children:
      "Listen to lofi beats while making money. Built using the Anchor Earn SDK, React Query, Tailwind CSS, and Parcel",
  },
  {
    title: "Todo App",
    imageSrc: "https://source.unsplash.com/fMD_Cru6OTk/1600x900",
    url: "/work/todo-app",
    children:
      "A basic todo app written in TypeScript utilizing local storage to persist data.",
  },
  {
    title: "Koda",
    imageSrc: "/koda-cover.jpg",
    url: "/work/koda",
    children: "A prototype of an intro app page designed in Adobe XD.",
  },
];
