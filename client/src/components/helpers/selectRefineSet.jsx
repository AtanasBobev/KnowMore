import {useState} from "preact/hooks"
import translate from "../../utils/languagesHandler";
const SelectRefineSet = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setFurtherRefinements(value);
  };
  return (
    <select
    value={defaultEl}
    onChange={handleChange}
    id="likeSelect"
  >
    <option value="-" disabled>
      {translate("option.Sort")}
    </option>
    <option value="id" selected>{translate("options.Default")}</option>
    <option value="a-z">{translate("options.AZ")}</option>
    <option value="z-a">{translate("options.ZA")}</option>
    <option value="mostconfident">{translate("options.WellKnown")}</option>
    <option value="leastconfident">{translate("options.LeastKnown")}</option>
  </select>
  );
};

export default SelectRefineSet;
