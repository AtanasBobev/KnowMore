if ("speechSynthesis" in window) {
  console.log("Speech synthesis supported and will be used");
}
const synthesis = window.speechSynthesis;
const speak = (text="",language="en-US") => {
  if (!synthesis) {
    console.log("Speech synthesis not supported");
    return;
  }
  if(!text.length){
    return;
  }
  if(synthesis.speaking){
    synthesis.cancel();
  }
  let textToSpeech = new SpeechSynthesisUtterance(text);
  textToSpeech.lang = language;
  textToSpeech.volume = 1;
  textToSpeech.rate = 1;
  textToSpeech.pitch = 1;
  textToSpeech.voice = synthesis.getVoices()[0];
  synthesis.speak(textToSpeech);
};
export default speak;
