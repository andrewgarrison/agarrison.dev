import { FaLinkedinIn, FaGithub, FaFileAlt, FaEnvelope } from "react-icons/fa";
import { SocialLink } from "../components/SocialLink";
import { ProjectCard } from "../components/ProjectCard";
import { WORK } from "../content";

export default function Home() {
  return (
    <>
      <h1 className="text-5xl text-blue-600 dark:text-blue-300 font-bold mt-12 sm:mt-16">
        Andrew Garrison
      </h1>
      <p className="text-xl text-gray-500 dark:text-gray-200 my-4">
        Front End Engineer
      </p>
      <div className="flex items-center mt-6">
        <SocialLink href="https://github.com/andrewgarrison">
          <FaGithub title="Github" size="24px" />
        </SocialLink>
        <SocialLink href="https://www.linkedin.com/in/andrewtategarrison">
          <FaLinkedinIn title="LinkedIn" size="24px" />
        </SocialLink>
        <SocialLink href="mailto:andrewtategarrison@gmail.com">
          <FaEnvelope title="Email" size="24px" />
        </SocialLink>
        <SocialLink href="/resume">
          <FaFileAlt title="Resume" size="24px" />
        </SocialLink>
      </div>
      <section className="mt-24">
        <div className="w-max mb-8">
          <h1 className="text-gray-800 dark:text-gray-100 uppercase tracking-widest text-xs font-semibold">
            Latest Work
          </h1>
          <div className="border-b-2 border-blue-600 dark:border-blue-300 w-4/12 mt-1" />
        </div>
        {WORK.map((work) => (
          <ProjectCard
            title={work.title}
            imageSrc={work.imageSrc}
            url={work.url}
          >
            {work.children}
          </ProjectCard>
        ))}
      </section>
    </>
  );
}
