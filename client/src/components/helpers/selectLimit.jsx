import translate from "../../utils/languagesHandler";
const SelectLimit = (props) => {
  const handleChange = (e) => {
    const value = e.target.value;
    props.setLimit(value);
  };
  return (
    <select onChange={handleChange} id="selectSort">
      <option selected disabled>{translate("option.Show")}</option>
      <option value={100}>{translate("options.100Sets")}</option>
      <option value={300}>{translate("options.300Sets")}</option>
      <option value={500}>{translate("options.500Sets")}</option>
      <option value={1000}>{translate("options.1000Sets")}</option>
    </select>
  );
};

export default SelectLimit;
