const SelectOptions = (props) => {
  const handleChange = (e) => {
    const value = e.target.value;
    props.setSortBy(value);
  };
  return (
    <select onChange={handleChange} id="selectSort">
      <option selected disabled>Sort by</option>
      <option value="name">Best match</option>
      <option value="date_created">Most recent</option>
      <option value="likes">Likes</option>
      <option value="date_modified">Revisions</option>
    </select>
  );
};

export default SelectOptions;
