let app = document.getElementById("app");
let questions_number = 10;

let round_result;
/* 
Reads API call from opendb
@param:
@return: question dictionary
*/

async function ReadApi() {
    const response = await fetch(`https://opentdb.com/api.php?amount=${questions_number}`);
    const questions_obj = await response.json();
    // console.log(questions_obj);
    return questions_obj?.results;
  }

function createUiElement(parent, elm="div"){
    let child = document.createElement(elm);
    parent.append(child);
    return child;
}

  function checkQuiz(){

  }
  function checkAnswer(question, answer){
    console.log(question, answer)
    return answer == question.correct_answer;

  }

  function shuffleArray(arr){
    return arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  }

  function transformQuestion(questionObj){
    
    let answers = questionObj.incorrect_answers;
    answers.push(questionObj.correct_answer);
    questionObj.type == 'boolean'?
    questionObj['answers'] = shuffleArray(['True', 'False']):
    questionObj['answers'] = shuffleArray(answers);
    questionObj['id'] = (Math.random() + 1).toString(36).substring(7);
    return questionObj;
  }


  async function buildUI(){
    let container = createUiElement(app, "div")
    let question_list = createUiElement(container, "ul")
    question_list.classList.add("wrapper");
    const questions = await ReadApi();
    questions.forEach(q=>{
        
        let q_li = createUiElement(question_list, "li");
        q_li.innerHTML = q.question;
        q_li.classList.add("q-wrapper");

        q = transformQuestion(q);
        // poppulate answers
        q.answers.forEach(a=>{

            let wrapper = createUiElement(q_li, "div");
            wrapper.classList.add("answer-wrapper");
            let unique_id = a.split()[0];


            let a_radio = createUiElement(wrapper, "input");
            a_radio.setAttribute("type", "radio");
            a_radio.setAttribute("name", q.id);
            a_radio.setAttribute("id", unique_id);
            a_radio.setAttribute("value", a);

            a_radio.addEventListener("change", (e)=>{
                e.preventDefault();
                if(checkAnswer(q, e.target.value)){
                    a_label.classList.add("success");
                }else{
                    a_label.classList.add("fail"); 
                }

                // disable the question
                // add to result
                
            })
            let a_label = createUiElement(wrapper, "label");
            a_label.innerHTML = a;
            a_label.setAttribute("for", unique_id);

        });

        


        console.log(q);
    });
    
  }

  buildUI();

