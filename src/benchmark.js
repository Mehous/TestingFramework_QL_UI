const fs = require("fs");
const os = require("os");
const { config } = require("process");
const LogMessage = require("./public/js/framework/Testing/LogMessage");
const Queue = require("./public/js/framework/Testing/Queue");


var RECOGNIZERS=[];
let dataset;
let MAXT, MAX_P;
let R;
let SaveTraining= false;

exports.Start = async function (Config) {
  var Exec_Time_Start = Date.now();
  var Message = new LogMessage();
  var queueMessages = new Queue();
  Str_Nb_Points = "";
  R = Config.R;
  Config.Recogniz.forEach((recognizer) => {
    if (Config.SaveTrainingSet.includes(recognizer.name)) {
      SaveTraining = true;
    }
    RECOGNIZERS = [recognizer.name];
    Message.SetRecognizer(RECOGNIZERS);
    queueMessages.enqueue("\n------------------------------------------------------------------------ \n"
      + "------------------------ Recognizer : " + RECOGNIZERS + " ------------------------ \n" +
      "------------------------------------------------------------------------ \n");
    Config.Datasets.forEach((data_set) => {
      dataset = Config.datasetConverter.loadDataset(data_set.Name, data_set.Folder);
      Message.SetDataset(data_set.Name);
      MAXT = data_set.MaxT;
      MAX_P = data_set.Max_P;
      let ArticulationsNames = Config.ArticulationName;

      let ArticulationSet = Config.ArticulationSet[RECOGNIZERS[0]];
      let parameters = { falpha: Config.falpha, fbeta: Config.fbeta, fgamma: Config.fgamma, fdelta: Config.fdelta, valpha: Config.valpha, vbeta: Config.vbeta };

      for (let a = 0; a < ArticulationSet.length; a++) {
        Str_Nb_Points = "";
        console.log(ArticulationsNames[a]);
        
        Message.SetArticulation(ArticulationsNames[a]);
        parameters.articulationName = ArticulationSet[a];
        queueMessages.enqueue("\n------------------------ Articulation : " + ArticulationsNames[a] + " ------------------------ \n");

        for (let Nb_Points = 4; Nb_Points < Config.Sampling + 1; Nb_Points = Nb_Points * 2) {
          Message.SetSample(Nb_Points.toString());
          Str_Nb_Points += (Nb_Points + " ");
          parameters.numPoints = Nb_Points;
          if (Config.Eval) {
            Message.SetEval("UI");

            let result = StartUserIndepTesting(dataset, parameters, recognizer, Message, queueMessages, SaveTraining);       
            
            PrintResults(result, Nb_Points, ArticulationsNames[a], recognizer, Message);
          }
          else {
            Message.SetEval("UD");
            let result = StartUserDepTesting(dataset, parameters, data_set.Name, recognizer, Message, queueMessages, SaveTraining);
            PrintResults_UserDep(result, Nb_Points, ArticulationsNames[a], recognizer, Message);
          }
        }

        console.log(Str_Nb_Points);
        process.stdout.write(`\n`);
      }
    });

  });
  var Exec_Time_Duration = Date.now() - Exec_Time_Start;
  
  LogMessage.PrintLogs(queueMessages, Exec_Time_Duration);
};

/******************************************************************************************************
                                        Testing Functions (UI/UD)  
*******************************************************************************************************/

let StartUserIndepTesting = function (dataset, Parameters,Recognizer,Message,queueMessages,Save_configuration) 
{
  let Participant_Templates_Results=[]
  let Participant_recognition_rates = [];
  let Participant_execution_time = [];
  let Participant_PreProcessing_time = [];
  let Participant_Classification_time = [];
  let Particant_average_class_execution_time=[];
  let Particant_average_class_PreProcessing_time=[];
  let Particant_average_class_Classification_time=[];
  
  let Number_TValue_PerParticipant= [];
  //Shrec2019
  //let options={"samplingPoints":s,"palmThreshold":0.10,"fingerThreshold":0.01};
  //Other datasets
  //  let options={"samplingPoints":s,"palmThreshold":50,"fingerThreshold":0};


  for (let Number_participant = 1; Number_participant <= Math.min(dataset.getMinUser(), MAX_P)-1; Number_participant = Number_participant + 1) 
  {
    if( Number_participant == 1||Number_participant == 2||Number_participant == 4||Number_participant == 8||Number_participant == 16)
    {
      Message.SetParticipant(Number_participant.toString());
       //for each number of participant
      let Participant_current_recognition_score = 0;
      let Participant_current_execution_time = 0.0, Participant_current_PreProcessing_time = 0.0, Participant_current_Classifcation_time = 0.0;
      let Number_of_Tvalue=0;
     
      let recognition_rates = [];
      let Ar_execution_time = [];
      let Ar_PreProcessing_time = [];
      let Ar_Classification_time = [];
      let confusion_matrices = [];
      let cl_execution_time = [];
      let cl_PreProcessing_time = [];
      let cl_Classification_time = [];

      let Test_RawData = [];

      let Test_Raw_Execution_Time = [];
      let Test_Raw_PreProcessing_time = [];
      let Test_Raw_Calssification_time = [];

      let AllParticipants = getParticipants(dataset);

      let Gesture_Numbers;

      let Participant_class_execution_time = [], Participant_class_PreProcessing_time = [], Participant_class_Classification_time = [];
      dataset.getGestureClass().forEach((gesture) => 
          {
            Participant_class_execution_time[gesture.index] = 0;
            Participant_class_PreProcessing_time[gesture.index] = 0;
            Participant_class_Classification_time[gesture.index] = 0;
          });
      //Rubine Should begin with 2 templates

      for (let Number_template = 1; Number_template <= Math.min(dataset.getMinTemplatePerUser(AllParticipants), MAXT); Number_template = Number_template + 1) 
      {
        if( Number_template == 1||Number_template == 2||Number_template == 4||Number_template == 8||Number_template == 16)
        {
          Message.SetTemplates(Number_template.toString());
          Number_of_Tvalue++;
        try{
          //for each training set size
          let Training_current_recognition_score = 0;
          let Training_current_execution_time = 0.0, Training_current_PreProcessing_time = 0.0, Training_current_Classification_time = 0.0;
          let Training_class_execution_time = [], Training_class_PreProcessing_time = [], Training_class_Classification_time = [];

          dataset.getGestureClass().forEach((gesture) => 
          {
              Training_class_execution_time[gesture.index] = 0;
              Training_class_PreProcessing_time[gesture.index] = 0;
              Training_class_Classification_time[gesture.index] = 0;
          });

          let current_confusion_matrice = new Array(dataset.G).fill(0).map(() => new Array(dataset.G).fill(0));
          let template_Test_Raw = [];
          let template_ExecutionTime_Raw = [], template_PreprocessingTime_Raw = [], template_ClassificationTime_Raw = [] ;
         
          
          Gesture_Numbers=[];

          if(!SaveTraining){
            try{
           var gesturesLoaded = require(".\\public\\json\\Results\\TrainingGestures\\"+
           Message._Eval+"\\"+Message._Dataset+"\\"+Message._Recognizer+
           "\\"+Message._Articulations+
           "\\N"+Message._NbSample+"_P"+Message._NbParticipant+"_T"+Message._NbTemplates+".json");         
            }
            catch{
              queueMessages.enqueue( "# "+  new Date().toLocaleDateString("fr-BE").replaceAll("/","-")
              +" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ Message._Dataset +" ,"+Message._Recognizer+ " ,A:" + Message._Articulations+ " ,N:" + Message._NbSample+" ,T:" + Message._NbTemplates+" ,U:" + Message._NbParticipant+" # Error! Cannot open saved gesture files");
            }
          
          }else{
          }
          

          for (let repetition = 0; repetition < R; repetition++) 
            {
              let candidates=[];
              let training_templates;

              //repeat R time
              let Recognized_Gesture = 0;
              let execution_time = 0.0, PreProcessing_time=0.0, Classification_time=0.0 ;
              //Add the dataset parameter for Rubine's recognizers//Don't add it, otherwise the candidate gesture will be trained
              let recognizer = new Recognizer(Parameters);
              // let recognizer = new Recognizer(options);

              //For Dataset with train/Test subdatasets
              //let candidates = SelectCandidates2(dataset);

              //For Dataset with per user subdatasets
              //let candidates = SelectCandidates(dataset);

             
              
            if(SaveTraining)  {
                let training_Participants = [];
                NumCandidateParticipant = getRandomParticipant(AllParticipants);

                //For UI evaluation with determined participants
                candidates =SelectCandidatesFromParticipant(dataset,  NumCandidateParticipant);
                training_templates = [];

                //Push the index of candidate gestures to recognize
                candidates.forEach((val) => 
                {
                    training_templates.push([val]);
                });

                while( training_Participants.length < Number_participant ){
                  let trainingParticipant=-1;
                  while(  trainingParticipant== -1 || training_Participants.includes(trainingParticipant) || trainingParticipant == NumCandidateParticipant ){
                  trainingParticipant= getRandomParticipant(AllParticipants);
                }
                training_Participants.push(trainingParticipant);
              }

              for(let trainingParticipant = 0; trainingParticipant < training_Participants.length; trainingParticipant++ ){
                for (let template = 0; template < Number_template; template++) 
                {
                  //add Number_template per gestureClass
                  let index = 0;
                  dataset.getGestureClass().forEach((gesture) => 
                  {
                    SamplesIndex = gesture.getSampleParticipant(training_Participants[trainingParticipant]);
                    
                    let training = -1;
                    while (training == -1 || training_templates[index].includes(training))
                    {
                      training = GetRandomNumber(SamplesIndex[0],SamplesIndex[1]);
                    }
                    training_templates[index].push(training);
  
                    recognizer.addGesture(gesture.name, gesture.getSample()[training], Parameters.articulationName);
                    index++;
                  });
                }
              }
              Gesture_Numbers.push(training_templates);
            }else{
              training_templates =[];
              ReadGestures = gesturesLoaded.Repetition[repetition];
              dataset.getGestureClass().forEach((gesture) => 
              {                
                candidates.push(ReadGestures[gesture.index].Candidate);
                training_templates=ReadGestures[gesture.index].Training;
                training_templates.forEach( function(g) {
                  recognizer.addGesture(gesture.name, gesture.getSample()[g], Parameters.articulationName)
                });                
                
              });
              
            }
           
             

              if (Recognizer.name == "JackKnifeRecognizer") 
              {
                try 
                  {
                    recognizer.Train(); //code that causes an error of non invertible covariance matrix occurence rate ~0.00001
                  } 
                catch (e) 
                  {
                    continue; //Ignore this instance of the test
                  }
              }

              // Recognition after Number_template training templates
              let c = 0;

              dataset.getGestureClass().forEach((gesture) => 
              {
                let toBeTested = gesture.getSample()[candidates[c]];

                let result = recognizer.recognize(toBeTested, Parameters.articulationName);
                if (dataset.getGestureClass().has(result.Name)) 
                {
                  let result_index = dataset.getGestureClass().get(result.Name).index;
                  current_confusion_matrice[gesture.index][result_index] += 1;
                }
                Recognized_Gesture += result.Name === gesture.name ? 1 : 0;
                execution_time += result.Time;
                PreProcessing_time += result.PreProcessTime;
                Classification_time += result.ClassificationTime;
                
                Training_current_recognition_score += result.Name === gesture.name ? 1 : 0;
                Training_current_execution_time += result.Time;
                Training_current_PreProcessing_time += result.PreProcessTime;
                Training_current_Classification_time += result.ClassificationTime;
                Training_class_execution_time[gesture.index] += result.Time;
                Training_class_PreProcessing_time[gesture.index] += result.PreProcessTime;
                Training_class_Classification_time[gesture.index] += result.ClassificationTime;
                c++;
              });

              template_Test_Raw.push(Recognized_Gesture);
              template_ExecutionTime_Raw.push(execution_time /  dataset.G);
              template_PreprocessingTime_Raw.push(PreProcessing_time /  dataset.G);
              template_ClassificationTime_Raw.push(Classification_time /  dataset.G);
              
          }


          for(let i=0; i<Participant_class_execution_time.length; i++){
            Participant_class_execution_time[i] += Training_class_execution_time[i] ;
            Participant_class_PreProcessing_time[i] += Training_class_PreProcessing_time[i] ;
            Participant_class_Classification_time[i] += Training_class_Classification_time[i] ;
          }     

          Participant_current_recognition_score += Training_current_recognition_score;
          Participant_current_execution_time += Training_current_execution_time;
          Participant_current_PreProcessing_time += Training_current_PreProcessing_time;
          Participant_current_Classifcation_time += Training_current_Classification_time;

          recognition_rates.push(Training_current_recognition_score);
          Ar_execution_time.push(Training_current_execution_time);
          Ar_PreProcessing_time.push(Training_current_PreProcessing_time);
          Ar_Classification_time.push(Training_current_Classification_time);

          confusion_matrices.push(current_confusion_matrice);
          cl_execution_time.push(Training_class_execution_time);
          cl_PreProcessing_time.push(Training_class_PreProcessing_time);
          cl_Classification_time.push(Training_class_Classification_time);
          
          Test_RawData.push(template_Test_Raw);
          Test_Raw_Execution_Time.push(template_ExecutionTime_Raw);
          Test_Raw_PreProcessing_time.push(template_PreprocessingTime_Raw);
          Test_Raw_Calssification_time.push(template_ClassificationTime_Raw);

          if (Save_configuration == true){

            Save_TrainingSet (Message, Gesture_Numbers,queueMessages);
          }          
          queueMessages.enqueue(Message.ToString_UI());
        }
          catch(e){ 
            queueMessages.enqueue( "# "+ new Date().toLocaleDateString("fr-BE").replaceAll("/","-") +" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ Message._Dataset +" ,"+Message._Recognizer+ " ,A:" + Message._Articulations+ " ,N:" + Message._NbSample+" ,P:" + Message._NbParticipant+" ,T:" + Message._NbTemplates+" # Error!");
          }
         
        }
      }
      Number_TValue_PerParticipant.push(Number_of_Tvalue);
      for (let i =   0; i < recognition_rates.length; i++) 
      {
        recognition_rates[i] = recognition_rates[i] / (R * dataset.G);
        Ar_execution_time[i] = Ar_execution_time[i] / (R * dataset.G);
        Ar_PreProcessing_time[i] = Ar_PreProcessing_time[i] / (R * dataset.G);
        Ar_Classification_time[i] = Ar_Classification_time[i] / (R * dataset.G);
        Object.keys(cl_execution_time[i]).forEach((row) => 
        {
          cl_execution_time[i][row] = cl_execution_time[i][row] / 100;
          cl_PreProcessing_time[i][row] = cl_PreProcessing_time[i][row] / 100;
          cl_Classification_time[i][row] = cl_Classification_time[i][row] / 100;
        });
      }
      Participant_recognition_rates.push(Participant_current_recognition_score);
      Participant_execution_time.push(Participant_current_execution_time);
      Participant_PreProcessing_time.push(Participant_current_PreProcessing_time);
      Participant_Classification_time.push(Participant_current_Classifcation_time);

      Particant_average_class_execution_time.push(Participant_class_execution_time);
      Particant_average_class_PreProcessing_time.push(Participant_class_PreProcessing_time);
      Particant_average_class_Classification_time.push(Participant_class_Classification_time);

      Participant_Templates_Results.push([recognition_rates, Ar_execution_time, confusion_matrices, cl_execution_time, Test_RawData, Test_Raw_Execution_Time,Ar_PreProcessing_time,Ar_Classification_time,cl_PreProcessing_time,cl_Classification_time,Test_Raw_PreProcessing_time,Test_Raw_Calssification_time])
   }
  }
  for (let i =   0; i < Participant_recognition_rates.length; i++) 
      {
        Participant_recognition_rates[i] = Participant_recognition_rates[i] / (R * dataset.G * Number_TValue_PerParticipant[i]);
        Participant_execution_time[i] = Participant_execution_time[i] / (R * dataset.G * Number_TValue_PerParticipant[i]);
        Participant_PreProcessing_time[i] = Participant_PreProcessing_time[i] / (R * dataset.G * Number_TValue_PerParticipant[i]);
        Participant_Classification_time[i] = Participant_Classification_time[i] / (R * dataset.G * Number_TValue_PerParticipant[i]);
        Object.keys(Particant_average_class_execution_time[i]).forEach((row) => 
        {
          Particant_average_class_execution_time[i][row] = Particant_average_class_execution_time[i][row] / (100*Number_TValue_PerParticipant[i]);
          Particant_average_class_PreProcessing_time[i][row] = Particant_average_class_PreProcessing_time[i][row] / (100*Number_TValue_PerParticipant[i]);
          Particant_average_class_Classification_time[i][row] = Particant_average_class_Classification_time[i][row] / (100*Number_TValue_PerParticipant[i]);
        });
      }

  return [Participant_recognition_rates,Participant_execution_time,Particant_average_class_execution_time,Participant_Templates_Results,Participant_PreProcessing_time,Participant_Classification_time,Particant_average_class_PreProcessing_time,Particant_average_class_Classification_time];
};



let StartUserDepTesting = function (dataset, Parameters,dataset_Name,Recognizer,Message,queueMessages,Save_configuration) 
{
  let recognition_rates = [];
  let execution_time = [], Preprocessing_time=[], Classification_time=[];
  let confusion_matrices = [];

  let Global_confusion_matrices = [];
  let Global_Rates = [];
  let Global_execution_times = [], Global_Preprocessing_times=[], Global_Classifcation_times=[],Global_cl_execution_times=[];
  let MinimTempNumb = 0;
  let Test_RawData = [];
  let Test_Raw_Execution_Time = [], Test_Raw_Preprocessing_Time = [], Test_Raw_Classifcation_Time=[];
  let cl_execution_times = [],  cl_Preprocessing_times = [],  cl_Classifcation_times = [];
  Object.keys(dataset).forEach((user) => {
    MinimTempNumb = dataset[user].getMinTemplate();
  });
  let Gesture_Numbers;

  for (let Number_template = 1; Number_template < Math.min(MinimTempNumb, MAXT + 1); Number_template = Number_template + 1) 
    {
      if( Number_template == 1||Number_template == 2||Number_template == 4||Number_template == 8||Number_template == 16)
        {
          Message.SetTemplates(Number_template.toString());
          try
            {
            
              //for each training set size
              let recognition_rates_User = [];
              let execution_time_User = [],Preprocessing_time_User = [] ,Classification_time_User = [] ;
              let confusion_matrices_User = [];
              let Global_Rate = 0.0;
              let Global_execution_time = 0.0, Global_Classifcation_time=0.0, Global_Preprocessing_time=0.0;
              let Global_confusion_matrix = [],Global_cl_execution_time=[];
              
              let user_rawdata_set = [];
              let user_raw_Execution_time_set = [], user_raw_PreProcessing_time_set= [] , user_raw_Classification_time_set=[] ;
              let current_execution_time=0, current_PreProcessing_time =0, current_Classification_time=0;
              let cl_execution_time = [], cl_Preprocessing_time = [], cl_Classifcation_time=[];
              dataset[[Object.keys(dataset)[0]]].getGestureClass()
              .forEach((gesture) => {
                  Global_cl_execution_time[gesture.index] = 0;
                });

              for (let i = 0; i < dataset[Object.keys(dataset)[0]].G; i++) {
                Global_confusion_matrix[i] = [];
                for (let j = 0; j < dataset[Object.keys(dataset)[0]].G; j++) {
                  Global_confusion_matrix[i][j] = 0;
                }
              }

              Object.keys(dataset).forEach((user) => 
              { Gesture_Numbers=[];
                Message.SetParticipant(user);

                if(!SaveTraining){
                  try{
                   var gesturesLoaded = require(".\\public\\json\\Results\\TrainingGestures\\"+Message._Eval+"\\"+Message._Dataset+"\\"+Message._Recognizer+
                   "\\"+Message._Articulations+"\\N"+Message._NbSample+"_T"+Message._NbTemplates+"_U"+Message._NbParticipant+".json");                  }
               
                catch(e){
                  queueMessages.enqueue( "# "+ new Date().toLocaleDateString("fr-BE").replaceAll("/","-")+" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ Message._Dataset +" ,"+Message._Recognizer+ " ,A:" + Message._Articulations+ " ,N:" + Message._NbSample+" ,T:" + Message._NbTemplates+" ,U:" + Message._NbParticipant+" # Error!");
                }
              }

                Message.SetParticipant(user);
                let current_recognition_score = 0;
                let user_execution_time = 0.0, user_Prepocessing_time=0.0, user_Classification_time=0.0;
                let current_confusion_matrice = new Array(dataset[user].G).fill(0).map(() => new Array(dataset[user].G).fill(0));
                let template_Test_Raw = [];
                let Time_Test_Raw = [], PreProcessing_time_Raw=[], Classification_time_Raw=[];
                let class_execution_time = [], class_Preprocessing_time=[], class_Classification_time =[];
                
                dataset[[Object.keys(dataset)[0]]].getGestureClass().forEach((gesture) => {
                  class_execution_time[gesture.index] = 0;
                  class_Preprocessing_time[gesture.index] = 0;
                  class_Classification_time[gesture.index] = 0;
                });

                for (let repetition = 0; repetition < R; repetition++) 
                  {
                      current_execution_time = 0.0;
                      current_PreProcessing_time =0.0;
                      current_Classification_time=0.0;
                        //repeat R time
                      let Recognized_Gesture = 0;
                        //Don't add the dataset, otherwise the candidate gesture will be trained
                      let recognizer = new Recognizer(Parameters,dataset_Name);
                      let candidates =[];

                      if(SaveTraining){
                              candidates = SelectCandidates(dataset[user]);
                              let training_templates = [];
            
                              candidates.forEach((val) => 
                              {
                                training_templates.push([val]);
                              });
                              for (let t = 0; t < Number_template; t++) 
                              {
                                //add Number_template strokeData per gestureClass
                                let index = 0;
                                dataset[user].getGestureClass().forEach((gesture) => 
                                {
                                  let training = -1;
                                  while (training == -1 || training_templates[index].includes(training))
                                  {
                                    training = GetRandomNumber(0, gesture.getSample().length);
                                  }                        
                                  training_templates[index].push(training);
                                  recognizer.addGesture(gesture.name, gesture.getSample()[training], Parameters.articulationName);
                                  index++;
                                });
                              }  
                              Gesture_Numbers.push(training_templates);
                        }else{
                          training_templates =[];
                          ReadGestures = gesturesLoaded.Repetition[repetition];
                          dataset[user].getGestureClass().forEach((gesture) => 
                          {                
                            candidates.push(ReadGestures[gesture.index].Candidate);
                            training_templates=ReadGestures[gesture.index].Training;
                            training_templates.forEach( function(g) {
                              recognizer.addGesture(gesture.name, gesture.getSample()[g], Parameters.articulationName)
                            });                
                            
                          });
                        }
                      

                        /*  try {
                                      recognizer.Train();//code that causes an error of non invertible covariance matrix occurence rate ~0.00001
                                  } catch (e) {
                                      continue;//Ignore this repetition of the test
                                  }*/

                        // Recognition after Number_template training templates
                      let c = 0;
                      dataset[user].getGestureClass().forEach((gesture) => 
                        {
                          let toBeTested = gesture.getSample()[candidates[c]];
                          let result = recognizer.recognize(toBeTested, Parameters.articulationName);
                          if (dataset[user].getGestureClass().has(result.Name)) 
                            {
                              let result_index = dataset[user].getGestureClass().get(result.Name).index;
                              current_confusion_matrice[gesture.index][result_index] += 1;
                              Global_confusion_matrix[gesture.index][result_index] += 1;
                            }
                          Recognized_Gesture += result.Name === gesture.name ? 1 : 0;
                          current_execution_time += result.Time;
                          current_PreProcessing_time += result.PreProcessTime;
                          current_Classification_time += result.ClassificationTime;

                          current_recognition_score += result.Name === gesture.name ? 1 : 0;
                          Global_Rate += result.Name === gesture.name ? 1 : 0;
                          //console.log(current_execution_time);
                        
                          Global_execution_time += result.Time;
                          Global_Classifcation_time += result.ClassificationTime;;
                          Global_Preprocessing_time += result.PreProcessTime;

                          class_execution_time[gesture.index] += result.Time;
                          class_Preprocessing_time[gesture.index] += result.PreProcessTime;
                          class_Classification_time[gesture.index] += result.ClassificationTime;
                          Global_cl_execution_time[gesture.index] += result.Time;
                          c++;
                        });
                      user_execution_time+= current_execution_time;
                      user_Prepocessing_time+= current_PreProcessing_time;
                      user_Classification_time+= current_Classification_time;
                      template_Test_Raw.push(Recognized_Gesture);

                      Time_Test_Raw.push(current_execution_time  / dataset[Object.keys(dataset)[0]].G);
                      PreProcessing_time_Raw.push(current_PreProcessing_time  / dataset[Object.keys(dataset)[0]].G);
                      Classification_time_Raw.push(current_Classification_time  / dataset[Object.keys(dataset)[0]].G);
                    }
                  
                user_rawdata_set.push(template_Test_Raw);
                user_raw_Execution_time_set.push(Time_Test_Raw);
                user_raw_PreProcessing_time_set.push(PreProcessing_time_Raw);
                user_raw_Classification_time_set.push(Classification_time_Raw);

                recognition_rates_User.push(current_recognition_score);
                execution_time_User.push(user_execution_time);
                Preprocessing_time_User.push(user_Prepocessing_time);
                Classification_time_User.push(user_Classification_time);
                confusion_matrices_User.push(current_confusion_matrice);
                  
                for (let i = 0; i < class_execution_time.length; i++) 
                {
                  class_execution_time[i] = class_execution_time[i] / (R);
                  class_Preprocessing_time[i] = class_Preprocessing_time[i] / (R);
                  class_Classification_time[i] = class_Classification_time[i] / (R);
                }

                cl_execution_time.push(class_execution_time);
                cl_Preprocessing_time.push(class_Preprocessing_time);
                cl_Classifcation_time.push(class_Classification_time);
                  
                if (Save_configuration == true)
                {
                  Save_TrainingSet (Message, Gesture_Numbers,queueMessages);
                }          
                 queueMessages.enqueue(Message.ToString_UD());

              });
                

                for (let i = 0; i < Global_cl_execution_time.length; i++) {
                  Global_cl_execution_time[i] = Global_cl_execution_time[i] / (R * Object.keys(dataset).length);
                }
                for (let i = 0; i < recognition_rates_User.length; i++) 
                {
                  recognition_rates_User[i] = recognition_rates_User[i] / (R * dataset[Object.keys(dataset)[0]].G);
                  execution_time_User[i] = execution_time_User[i] / (R * dataset[Object.keys(dataset)[0]].G);
                  Preprocessing_time_User[i] = Preprocessing_time_User[i] / (R * dataset[Object.keys(dataset)[0]].G);
                  Classification_time_User[i] = Classification_time_User[i] / (R * dataset[Object.keys(dataset)[0]].G);
                }

                Global_Rate = Global_Rate / (R * Object.keys(dataset).length * dataset[Object.keys(dataset)[0]].G);
                Global_execution_time = (Global_execution_time * 1.0) / (R * Object.keys(dataset).length * dataset[Object.keys(dataset)[0]].G * 1.0);
                Global_Preprocessing_time = (Global_Preprocessing_time * 1.0) / (R * Object.keys(dataset).length * dataset[Object.keys(dataset)[0]].G * 1.0);
                Global_Classifcation_time = (Global_Classifcation_time * 1.0) / (R * Object.keys(dataset).length * dataset[Object.keys(dataset)[0]].G * 1.0);
              
                recognition_rates.push(recognition_rates_User);
                execution_time.push(execution_time_User);
                Preprocessing_time.push(Preprocessing_time_User);
                Classification_time.push(Classification_time_User);
                confusion_matrices.push(confusion_matrices_User);

                cl_execution_times.push(cl_execution_time);
                cl_Preprocessing_times.push(cl_Preprocessing_time);
                cl_Classifcation_times.push(cl_Classifcation_time);

                Global_Rates.push(Global_Rate);
                Global_execution_times.push(Global_execution_time);
                Global_Preprocessing_times.push(Global_Preprocessing_time);
                Global_Classifcation_times.push(Global_Classifcation_time);
                Global_confusion_matrices.push(Global_confusion_matrix);
                Global_cl_execution_times.push(Global_cl_execution_time);

                Test_RawData.push(user_rawdata_set);
                Test_Raw_Execution_Time.push(user_raw_Execution_time_set);
                Test_Raw_Preprocessing_Time.push(user_raw_PreProcessing_time_set);
                Test_Raw_Classifcation_Time.push(user_raw_Classification_time_set);        
              }
              catch(e){                

                queueMessages.enqueue( "# "+ new Date().toLocaleDateString("fr-BE").replaceAll("/","-")+" " + new Date().toLocaleTimeString("fr-BE") +" ,DS:"+ Message._Dataset +" ,"+Message._Recognizer+ " ,A:" + Message._Articulations+ " ,N:" + Message._NbSample+" ,T:" + Message._NbTemplates+" ,U:" + Message._NbParticipant+" # Error!");
              }
          };
    };
  return [[ recognition_rates, execution_time, confusion_matrices, cl_execution_times, Global_confusion_matrices, Global_Rates, Global_execution_times, Test_RawData, Test_Raw_Execution_Time,Preprocessing_time, Classification_time, cl_Preprocessing_times, cl_Classifcation_times,Global_Preprocessing_times,Global_Classifcation_times,Test_Raw_Preprocessing_Time,Test_Raw_Classifcation_Time ,Global_cl_execution_times]];
};

/**
 * Select a candidate by gesture for a data set with gestures per participant
 */
let SelectCandidates = function (dataset) {
  let candidates = [];
  dataset.getGestureClass().forEach((value) => {
    candidates.push(GetRandomNumber(0, value.getSample().length));
  });
  return candidates;
};


/**
 * Select a candidate by gesture for a data set with gestures per participant
 */
 let SelectCandidatesFromParticipant = function (dataset, NumParticipant) {
  let candidates = [];
  let SamplesIndex = [];
   dataset.getGestureClass().forEach((value) => {  
    SamplesIndex = value.getSampleParticipant(NumParticipant);
    candidates.push(GetRandomNumber(SamplesIndex[0],SamplesIndex[1]));
  });
  return candidates;
};

/**
 * Retrieve the participants that performed the gesture
 * */
let getParticipants = function (dataset){
  AllParticipantsPossible = [];
  //Create the shortest array with the participants that have at least one template for all the gestures
  dataset.getGestureClass().forEach((value) => {  
  AllParticipantsPossible[value.index] = Array.from(new Set(value.samples.map(function (sample) {return sample.subject;})));
  });
  let Participants= AllParticipantsPossible.reduce((a, b) => a.filter(c => b.includes(c)));
  return Participants;
}

let GetRandomNumber = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
};


/**
 * Choose randomly a participant from all participants */

let getRandomParticipant = function (Participants) {
  let max = Math.floor(Participants.length);
  return Participants[Math.floor(Math.random() * (max))];
};


/******************************************************************************************************
                                        Results & Information Printing Functions
*******************************************************************************************************/
let PrintResults = function (Results_Array, Number_Points, ArticulationsNames,Recognizer,Message) {
  var date=new Date().toLocaleDateString("fr-BE").replaceAll("/","-");
  var time= new Date().toLocaleTimeString("fr-BE",{hour: '2-digit', minute:'2-digit'}).replaceAll(":","-");
  dir=".\\public\\json\\Results\\Testing\\"+Message._Eval+"\\"+Message._Dataset+"\\"+Recognizer.name+"_"+date+"_"+time+"\\";
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
  var stream = fs.createWriteStream( dir + Recognizer.name+"_"+ ArticulationsNames +"_" + Number_Points+".json");

  stream.once("open", function () {
    stream.write("{\n\t\"Recognizer_name\" : \"" + RECOGNIZERS[0] + "\",\n\t\"Nbr_of_repetition\" : " + R + ",\n\t\"Nbr_of_points[N]\" : " + 
    Number_Points + ",\n\t");
    stream.write("\"Gesture_Set\": " + JSON.stringify(Array.from(dataset.getGestureClass().keys())) + ",\n");
    stream.write("\t\"Global_Results_By_NbParticipants"+ "\": [\n");
    for(let Participant=0; Participant < Results_Array[0].length; Participant++) {
      stream.write("\t\t\t\t\t{\n");
      stream.write("\t\t\t\t\t\t\"Nbr_Participants[P]\": " + (Math.pow(2,Participant)) + 
      ",\n\t\t\t\t\t\t\"Recognition_Accuracy(%)\": " + (Results_Array[0][Participant] * 100).toFixed(3) +
            ",\n\t\t\t\t\t\t\"Execution_Time(ms)\": " + Results_Array[1][Participant].toFixed(4) + 
            ",\n\t\t\t\t\t\t\"PreProcessing_Time(ms)\": " + Results_Array[4][Participant].toFixed(4) + 
            ",\n\t\t\t\t\t\t\"Classification_Time(ms)\": " + Results_Array[5][Participant].toFixed(4) + ",\n");
      stream.write("\t\t\t\t\t\t\"Execution_Time_by_class\": [");
        for (let class_cpt = 0; class_cpt < Results_Array[2][Participant].length; class_cpt++) 
          {
              stream.write(JSON.stringify( Math.round( Results_Array[2][Participant][class_cpt] * 1e4 ) / 1e4));
              if(class_cpt < Results_Array[2][Participant].length-1)
              {
                stream.write(",");
              }
          }
        stream.write("],\n");
        stream.write("\t\t\t\t\t\t\"PreProcessing_Time_by_class\": [");
        for (let class_cpt = 0; class_cpt < Results_Array[6][Participant].length; class_cpt++) 
          {
              stream.write(JSON.stringify( Math.round( Results_Array[6][Participant][class_cpt] * 1e4 ) / 1e4));
              if(class_cpt < Results_Array[6][Participant].length-1)
              {
                stream.write(",");
              }
          }
        stream.write("],\n");
        stream.write("\t\t\t\t\t\t\"Classifcation_Time_by_class\": [");
        for (let class_cpt = 0; class_cpt < Results_Array[7][Participant].length; class_cpt++) 
          {
              stream.write(JSON.stringify( Math.round( Results_Array[7][Participant][class_cpt] * 1e4 ) / 1e4));
              if(class_cpt < Results_Array[7][Participant].length-1)
              {
                stream.write(",");
              }
          }
        stream.write("],\n");
        stream.write("\t\t\t\t\t\t\"Global_Results_By_NbTemplates\"  : [\n");
        for ( let i = 0; i < Results_Array[3][Participant][0].length && i < Results_Array[3][Participant][1].length; i++) {         
          stream.write("\t\t\t\t\t\t\t\t\t\t{\n"); 
          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Nbr_training_templates[T]\": " + (Math.pow(2,i)) + 
                      ",\n\t\t\t\t\t\t\t\t\t\t\t\"Recognition_Accuracy(%)\": " + (Results_Array[3][Participant][0][i] * 100).toFixed(3) +
                      ",\n\t\t\t\t\t\t\t\t\t\t\t\"Execution_Time(ms)\": " + (Results_Array[3][Participant][1][i]).toFixed(4) + 
                      ",\n\t\t\t\t\t\t\t\t\t\t\t\"Preprocessing_Time(ms)\": " + (Results_Array[3][Participant][6][i]).toFixed(4) + 
                      ",\n\t\t\t\t\t\t\t\t\t\t\t\"Classification_Time(ms)\": " + (Results_Array[3][Participant][7][i]).toFixed(4) + 
                      ",\n"
                      );
          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Confusion_matrix\": [");
          for (let l = 0; l < Results_Array[3][Participant][2][i].length; l++) 
          {
            stream.write(JSON.stringify(Results_Array[3][Participant][2][i][l]));
            if(l<Results_Array[3][Participant][2][i].length-1)
            {
              stream.write(",");
            }
          }
          stream.write("],\n");
          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Execution_Time_by_class\": [");
          for (let class_cpt = 0; class_cpt < Results_Array[3][Participant][3][i].length; class_cpt++) 
          {
            stream.write(JSON.stringify( Math.round( Results_Array[3][Participant][3][i][class_cpt] * 1e4 ) / 1e4));
            if(class_cpt < Results_Array[3][Participant][3][i].length-1)
            {
              stream.write(",");
            }
          }
          stream.write("],\n");

          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Preprocessing_Time_by_class\": [");
          for (let class_cpt = 0; class_cpt < Results_Array[3][Participant][8][i].length; class_cpt++) 
          {
            stream.write(JSON.stringify( Math.round( Results_Array[3][Participant][8][i][class_cpt] * 1e4 ) / 1e4));
            if(class_cpt < Results_Array[3][Participant][8][i].length-1)
            {
              stream.write(",");
            }
          }
          stream.write("],\n");

          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Classification_Time_by_class\": [");
          for (let class_cpt = 0; class_cpt < Results_Array[3][Participant][9][i].length; class_cpt++) 
          {
            stream.write(JSON.stringify( Math.round( Results_Array[3][Participant][9][i][class_cpt] * 1e4 ) / 1e4));
            if(class_cpt < Results_Array[3][Participant][9][i].length-1)
            {
              stream.write(",");
            }
          }
          stream.write("],\n");
          
          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Raw_Recognition_Rate\": " + JSON.stringify(Results_Array[3][Participant][4][i]) + ",\n");

          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Raw_Execution_Time\": [");
          for (let l = 0; l < Results_Array[3][Participant][5][i].length; l++) 
          {
            stream.write( JSON.stringify( Math.round( Results_Array[3][Participant][5][i][l]* 1e4 ) / 1e4))
            if(l<Results_Array[3][Participant][5][i].length-1)
              {
                  stream.write(",");
              }
          };
            stream.write("],\n");

          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Raw_PreProcessing_Time\": [");
          for (let l = 0; l < Results_Array[3][Participant][10][i].length; l++) 
          {
            stream.write( JSON.stringify( Math.round( Results_Array[3][Participant][10][i][l]* 1e4 ) / 1e4))
            if(l<Results_Array[3][Participant][10][i].length-1)
              {
                  stream.write(",");
              }
          };
            stream.write("],\n");
          
          stream.write("\t\t\t\t\t\t\t\t\t\t\t\"Raw_Classification_Time\": [");
          for (let l = 0; l < Results_Array[3][Participant][11][i].length; l++) 
          {
            stream.write( JSON.stringify( Math.round( Results_Array[3][Participant][11][i][l]* 1e4 ) / 1e4))
            if(l<Results_Array[3][Participant][11][i].length-1)
              {
                  stream.write(",");
              }
          };
            stream.write("]\n");

            stream.write("\t\t\t\t\t\t\t\t\t\t}");
            if(i<Results_Array[3][Participant][0].length-1)
            {
              stream.write(",");
            }
            stream.write("\n");
        }
        stream.write("\t\t\t\t\t\t\t\t\t]\n");
        stream.write("\t\t\t\t\t}");
        if(Participant<Results_Array[0].length-1)
            {
              stream.write(",");
            }
        stream.write("\n");
     }
    stream.write("\t\t\t]\n}");
    stream.end();
  }); 
};


let PrintResults_UserDep = function (results, Nb_Points, ArticulationsNames,Recognizer,Message)  {
  var date=new Date().toLocaleDateString("fr-BE").replaceAll("/","-");
  var time= new Date().toLocaleTimeString("fr-BE",{hour: '2-digit', minute:'2-digit'}).replaceAll(":","-");
  dir=".\\public\\json\\Results\\Testing\\"+Message._Eval+"\\"+Message._Dataset+"\\"+Recognizer.name+"_"+date+"_"+time+"\\";
   if (!fs.existsSync(dir)){
     fs.mkdirSync(dir, { recursive: true });
 }

  var stream = fs.createWriteStream(dir+ Recognizer.name + "_" +  ArticulationsNames + "_" + Nb_Points + ".json");
  stream.once("open", function () 
  {
    for (let Result = 0; Result < results.length; Result++) {
      stream.write("{\n\t\t\"Recognizer_name\" : \"" + RECOGNIZERS[Result] + 
      "\",\n\t\t\"Nbr_of_repetition\" : " + R + 
      ",\n\t\t\"Nbr_of_points[N]\" : " +  Nb_Points + ",\n");
      stream.write("\t\t\"Gesture_Set\": " + JSON.stringify(Array.from(dataset[Object.keys(dataset)[0]].getGestureClass().keys())) + ",\n");
      stream.write("\t\t\"Global_Results_By_NbTemplates\": [\n");
      for (let NbTemplate = 0; NbTemplate < results[Result][5].length && NbTemplate < results[Result][6].length; NbTemplate++) 
      {
        
        stream.write("\t\t\t\t{\n"); /**ToDefine the closing*/
        stream.write("\t\t\t\t\t\"Nbr_training_templates[T]\": " + (Math.pow(2,NbTemplate)) + ",\n");
        stream.write("\t\t\t\t\t\"Recognition_Accuracy(%)\": " + (results[Result][5][NbTemplate] * 100).toFixed(3) +",\n");
        stream.write("\t\t\t\t\t\"Execution_Time(ms)\": " + results[Result][6][NbTemplate].toFixed(4) + ",\n");
        stream.write("\t\t\t\t\t\"PreProcessing_Time(ms)\": " + results[Result][13][NbTemplate].toFixed(4) + ",\n"); /**ToDefine */
        stream.write("\t\t\t\t\t\"Classification_Time(ms)\": " + results[Result][14][NbTemplate].toFixed(4) + ",\n");/**ToDefine */

        stream.write("\t\t\t\t\t\"Confusion_matrix\": [");
        for (let l = 0; l < results[Result][4][NbTemplate].length; l++) 
        {
          stream.write(JSON.stringify(results[Result][4][NbTemplate][l]));
          if(l<results[Result][4][NbTemplate].length-1)
          {
            stream.write(",");
          }
        }
        stream.write("],\n");

        stream.write("\t\t\t\t\t\"Execution_Time_by_class\": [");
        for (let l = 0; l < results[Result][17][NbTemplate].length; l++) 
        {
          stream.write(JSON.stringify( Math.round( results[Result][17][NbTemplate][l] * 1e4 ) / 1e4));
          if(l<results[Result][17][NbTemplate].length-1)
          {
            stream.write(",");
          }
        }
        stream.write("],\n");
        stream.write("\t\t\t\t\t\"Global_Results_By_Participant\": [\n");
        
        for (NbUser = 0; NbUser < Object.keys(dataset).length; NbUser++) 
        {
          stream.write("\t\t\t\t\t{\n"); 
          stream.write("\t\t\t\t\t\t\"Participant\": " + JSON.stringify(Object.keys(dataset)[NbUser]) + ",\n");
          stream.write("\t\t\t\t\t\t\"Recognition_Accuracy(%)\": " + (results[Result][0][NbTemplate][NbUser] * 100).toFixed(3) + ",\n");
          stream.write("\t\t\t\t\t\t\"Execution_Time(ms)\": " +  results[Result][1][NbTemplate][NbUser].toFixed(4) + ",\n");
          stream.write("\t\t\t\t\t\t\"Preprocessing_Time(ms)\": " +  results[Result][9][NbTemplate][NbUser].toFixed(4) + ",\n");/**ToDefine */
          stream.write("\t\t\t\t\t\t\"Classification_Time(ms)\": " +  results[Result][10][NbTemplate][NbUser].toFixed(4) + ",\n");/**ToDefine */
          stream.write("\t\t\t\t\t\t\"Confusion_matrix\": [");

          for (let l = 0; l < results[Result][2][NbTemplate][NbUser].length; l++) 
          {
            stream.write(JSON.stringify(results[Result][2][NbTemplate][NbUser][l]));
            if(l<results[Result][2][NbTemplate][NbUser].length-1)
            {
              stream.write(",");
            }
          }
          stream.write("],\n");

            stream.write("\t\t\t\t\t\t\"Execution_Time_by_class\": [");
          for (let l = 0; l < results[Result][3][NbTemplate][NbUser].length; l++) 
          {
            stream.write(JSON.stringify( Math.round( results[Result][3][NbTemplate][NbUser][l] * 1e4 ) / 1e4));
            if(l < results[Result][3][NbTemplate][NbUser].length - 1)
            {
            stream.write(",");
            }
          }
          stream.write("],\n");

        stream.write("\t\t\t\t\t\t\"Preprocessing_Time_by_class\": [");
        for (let l = 0; l < results[Result][11][NbTemplate][NbUser].length; l++) 
        {
          stream.write(JSON.stringify( Math.round( results[Result][11][NbTemplate][NbUser][l] * 1e4 ) / 1e4));
          if(l < results[Result][11][NbTemplate][NbUser].length - 1)
          {
            stream.write(",");
          }
        }
        stream.write("],\n");


        stream.write("\t\t\t\t\t\t\"Classification_Time_by_class\": [");/**ToDefine */
        for (let l = 0; l < results[Result][12][NbTemplate][NbUser].length; l++) 
        {
          stream.write(JSON.stringify( Math.round( results[Result][12][NbTemplate][NbUser][l] * 1e4 ) / 1e4));
          if(l < results[Result][12][NbTemplate][NbUser].length - 1)
          {
            stream.write(",");
          }
        }
        stream.write("],\n");

          stream.write("\t\t\t\t\t\t\"Raw_Recognition_Rate\": " + JSON.stringify(results[Result][7][NbTemplate][NbUser]) + ",\n");

          stream.write("\t\t\t\t\t\t\"Raw_Execution_Time\": [");
          for (let l = 0; l < results[Result][8][NbTemplate][NbUser].length; l++) 
          {
            stream.write( JSON.stringify( Math.round( results[Result][8][NbTemplate][NbUser][l]* 1e4 ) / 1e4))
            if(l<results[Result][8][NbTemplate][NbUser].length-1)
              {
                  stream.write(",");
              }
          };
            stream.write("],\n");
          
        stream.write("\t\t\t\t\t\t\"Raw_Preprocessing_Time\": [");
          for (let l = 0; l < results[Result][15][NbTemplate][NbUser].length; l++) 
            {
              stream.write( JSON.stringify( Math.round( results[Result][15][NbTemplate][NbUser][l]* 1e4 ) / 1e4))
              if(l<results[Result][15][NbTemplate][NbUser].length-1)
                {
                    stream.write(",");
                }
            };
              stream.write("],\n");
          
        stream.write("\t\t\t\t\t\t\"Raw_Classification_Time\": [");
          for (let l = 0; l < results[Result][16][NbTemplate][NbUser].length; l++) 
              {
                stream.write( JSON.stringify( Math.round( results[Result][16][NbTemplate][NbUser][l]* 1e4 ) / 1e4))
                if(l<results[Result][16][NbTemplate][NbUser].length-1)
                  {
                      stream.write(",");
                  }
              };
                stream.write("]\n");

            stream.write("\t\t\t\t\t}");
            if(NbUser<Object.keys(dataset).length-1)
            {
              stream.write(",");
            }
        stream.write("\n");     
        }
        stream.write("\t\t\t\t]\n");
        stream.write("\t\t\t}");
        if(NbTemplate<results[Result][5].length-1)
            {
              stream.write(",");
            }
        stream.write("\n");     
      } 
      stream.write("\t\t]\n");
    }
    stream.write("}\n");

    stream.end();
  });
};

// Function to save the training set to a file
let Save_TrainingSet = function (Message, Gestures) {
  let dir = `.\\public\\json\\Results\\TrainingGestures\\${Message._Eval}\\${Message._Dataset}\\${Message._Recognizer}\\${Message._Articulations}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    let file = null;
    if (Message._Eval == "UI") {
      file = fs.openSync(`${dir}\\N${Message._NbSample}_P${Message._NbParticipant}_T${Message._NbTemplates}.json`, 'w');
    } else {
      file = fs.openSync(`${dir}\\N${Message._NbSample}_T${Message._NbTemplates}_U${Message._NbParticipant}.json`, 'w');
    }
    fs.writeSync(file, "{\n");
    fs.writeSync(file, "\t\t\"Repetition\": [\n");
    Gestures.forEach(function (v) {
      fs.writeSync(file, "\t\t\t\t[\n");
      v.forEach(function (gest) {
        fs.writeSync(file, "\t\t\t\t\t\t{\n");
        fs.writeSync(file, `\t\t\t\t\t\t\t\"Candidate\" : ${gest[0]},\n`);
        fs.writeSync(file, `\t\t\t\t\t\t\t\"Training\" : [${gest.slice(1)}]\n`);
        fs.writeSync(file, "\t\t\t\t\t\t}");
        if (v.indexOf(gest) < v.length - 1) {
          fs.writeSync(file, ",");
        }
        fs.writeSync(file, "\n");
      })
      fs.writeSync(file, "\t\t\t\t]");
      if (Gestures.indexOf(v) < Gestures.length - 1) {
        fs.writeSync(file, ",");
      }
      fs.writeSync(file, "\n");
    });
    fs.writeSync(file, "\t\t]\n}");
    fs.closeSync(file);
  }
  catch (e) {

  }
}
