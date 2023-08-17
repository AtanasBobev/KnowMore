import {useState} from "preact/hooks"
const SelectLiked = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setLikedState(value);
  };
  return (
    <select
    value={defaultEl}
    onChange={handleChange}
    id="likeSelect"
  >
    <option value="-" disabled>
      Type
    </option>
    <option value="all">All</option>
    <option value="liked">Liked</option>

  </select>
  );
};

export default SelectLiked;
