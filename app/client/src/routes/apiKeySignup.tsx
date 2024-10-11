import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// components
import { Loading } from 'components/loading';
// config
import { clientUrl } from 'config';
// contexts
import { useContentState } from 'contexts/content';

export default ApiKeySignup;

export function ApiKeySignup() {
  const { content } = useContentState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (content.status !== 'success') return;

    const signupEmbed = document.createElement('script');
    signupEmbed.type = 'text/javascript';
    signupEmbed.async = true;
    signupEmbed.src = 'https://api.data.gov/static/javascripts/signup_embed.js';
    signupEmbed.onload = () => setLoading(false);
    document.body.appendChild(signupEmbed);

    window.apiUmbrellaSignupOptions = {
      registrationSource: 'expert-query',
      apiKey: content.data.services.eqApiSignupKey,
      verifyEmail: true,
      signupConfirmationMessage: `
        <h2>What Next?</h2>
        <ul>
          <li>
          Explore the <b>Expert Query (EQ)</b> web service <a href='${clientUrl}/api-documentation'>documentation</a>.
          </li>
        </ul>
    `,
    };
  }, [content]);

  return (
    <div>
      <h1>API Key Signup</h1>
      <p>
        Sign up for an application programming interface (API) key to access and
        use <b>Expert Query</b>'s web services, then explore the web service{' '}
        <Link to={`${clientUrl}/api-documentation`}>documentation</Link>.
      </p>

      {loading && <Loading />}
      <div id="apidatagov_signup"></div>
    </div>
  );
}

/*
## Types
*/

declare global {
  interface Window {
    apiUmbrellaSignupOptions: {
      registrationSource: string;
      apiKey: string;
      signupConfirmationMessage: string;
      verifyEmail: boolean;
    };
  }
}
