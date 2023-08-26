import {useState} from "preact/hooks"
import translate from "../../utils/languagesHandler";
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
      {translate("option.Type")}
    </option>
    <option value="all">{translate("option.All")}</option>
    <option value="liked">{translate("option.Liked")}</option>

  </select>
  );
};

export default SelectLiked;
