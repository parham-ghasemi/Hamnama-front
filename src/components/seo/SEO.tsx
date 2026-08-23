interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogURL?: string;
  noindex?: boolean;
  ogImage?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogDescription,
  ogTitle,
  ogURL,
  noindex = false,
  ogImage,
}: SEOProps) {
  return (
    <>
      <title>{title}</title>

      <meta name="description" content={description} />

      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage || ""} />
      <meta property="og:url" content={ogURL || canonical} />
      <meta property="og:type" content="website" />
    </>
  );
}