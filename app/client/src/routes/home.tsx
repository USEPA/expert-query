// components
import { Loading } from 'components/loading';
// contexts
import { useContentState } from 'contexts/content';

export function Home() {
  const { content } = useContentState();

  if (content.status === 'pending') return <Loading />;

  return <div>Expert Query Placeholder...</div>;
}
