import { Image } from "../../components/Image";
import { SocialLink } from "../../components/SocialLink";
import { FaGithub, FaGlobe } from "react-icons/fa";

export default function TodoApp() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-12">Lofi Earn</h1>
      <section className="mb-12">
        <p className="my-2">
          Given my interest in crypto and the popularity (at the time) of{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://www.anchorprotocol.com/"
            target="_blank"
            rel="noreferrer"
          >
            Anchor
          </a>
          , I wanted to utilize the{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://docs.anchorprotocol.com/developers-earn/anchor-earn-sdk"
            target="_blank"
            rel="noreferrer"
          >
            Anchor Earn SDK
          </a>{" "}
          to build a fun app to interact with the protocol. The primary feature
          of this site is to be able to listen to lofi beats while watching your
          deposit (in UST) earn interest in real time.
        </p>
        <div className="my-4">
          <Image
            src="/lofi-earn-screenshot.png"
            alt="Lofiearn.com screenshot"
          />
        </div>
        <p className="my-2">
          I really enjoyed utilizing the different api&apos;s exposed by the Anchor
          Earn SDK and learning to query the Terra blockchain to enable deposit
          and tipping features.
        </p>
        <p className="my-4">
          Technologies used:
          <ul className="px-4 list-disc">
            <li>React Query</li>
            <li>Tailwind CSS</li>
            <li>TypeScript</li>
            <li>Parcel</li>
          </ul>
        </p>
        <p>
          Unfortunately, on May 9th, 2022, a few months after I created this
          site, Terra Luna&apos;s stable coin, UST, lost its peg and the entire
          ecosystem went down with it. This has made most functionality on this
          site useless and is kept up merely as a showcase of the work I did.
        </p>
        <div className="flex items-center mt-6">
          <SocialLink
            title="View Source"
            href="https://github.com/andrewgarrison/LofiEarn"
          >
            <FaGithub title="Github" size="24px" />
          </SocialLink>
          <SocialLink title="View Website" href="https://www.lofiearn.com/">
            <FaGlobe title="View Website" size="24px" />
          </SocialLink>
        </div>
      </section>
    </>
  );
}
