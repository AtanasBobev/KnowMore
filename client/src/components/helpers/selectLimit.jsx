import translate from "../../utils/languagesHandler";
const SelectLimit = (props) => {
  const handleChange = (e) => {
    const value = e.target.value;
    props.setLimit(value);
  };
  return (
    <select onChange={handleChange} id="selectSort">
      <option selected disabled>{translate("option.Show")}</option>
      <option value={100}>100 sets</option>
      <option value={300}>300 sets</option>
      <option value={500}>500 sets</option>
      <option value={1000}>1000 sets</option>
    </select>
  );
};

export default SelectLimit;
