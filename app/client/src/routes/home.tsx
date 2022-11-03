// components
import { Loading } from 'components/loading';
import ComboBox from 'components/comboBox';
// contexts
import { useContentState } from 'contexts/content';

export function Home() {
  const { content } = useContentState();

  if (content.status === 'pending') return <Loading />;

  return (
    <div>
      Expert Query Placeholder...
      <ComboBox
        label="Test"
        onChange={(s) => console.log(s)}
        options={[
          { label: 'a', value: 'a' },
          { label: 'b', value: 'b' },
        ]}
      />
    </div>
  );
}
