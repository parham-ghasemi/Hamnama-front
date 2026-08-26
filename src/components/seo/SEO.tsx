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
      {title && <title>{title}</title>}

      {description && <meta name="description" content={description} />}

      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      {canonical && <link rel="canonical" href={canonical} />}

      {ogTitle || title && (
        <meta property="og:title" content={ogTitle || title} />
      )}
      {ogDescription || description && (
        <meta property="og:description" content={ogDescription || description} />
      )}
      {ogImage && (
        <meta property="og:image" content={ogImage || ""} />
      )}
      {ogURL || canonical && (
        <meta property="og:url" content={ogURL || canonical} />
      )}

      <meta property="og:type" content="website" />
    </>
  );
}