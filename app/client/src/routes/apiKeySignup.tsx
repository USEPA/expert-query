import { useEffect, useState } from 'react';
// components
import { Loading } from 'components/loading';
// config
import { serverUrl } from 'config';
// contexts
import { useContentState } from 'contexts/content';

export default ApiKeySignup;

export function ApiKeySignup() {
  const { content } = useContentState();
  const [loading, setLoading] = useState(true);

  const baseUrl =
    window.location.hostname === 'localhost'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : serverUrl;

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
      apiKey: content.data.services.eqApiKey,
      verifyEmail: true,
      signupConfirmationMessage: `
        <h2>What Next?</h2>
        <ul>
          <li>
          Explore the Expert Query (EQ) web service <a href='${baseUrl}/api-documentation'>documentation</a>.
          </li>
        </ul>
    `,
    };
  }, [baseUrl, content]);

  return (
    <div>
      <h2>API Key Signup</h2>
      <div id="apidatagov_signup">{loading && <Loading />}</div>
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
      verifyEmail: boolean;
      signupConfirmationMessage: string;
    };
  }
}
