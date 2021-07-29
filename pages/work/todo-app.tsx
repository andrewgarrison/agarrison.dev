import { Image } from "../../components/Image";
import { SocialLink } from "../../components/SocialLink";
import { FaGithub, FaGlobe } from "react-icons/fa";

export default function TodoApp() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-12">Todo App</h1>
      <section>
        <p className="my-2">
          I wanted to improve my TypeScript skills while also creating something
          useful, so I created a todo app. It&apos;s built with create react app,
          TypeScript, and uses the {" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://chakra-ui.com/"
          >
            Chakra UI
          </a>{" "}
          component library for the UI components.{" "}
        </p>
        <p className="my-2">
          One of my favorite parts of making this application was working with
          local storage to persist the added todos across sessions. Using{" "}
          <a
            href="https://usehooks.com/useLocalStorage/"
            className="text-blue-600 dark:text-blue-300 underline"
          >
            this nifty hook
          </a>{" "}
          from useHooks.com, I was able to expose a set of CRUD operations in my
          context layer to perform the local storage state updates seamlessly.
        </p>
        <p className="my-2">
          Check out the code or feel free to use the app to help plan your life
          😉
        </p>
        <div className="flex items-center mt-6">
          <SocialLink
            title="View Source"
            href="https://github.com/andrewgarrison/TodoApp"
          >
            <FaGithub title="Github" size="24px" />
          </SocialLink>
          <SocialLink
            title="View Website"
            href="https://typescript-todo-app-delta.vercel.app/"
          >
            <FaGlobe title="View Website" size="24px" />
          </SocialLink>
        </div>
      </section>
    </>
  );
}
