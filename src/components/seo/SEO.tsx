interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  canonical,
  noindex = false,
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
    </>
  );
}