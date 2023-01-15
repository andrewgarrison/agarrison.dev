import { Image } from "../../components/Image";
import { SocialLink } from "../../components/SocialLink";
import { FaGithub, FaGlobe } from "react-icons/fa";
import { Prism } from "@mantine/prism";
import { useThemeContext } from "../../contexts/ThemeContext";

export default function Card3D() {
  const { theme } = useThemeContext();
  const codeSnippet = `
model.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    if (object.material.name === "Card front") {
      object.material.map = texture.front;
    } else {
      object.material.map = texture.back;
    }
  }
});
  `;

  const codeSnippet2 = `
if (textControls.object.position.z < 0) {
  cardNameRef.current.style.opacity = "1";
} else {
  cardNameRef.current.style.opacity = "0";
}
  `;

  return (
    <>
      <h1 className="text-4xl font-bold mb-12">Customizable 3D Credit Card</h1>
      <Image src="/3dCardDemo.gif" alt="3D Card Demo" className="mb-4" />
      <section className="mb-12">
        <p className="my-2">
          In December 2022, I was tasked with taking a 3D Credit Card model and
          displaying it on the web to allow users to customize the card in real
          time (e.g. Custom name and card color). I had never worked with WebGL
          before so it was a little daunting going into the project, especially
          being the lead engineer. I spent a good week sifting through numerous
          articles trying to determine a few things:
          <ol className="list-decimal p-4 px-8">
            <li>Could this be done without using a JavaScript library?</li>
            <li>
              If it&apos;s possible to update attributes on the 3D model in real
              time, how on earth do I do this?
            </li>
            <li>
              Are there browser or performance impacts that I need to consider?
            </li>
          </ol>
        </p>
        <p className="my-2">
          The first point above was answered pretty quickly after reading
          through the{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API"
            target="_blank"
            rel="noreferrer"
          >
            Web MDN WebGL API docs
          </a>{" "}
          and realizing how bare-boned and time consuming the WebGL API would be
          to build with. Not to mention, nearly every Google search I had
          conducted about how I could use JavaScript to render a 3D model all
          seemed to reference{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://threejs.org/"
            target="_blank"
            rel="noreferrer"
          >
            Three.js
          </a>
          . From there I decided using a library was the way to go and Three.js
          stood out as the clear choice.
        </p>
        <p>
          Now that I had a clearly defined API/library to work with, I tore the
          docs apart to understand how I could render a model, and more
          importantly, how I could update attributes of that model once it was
          rendered. I discovered different 3D file types each had a specific
          loader that would need to be used and once rendered the you could
          access properties of that model. In this case, our 3D animator
          exported the model in the Filmbox (FBX) format so I&apos;d need to use
          Three&apos;s{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/FBXLoader.js"
            target="_blank"
            rel="noreferrer"
          >
            FBXLoader
          </a>
          . After doing some digging, I found out changing the card color was as
          simple as iterating through the loaded model&apos;s material object and
          finding the asset that was used as the card face and back and swapping
          those out. For example:
          <Prism language="tsx" colorScheme={theme} className="my-4">
            {codeSnippet}
          </Prism>
        </p>
        <p>
          Now that I had the card color change working I focused my attention on
          figuring out how to update the name on the card. I understood at this
          point that I would need to add a new layer that would contain the
          text, but figuring out how I could attatch it to the card would be
          tricky. After reading through the different methods to render 3D text
          in Three.js, I settled on using Three&apos;s{" "}
          <a
            className="text-blue-600 dark:text-blue-300 underline"
            href="https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer"
            target="_blank"
            rel="noreferrer"
          >
            CSS3DRenderer
          </a>
          . The CSS3DRenderer can be used to combine DOM elements with WebGL
          content which was exactly what I needed. All I had to do was utilize
          the existing WebGL renderer object being used to render the 3D card
          model and apply those attributes to my newly added 3D text. This made
          it so that anytime the 3D card was moved the 3D text would follow
          every movement. Finally, I just had to make it so that when the back
          of the card was in view the text would be visible and when the front
          of the card was in view the text would be hidden. Using the value of
          the 3D card&apos;s <code>z</code> position this was as simple as looking
          for a negative value to denote the card back and a positive value to
          denote the front of the card.
          <Prism language="tsx" colorScheme={theme} className="my-4">
            {codeSnippet2}
          </Prism>
        </p>
        <p>
          When it was all said and done, I was extremely happy with how
          everything turned out. I was able to meet all requirements set forth
          by the designer and the final result was extremely performant and
          compatiable across different browsers. I was able to unit test
          different functions used to render the 3D card by decoupling them from
          my component, however, since jsdom doesn&apos;t have WebGL context it&apos;s
          extremely tricky to get a Three scene rendered in a unit test. In the
          future I would like to look into other testing options such as using a
          headless browser to render expected and actual images of the scene.
        </p>
        <hr className="dark:border-gray-200 border-gray-400 my-8" />
        <p className="my-4">
          <b>Note</b>: The project I&apos;m showcasing here is a recreation of the
          work I did at Gemini. I used Blender to create my own 3D card model
          and used Figma to design my own custom card faces. Check out the link
          below to customize your own agarrison.dev credit card 😃
        </p>
        <div className="flex items-center mt-6">
          <SocialLink
            title="View Source"
            href="https://github.com/andrewgarrison/3D-Card"
          >
            <FaGithub title="Github" size="24px" />
          </SocialLink>
          <SocialLink
            title="View Website"
            href="https://3-d-card-nine.vercel.app/"
          >
            <FaGlobe title="View Website" size="24px" />
          </SocialLink>
        </div>
      </section>
    </>
  );
}
