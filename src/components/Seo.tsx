import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
}

export const Seo = ({ title, description, keywords = '' }: SeoProps) => {
  return (
    <Helmet>
      <title>{title} | Прогулки с Боярином</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
};

export default Seo;
