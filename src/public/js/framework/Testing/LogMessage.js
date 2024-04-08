const os = require('os');
const fs = require('fs');


class LogMessage{
    constructor(){
        // Initialize instance variables
        this._Eval = ""; // Evaluation
        this._Recognizer = ""; // Recognizer
        this._Dataset = ""; // Dataset
        this._Articulations = ""; // Articulations
        this._NbParticipant= ""; // Number of participants
        this._NbSample = ""; // Number of samples
        this._NbTemplates = ""; // Number of templates
    }

    SetEval(Evaluation){
      // Set the evaluation value
      this._Eval = Evaluation;
    }

    SetRecognizer(Recognizer){
      // Set the recognizer value
      this._Recognizer = Recognizer;
    }

    SetDataset(Dataset){
      // Set the dataset value
      this._Dataset = Dataset;
    }

    SetArticulation(Articulation){
      // Set the articulation value
      this._Articulations = Articulation;
    }

    SetParticipant(Participant){
      // Set the number of participants value
      this._NbParticipant = Participant;
    }

    SetSample(Sample){
      // Set the number of samples value
      this._NbSample = Sample;
    }

    SetTemplates(Templates){
      // Set the number of templates value
      this._NbTemplates = Templates;
    }

    ToString_UI(){
      // Generate a formatted string representation of the log message for UI
      return ("# "+ this._Eval +" # "+ new Date().toLocaleDateString("fr-BE").replaceAll("/","-")+" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ this._Dataset +" ,"+this._Recognizer+ " ,A:" + this._Articulations+ " ,N:" + this._NbSample+" ,P:" + this._NbParticipant+" ,T:" + this._NbTemplates+" # Done!");
    }

    ToString_UD(){
      // Generate a formatted string representation of the log message for UD
      return ("# "+ this._Eval +" # "+ new Date().toLocaleDateString("fr-BE").replaceAll("/","-")+" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ this._Dataset +" ,"+this._Recognizer+ " ,A:" + this._Articulations+ " ,N:" + this._NbSample+" ,T:" + this._NbTemplates+" ,U:" + this._NbParticipant+" # Done!");
    }

    // This static method prints the logs to a file
    static PrintLogs(QueueMesages, ExecTime) {
      // Get the hostname of the machine
      const hostname = os.hostname();
      // Get the current date and format it
      const date = new Date().toLocaleDateString("fr-BE").replaceAll("/", "-");
      // Get the current time and format it
      const time = new Date().toLocaleTimeString("fr-BE").replaceAll(":", "-");

      // Define the directory path for the log files
      const dir = ".\\public\\json\\Results\\Logs\\";
      // Create the directory if it doesn't exist
      if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      }
      // Create a write stream to the log file
      const stream = fs.createWriteStream(dir + hostname + "_" + date + "_" + time + ".txt");

      // Once the stream is open, start writing the logs
      stream.once("open", function () {
      // Write a header for the log file
      stream.write("------------------------Comparative tests Logs------------------------ \n");
      // Write each log message from the queue to the file
      while (QueueMesages.size() !== 0) {
        stream.write(QueueMesages.dequeue() + "\n");
      }
      // Write the total execution time to the file
      stream.write("------------------------Total Execution time :" + ExecTime + " (ms) ------------------------ \n");
      // Close the stream
      stream.end();
      });
    }

  }

module.exports = LogMessage;
