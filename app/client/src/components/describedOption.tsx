type Props = {
  description: string;
  label: string;
};

export default function DescribedOption({ description, label }: Props) {
  return (
    <p className="margin-1">
      <b>{label}</b>
      <br />
      <em>{description}</em>
    </p>
  );
}
