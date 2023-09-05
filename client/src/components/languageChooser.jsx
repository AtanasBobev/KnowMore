import "../styles/languageChooser.css"
const LanguageChooser = props => {
  return (
    <container id="lang-container">
      <div onClick={e=>props.chooseLang("en-US")} className="langButton">🇺🇸</div>
      <div onClick={e=>props.chooseLang("bg-BG")} className="langButton">🇧🇬</div>
    </container>
  );
};

export default LanguageChooser;
