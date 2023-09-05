import { useState } from "preact/hooks";
import translate from "../../utils/languagesHandler";
import token from "../../utils/jwtParser";
const SelectLiked = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setLikedState(value);
  };
  return (
    <select value={defaultEl} onChange={handleChange} id="likeSelect">
      <option value="-" disabled>
        {translate("option.Type")}
      </option>
      <option value="all">{translate("options.All")}</option>
      {token.user_id && (
        <option value="liked">{translate("options.Liked")}</option>
      )}
    </select>
  );
};

export default SelectLiked;
