export type PageMetadataProps = {
  title: string;
  description: string;
  image?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
};

export const PageMetadata = ({
  title,
  description,
  image,
  canonicalUrl,
  noIndex,
}: PageMetadataProps) => (
  <>
    <title>{`${title} | profile-hub`}</title>
    <meta name={"description"} content={description} />
    {noIndex && <meta name={"robots"} content={"noindex"} />}
    <meta property={"og:title"} content={`${title} | profile-hub`} />
    <meta property={"og:description"} content={description} />
    <meta property={"og:type"} content={"website"} />
    {canonicalUrl && <link rel={"canonical"} href={canonicalUrl} />}
    {canonicalUrl && <meta property={"og:url"} content={canonicalUrl} />}
    {image && <meta property={"og:image"} content={image} />}
    <meta name={"twitter:card"} content={image ? "summary_large_image" : "summary"} />
    <meta name={"twitter:title"} content={`${title} | profile-hub`} />
    <meta name={"twitter:description"} content={description} />
    {image && <meta name={"twitter:image"} content={image} />}
  </>
);
