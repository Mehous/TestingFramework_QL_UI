// ************************************ Testing configuration Class************************************

// Define a class called Configuration
// Export the Configuration class
module.exports = class Configuration {
  // Private property that stores the names of different articulations
  #ArticulationsN = ["1(P)", "2(P+I)", "2(T+I)", "2(I+M)", "3(P+I+M)", "3(T+I+M)", "5(AF)", "6(P+AF)"];
  
  // Private property that stores the selected articulations for each recognizer
  #ArticulationSel = [
    ["Palm"],
    ["Palm", "Index_tip"],
    ["Thumb_tip", "Index_tip"],
    ["Index_tip", "Middle_tip"],
    ["Middle_tip", "Index_tip", "Palm"],
    ["Thumb_tip", "Index_tip", "Palm"],
    ["Thumb_tip", "Index_tip", "Middle_tip", "Ring_tip", "Pinky_tip"],
    ["Palm", "Thumb_tip", "Index_tip", "Middle_tip", "Ring_tip", "Pinky_tip"],
  ];

  // Constructor function that takes in various parameters
  constructor(recognizers, Dsets, evaluation, joints, templMax, partMax, repetitions, sampleMax) {
    // ==============================Testing recognizers==========================================
    // Dynamically import and instantiate the specified recognizers
    const Recogniz = recognizers.map(recognizer => {
      const Inst = `require("./public/js/recognizers/${recognizer}").${recognizer}`;
      return eval(Inst);
    });

    // ==============================Testing datasets==========================================
    // Create an array of dataset objects
    const datasets = [{ Folder: Dsets, Name: Dsets, MaxT: templMax, Max_P: partMax }];

    // ==============================Testing Scenarios==========================================

    // Determine which dataset converter to use based on the evaluation scenario parameter (For UD scenario based on the folder tree structure:./js/datasets/UnifiedConverterRepetitionUserDep.js or ./js/datasets/UnifiedConverterUserDep.js)
    const DSetConverter = evaluation ? require("./public/js/datasets/UnifiedConverter.js") : require('./public/js/datasets/UnifiedConverterUserDep.js');

    // Get the selected articulations for each recognizer
    const Arti_Selection = this.getArticulations(joints, recognizers);

    // Store the provided parameters as properties of the Configuration object
    this.SaveTrainingSet = recognizers;
    this.Recogniz = Recogniz;
    this.Datasets = datasets;
    this.Eval = evaluation;
    this.datasetConverter = DSetConverter;
    this.ArticulationSet = Arti_Selection.set;
    this.ArticulationName = Arti_Selection.name;
    this.Sampling = sampleMax;
    this.R = repetitions;
  }

  // Method that returns the names and selected articulations for each recognizer
  getArticulations(Arts, recogs) {
    const name = Arts.map(element => this.#ArticulationsN[parseInt(element)]);
    const set = {};

    recogs.forEach(recog => {
      set[recog] = Arts.map(element => this.#ArticulationSel[parseInt(element)]);
    });

    return { name, set };
  }
}


