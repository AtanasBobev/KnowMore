import translate from "../../utils/languagesHandler";
const SelectLimit = (props) => {
  const handleChange = (e) => {
    const value = e.target.value;
    props.setLimit(value);
  };
  return (
    <select onChange={handleChange} id="selectSort">
      <option selected disabled>{translate("option.Show")}</option>
      <option value={100}>{translate("option.100Sets")}</option>
      <option value={300}>{translate("option.300Sets")}</option>
      <option value={500}>{translate("option.500Sets")}</option>
      <option value={1000}>{translate("option.1000Sets")}</option>
    </select>
  );
};

export default SelectLimit;
