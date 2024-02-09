type Props = {
  tags: readonly string[];
};

export function TagsPopup({ tags }: Props) {
  return (
    <div className="dropdown dropdown-end dropdown-hover">
      <div
        tabIndex={0}
        role="button"
        className="badge badge-ghost badge-xs mt-1"
      ></div>
      <div
        tabIndex={0}
        className="card compact dropdown-content z-[1] shadow bg-base-100 rounded-box w-64"
      >
        <div tabIndex={0} className="card-body">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="badge badge-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
