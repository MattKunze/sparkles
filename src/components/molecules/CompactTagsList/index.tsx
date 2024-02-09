type Props = {
  tags: readonly string[];
  maxTags?: number;
};
export function CompactTagsList({ tags, maxTags = 3 }: Props) {
  return (
    <div className="flex gap-1">
      {tags.slice(0, maxTags - 1).map((tag) => (
        <span key={tag} className="badge badge-primary">
          {tag}
        </span>
      ))}
      {tags.length > maxTags && <span className="mx-2">...</span>}
      {tags.length >= maxTags && (
        <span className="badge badge-primary">{tags[tags.length - 1]}</span>
      )}
    </div>
  );
}
