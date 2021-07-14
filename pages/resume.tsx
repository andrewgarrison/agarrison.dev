export default function Resume() {
  return (
    <object
      data="/Resume.pdf?#zoom=90"
      type="application/pdf"
      width="100%"
      height="850px"
    >
      Sorry, the PDF could not be viewed on this browser or device. Try{" "}
      <a
        className="text-blue-600 dark:text-blue-300 underline"
        href="/Resume.pdf"
        download
      >
        downloading it
      </a>{" "}
      instead.
    </object>
  );
}
