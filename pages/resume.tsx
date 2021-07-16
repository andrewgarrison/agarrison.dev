export default function Resume() {
  const fallback = (
    <>
      Sorry, the PDF resume could not be viewed on this browser or device. Try{" "}
      <a
        className="text-blue-600 dark:text-blue-300 underline"
        href="/Resume.pdf"
        download
      >
        downloading it
      </a>{" "}
      instead.
    </>
  );

  return (
    <>
      <object
        data="/Resume.pdf?#zoom=90"
        type="application/pdf"
        width="100%"
        height="850px"
        className="hidden sm:block"
      >
        {fallback}
      </object>
      <div className="sm:hidden block">{fallback}</div>
    </>
  );
}
