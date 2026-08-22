import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  noIndex?: boolean;
}

const appName = "Task Management System";

const SEO = ({ title, description, noIndex = false }: SEOProps) => {
  const fullTitle = title.includes(appName) ? title : `${title} | ${appName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
    </Helmet>
  );
};

export default SEO;
