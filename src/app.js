/* 
@project: OP_QUIZ_API
@author: Ahmed A.
@license: MIT
@repo: 
@dependencies: -

*/

let app = document.getElementById("app");
let controls = createUiElement(app, "div");
let questions_count = 10;

let questions;
let interval;

const Q_LEVELS = ['easy','medium', 'hard'];
const Q_TIMES = { easy:5, medium:3, hard:2 };


let quiz = {
    result:undefined,
    difficulty: Q_LEVELS[0],
    timer:Q_TIMES['easy'],
    in_progress:false,
    questions,
    questions_count

};

let reactions = new Map();
quiz = new Proxy(quiz, {
  set(target, prop, value, receiver) {
    let oldValue = target[prop];
    Reflect.set(...arguments); // Set the new value
    if (oldValue !== value) {
      let reactionsForProp = reactions.get(prop); // Get the reactions for this property
      if (reactionsForProp) {
        reactionsForProp.forEach(reaction => reaction()); // Run each reaction
      }
    }
    return true; // Indicate that the assignment has been done correctly
  }
});
// Function to register a new "reaction"
function watch(data, prop, reaction) {
  let reactionsForProp = reactions.get(prop);
  if (!reactionsForProp) {
    reactionsForProp = new Set();
    reactions.set(prop, reactionsForProp);
  }
  reactionsForProp.add(reaction);
}
watch(quiz, 'difficulty', () => {
    let difficutly_words = document.getElementById("difficutly-words");
    difficutly_words.innerText = `Playing...${quiz.difficulty}`;
    quiz.timer = Q_TIMES[quiz.difficulty];
});
watch(quiz, 'questions',async () => {
    var used_wrapper=document.getElementById("quiz-wrapper");
    if(used_wrapper)used_wrapper.remove();

    var time_span = document.getElementsByClassName('timer-span')[0];
    if(time_span) time_span.remove();
    buildTimer();
    await buildQuestionsUI();
});
watch(quiz, 'questions_count', () => {
    let count_words = document.getElementById("count-words");
    count_words.innerText = `You will answer ${quiz.questions_count} question`;
});

watch(quiz, 'in_progress', () => {
    let conf_btn = document.getElementsByClassName('conf-btn')[0];
    let stop_btn = document.getElementsByClassName('stop-btn')[0];
    let timer_span = document.getElementsByClassName('timer-span')[0];
    let result_box = document.getElementsByClassName('result-box')[0];

    if(quiz.in_progress){
        conf_btn.setAttribute("hidden", true);
        stop_btn.removeAttribute("hidden");
        timer_span?.removeAttribute("hidden");
        result_box?.setAttribute("hidden", true);
    }else{
        conf_btn.removeAttribute("hidden");
        result_box?.removeAttribute("hidden");

        stop_btn.setAttribute("hidden", true);
        timer_span?.setAttribute("hidden", true);
        
    }

});
watch(quiz, 'result', (res) => {
    let result_box = document.getElementsByClassName("result-box")[0];
    result_box.innerText = quiz.result;
});

/* 
Reads API call from opendb
@param:
@return: question dictionary
*/

async function readApi() {
    let questions_obj;
    toggleLoading();
    await fetch(`https://opentdb.com/api.php?amount=${quiz.questions_count}&difficulty=${quiz.difficulty}`).then(async (response)=>{
        questions_obj = await response.json();
    }).catch(e=>alert(e));
    
    toggleLoading();
    // console.log(questions_obj);
    return questions_obj?.results;
  }

function createUiElement(parent, elm="div"){
    let child = document.createElement(elm);
    parent.append(child);
    return child;
}
function makeUUID() {
    return (Math.random() + 1).toString(36).substring(2);
}

function checkQuiz(){
    var res =  Object.values(quiz.questions).reduce((s, v)=>s+=v.points, 0);
    quiz.result =`You scored ${res} / ${quiz.questions_count * 10}`;
}


function checkAnswer(question, answer){
    let isCorrect = answer == question.correct_answer
    if (isCorrect) question.points+=10;
    return isCorrect;

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
    questionObj['id'] = makeUUID();
    questionObj['points'] = 0;
    return questionObj;
}

function toggleLoading(){
    let loader = document.getElementsByClassName('loader')[0];
    loader.classList.contains('loading')?
    loader.classList.remove('loading'):
    loader.classList.add('loading');
}

function populateAnswers(q, q_li){
    // populate answers
    q.answers.forEach(a=>{
        let wrapper = createUiElement(q_li, "div");
        wrapper.classList.add("answer-wrapper");
        let unique_id = makeUUID();

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
                a_label.classList.add("error"); 
                let should_be =Array.from(e.target.parentElement.parentElement.children).map(c=>c.children).flatMap(c=>[...c]).filter(c=>c.localName=="label" ).filter(c=>c.innerText==q.correct_answer)
                should_be[0].classList.add("should-be");
            }
            
            //TODO:
            // disable the question
            disbaleQuestion(q_li);

        })
        let a_label = createUiElement(wrapper, "label");
        a_label.innerHTML = a;
        a_label.setAttribute("for", unique_id);

    });
  }

function disbaleQuestion(q_li) {
    Array.from(q_li.children).map(x => x.children)
        .flatMap(x => [...x]).flat(x => x).filter(x => x.localName == 'input')
        .filter(i => i.setAttribute("disabled", true));
}

function makeModal(){
    let modal_wrapper = createUiElement(app, "div");
    modal_wrapper.classList.add("modal");
    
    let count_words = createUiElement(modal_wrapper, "span");
    count_words.setAttribute("id", "count-words");
    count_words.innerText = `You will answer ${quiz.questions_count} question`;
    
    let count_silder = createUiElement(modal_wrapper, "input");

    count_silder.setAttribute("type", "range");
    count_silder.setAttribute("min",2);
    count_silder.setAttribute("max",20);
    count_silder.setAttribute("value",questions_count);
    count_silder.classList.add('slider');
    

    count_silder.innerHTML = 7;
    count_silder.oninput = (v)=>quiz.questions_count=v.target.value; 

    // name and id
    var difficutly_words = createUiElement(modal_wrapper, "span");
    difficutly_words.setAttribute("id", "difficutly-words");

    difficutly_words.innerText = `Playing...${quiz.difficulty}`;

    let diff_select = createUiElement(modal_wrapper, "select");
    diff_select.setAttribute("name", "levels");
    diff_select.setAttribute("required", true);
    diff_select.classList.add("select");
    
    let opt_grp = createUiElement(diff_select, "optgroup")
    // label
    opt_grp.setAttribute("label", "How Hard!")
    opt_grp.selected = null;

    diff_select.onchange = (sel)=>quiz.difficulty = sel.target.value;

    Q_LEVELS.forEach(level=>{
        let opt = createUiElement(opt_grp, "option");
        opt.innerHTML = level;
        opt.dataset.value = level;
        if(level==quiz.questions_difficulty) opt.selected = true;

    });



    let start_btn = createUiElement(modal_wrapper, "button");
    start_btn.setAttribute("id", "start-btn");
    start_btn.innerHTML = "Let's GO"

    start_btn.onclick = async()=>{
        toggleModal();
        quiz.questions = await readApi();
        quiz.in_progress = true;
    };

    

}
function toggleModal(){
    document.body.classList.contains('modal-open')?
    document.body.classList.remove('modal-open'):
    document.body.classList.add('modal-open');
    
    var modal = document.getElementsByClassName("modal");
    
    modal[0].classList.contains('open')?
    modal[0].classList.remove('open'):
    modal[0].classList.add('open');

    
}
async function buildQuestionsUI(){
    let container = createUiElement(app, "div")
    container.setAttribute("id", "quiz-wrapper");
    let question_list = createUiElement(container, "ul")
    question_list.classList.add("wrapper");
    // populate questions
    quiz.questions?.forEach(q=>{
        let q_li = createUiElement(question_list, "li");
        q_li.innerHTML = q.question;
        q_li.classList.add("q-wrapper");
        q = transformQuestion(q);
        populateAnswers(q, q_li);
        //console.log(q);
    });

  }




  async function buildUI(){
    let conf_btn = createUiElement(controls, "button");
    conf_btn.innerHTML = "Configure Quiz";
    conf_btn.classList.add("conf-btn");
    conf_btn.onclick = ()=>toggleModal();
    controls.classList.add("controls");
    let stop_btn = createUiElement(controls, "button");
    stop_btn.innerHTML = "Finish Quiz";
    stop_btn.classList.add("stop-btn");

    let result_box = createUiElement(controls, "div");
    result_box.classList.add("result-box");
    
    stop_btn.onclick = ()=>{
        // clear timer
        clearInterval(interval);
        // calculate result
        checkQuiz();
        // show result
        
        // reset in progress
        quiz.in_progress = false;
    };
    stop_btn.setAttribute("hidden", true);
    result_box.setAttribute("hidden", true);

  }

  function buildTimer(){
    let timer_span = createUiElement(controls, "span");
    
    timer_span.classList.add("timer-span");
    timer_span.setAttribute("hidden", true);

    let ts = new Date();
    let elapse = new Date(ts);
    elapse.setMinutes(ts.getMinutes() + quiz.timer);

    interval = setInterval(()=>{
        let now = new Date().getTime();
        let distance = elapse - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timer_span.innerHTML = `${minutes}:${seconds}`;

        if (distance < 0){
             clearInterval(interval);
             document.getElementsByClassName("stop-btn")[0].click();
            };

    },1000);

    
    
  }
  document.onreadystatechange = async ()=>{
    makeModal();
    await buildUI();
    window.onscroll = ()=>window.scrollY > controls.offsetTop+100 ? controls.classList.add("sticky"):controls.classList.remove("sticky");
  };

