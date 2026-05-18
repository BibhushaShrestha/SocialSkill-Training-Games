let currentModule = localStorage.getItem("selectedModule");
let currentLevel = localStorage.getItem("selectedLevel");
let questions = [];
let currentQuestion = 0;
let selectedOption = "";

function chooseModule(moduleName){
  localStorage.setItem("selectedModule", moduleName);
  window.location.href = "level.html";
}

function chooseLevel(levelName){
  localStorage.setItem("selectedLevel", levelName);
  window.location.href = "quiz.html";
}

function loadQuiz(){
  currentModule = localStorage.getItem("selectedModule");
  currentLevel = localStorage.getItem("selectedLevel");
  questions = quizDatabase[currentModule][currentLevel];

  showQuestion();
}

function showQuestion(){
  const q = questions[currentQuestion];

  document.getElementById("progress").innerText = `Question ${currentQuestion+1} of 5`;
  document.getElementById("emoji").innerText = q.image;
  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt=>{
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;
    btn.onclick = ()=>{
      selectedOption = opt;
      document.querySelectorAll(".option-btn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
    }
    optionsDiv.appendChild(btn);
  });
}

function submitAnswer(){
  if(selectedOption===""){
    alert("Please select an answer");
    return;
  }

  const correct = questions[currentQuestion].answer;
  localStorage.setItem("isCorrect", selectedOption === correct ? "yes" : "no");
  localStorage.setItem("correctAnswer", correct);
  window.location.href = "result.html";
}

function loadResult(){
  const status = localStorage.getItem("isCorrect");
  const answer = localStorage.getItem("correctAnswer");

  if(status==="yes"){
    document.getElementById("resultTitle").innerText = "🎉 Great Job!";
    document.getElementById("resultText").innerText = "Your answer is correct.";
  }else{
    document.getElementById("resultTitle").innerText = "❌ Oops! Try Again";
    document.getElementById("resultText").innerText = "Correct Answer: " + answer;
  }
}

function nextQuestion(){
  currentQuestion++;
  selectedOption = "";

  if(currentQuestion < 5){
    sessionStorage.setItem("qIndex", currentQuestion);
    window.location.href = "quiz.html";
  }else{
    alert("Module Completed!");
    window.location.href = "module_selection.html";
  }
}

window.onload = function(){
  if(window.location.pathname.includes("quiz.html")){
    currentQuestion = parseInt(sessionStorage.getItem("qIndex")) || 0;
    loadQuiz();
  }

  if(window.location.pathname.includes("result.html")){
    currentQuestion = parseInt(sessionStorage.getItem("qIndex")) || 0;
    loadResult();
  }
}