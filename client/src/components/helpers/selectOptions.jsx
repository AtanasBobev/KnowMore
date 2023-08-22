import {useState} from "preact/hooks"
import translate from "../../utils/languagesHandler";
const SelectOptions = (props) => {
  const [defaultEl, setDefaultEl] = useState(props.initialState);
  const handleChange = (e) => {
    setDefaultEl(e.target.value);
    props.initialState = e.target.value;
    const value = e.target.value;
    props.setCategory(value);
  };
  return (
    <select
    value={defaultEl}
    onChange={handleChange}
    id="categorySelect"
  >
    <option value="-" disabled>
      {translate("option.Category")}
    </option>
    <option value="">{translate("options.All")}</option>
    <option value="biology">{translate("options.Biology")}</option>
    <option value="chemistry">{translate("options.Chemistry")}</option>
    <option value="physics">{translate("options.Physics")}</option>
    <option value="math">{translate("options.Math")}</option>
    <option value="economics">{translate("options.Economics")}</option>
    <option value="history">{translate("options.History")}</option>
    <option value="english">{translate("options.English")}</option>
    <option value="otherLang">{translate("options.otherLanguages")}</option>
    <option value="literature">{translate("options.Literature")}</option>
    <option value="generalKnowledge">{translate("options.generalKnowledge")}</option>
    <option value="other">{translate("Other")}</option>
  </select>
  );
};

export default SelectOptions;
