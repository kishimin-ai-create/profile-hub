export type PageMetadataProps = { title: string; description: string; image?: string };

export const PageMetadata = ({ title, description, image }: PageMetadataProps) => (
  <>
    <title>{`${title} | profile-hub`}</title>
    <meta name={"description"} content={description} />
    <meta property={"og:title"} content={`${title} | profile-hub`} />
    <meta property={"og:description"} content={description} />
    <meta property={"og:type"} content={"website"} />
    {image && <meta property={"og:image"} content={image} />}
  </>
);
