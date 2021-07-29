import { Video } from "../../components/Video";

export default function Koda() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-12">Koda</h1>
      <section>
        <p className="my-2">
          Koda, short for kodawari, a Japanese word roughly meaning &quot;the
          pursuit of perfection&quot;, is a coffee company aimed at bridging the
          gap between coffee farmers and coffee consumers. The company was
          dreampt up by a friend of mine which led me to create a 3 page app
          intro that gives users a basic understanding of what Koda is and how
          it works.
        </p>
      </section>
      <Video
        src="/koda.mp4"
        autoPlay
        parentClasses="w-3/4 md:w-1/2 my-8 mx-auto"
      />
      <p className="my-2">
        The interactive prototype was designed and animated using Adobe XD (fun
        fact, I also designed the logo in XD 🤠 ). The purpose for creating the
        prototype was to aid the Koda team in pitching to the{" "}
        <a
          className="text-blue-600 dark:text-blue-300 underline"
          href="https://www.unomaha.edu/college-of-business-administration/center-for-innovation-entrepreneurship-franchising/courses/maverick-venture-fund.php"
        >
          Maverick Venture Fund
        </a>{" "}
        with hopes to raise money to start and grow the company. Unfortunately,
        they were unable to raise the money, but the prototype was a tremendous
        visual in their presentation and helped spark engagement from the
        potential investors.
      </p>
    </>
  );
}
