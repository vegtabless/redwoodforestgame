(function(){
  let wolves = 5, deer = 20, plants = 50, redwoods = 10;
  let logging = 10, protectedArea = 20;
  let turn = 0;
  let running = false;
  let history = {wolves:[], deer:[], plants:[], redwoods:[], logging:[], protected:[]};
  let timer = null;

  const el = id => document.getElementById(id);
  const turnEl = el('turn'), wolvesEl = el('wolves'), deerEl = el('deer'),
        plantsEl = el('plants'), redwoodsEl = el('redwoods'),
        messageEl = el('message'), startBtn = el('startBtn'), stepBtn = el('stepBtn'),
        resetBtn = el('resetBtn'), addWolf = el('addWolf'), addDeer = el('addDeer'),
        plantShrubs = el('plantShrubs'), plantRedwood = el('plantRedwood'),
        downloadBtn = el('downloadCSV'),
        loggingInput = el('logging'), protectedInput = el('protected'),
        loggingVal = el('loggingVal'), protectedVal = el('protectedVal');

  const chartCanvas = el('chart'); const mapCanvas = el('miniMap');
  const chartCtx = chartCanvas.getContext('2d'); const mapCtx = mapCanvas.getContext('2d');

  function clamp(v){ return Math.max(0, Math.round(v)); }
  function pushHistory(){
    history.wolves.push(wolves); history.deer.push(deer); history.plants.push(plants); history.redwoods.push(redwoods);
    history.logging.push(logging); history.protected.push(protectedArea);
    if(history.wolves.length > 300){
      Object.keys(history).forEach(k => history[k].shift());
    }
  }
  function updateUI(){
    turnEl.textContent = turn; wolvesEl.textContent = wolves; deerEl.textContent = deer;
    plantsEl.textContent = plants; redwoodsEl.textContent = redwoods;
    loggingVal.textContent = logging; protectedVal.textContent = protectedArea;
    messageEl.textContent = computeMessage();
    drawMap();
    drawChart();
  }
  function computeMessage(){
    if(wolves === 0 && deer > 40) return 'Wolves extinct → Deer overpopulated → Plants collapsing!';
    if(deer === 0) return 'Deer extinct → Wolves starving → Plants recover (short-term).';
    if(redwoods === 0) return 'Redwoods collapsed → Long-term ecosystem instability!';
    return 'Ecosystem in balance — test management actions to see long-term responses.';
  }
  function stochasticEvent(currentRedwoods){
    if(Math.random() < 0.03){
      const shock = Math.floor(Math.random()*10) + 5;
      messageEl.textContent = 'Stochastic event occurred: drought/storm reduced canopy by ' + shock + '%';
      return Math.max(0, currentRedwoods - shock);
    }
    return currentRedwoods;
  }
  function step(){
    turn += 1;
    let nd = deer + 2 - Math.floor(wolves/2);
    if(plants < 20) nd -= 3;
    nd += Math.round(logging/50);
    deer = clamp(nd);
    let np = plants + 3 - Math.floor(deer/3) - Math.round(logging/60) + (Math.random()*2 - 1);
    plants = clamp(np);
    let nr = redwoods + (plants > 40 ? 1 : 0) - (deer > 25 ? 1 : 0) - Math.round(logging/80);
    nr += Math.round(protectedArea/80);
    nr = stochasticEvent(nr);
    redwoods = clamp(nr);
    let nw = wolves + (deer > 18 ? 1 : -1);
    if(logging > 70) nw = Math.max(0, nw - 1);
    wolves = Math.max(nw, 0);
    pushHistory();
    updateUI();
  }
  function drawChart(){
    const w = chartCanvas.width, h = chartCanvas.height;
    chartCtx.clearRect(0,0,w,h);
    chartCtx.fillStyle = '#fff'; chartCtx.fillRect(0,0,w,h);
    chartCtx.strokeStyle = '#e6e6e6'; chartCtx.beginPath();
    for(let i=0;i<=4;i++){ let y = 10 + i*(h-20)/4; chartCtx.moveTo(30,y); chartCtx.lineTo(w-10,y); }
    chartCtx.stroke();
    const len = history.wolves.length;
    if(len < 2) return;
    const maxPoints = Math.min(100, len);
    const start = len - maxPoints;
    const stepX = (w-50) / (maxPoints-1);
    function drawLine(data, color){
      chartCtx.beginPath();
      for(let i=start;i<len;i++){
        const x = 30 + (i-start)*stepX;
        const y = 10 + (1 - (data[i]||0)/100) * (h-20);
        if(i===start) chartCtx.moveTo(x,y); else chartCtx.lineTo(x,y);
      }
      chartCtx.strokeStyle = color; chartCtx.lineWidth = 2; chartCtx.stroke();
    }
    drawLine(history.wolves, '#0f766e');
    drawLine(history.deer, '#d97706');
    drawLine(history.plants, '#16a34a');
    drawLine(history.redwoods, '#065f46');
    chartCtx.fillStyle='#000'; chartCtx.font='12px sans-serif';
    chartCtx.fillText('Wolves', 35,14); chartCtx.fillStyle='#0f766e'; chartCtx.fillRect(70,6,12,6);
    chartCtx.fillStyle='#000'; chartCtx.fillText('Deer', 120,14); chartCtx.fillStyle='#d97706'; chartCtx.fillRect(155,6,12,6);
    chartCtx.fillStyle='#000'; chartCtx.fillText('Plants', 200,14); chartCtx.fillStyle='#16a34a'; chartCtx.fillRect(245,6,12,6);
    chartCtx.fillStyle='#000'; chartCtx.fillText('Redwoods', 290,14); chartCtx.fillStyle='#065f46'; chartCtx.fillRect(355,6,12,6);
  }
  function drawMap(){
    const w = mapCanvas.width, h = mapCanvas.height;
    mapCtx.clearRect(0,0,w,h);
    mapCtx.fillStyle = '#dfffe8'; mapCtx.fillRect(0,0,w,h);
    mapCtx.fillStyle = '#2f855a'; mapCtx.fillRect(0,h-30,w,30);
    const treeCount = 10;
    for(let i=0;i<treeCount;i++){
      const x = 12 + i*34;
      const visible = redwoods/100 > Math.random();
      const trunkH = 15 + (redwoods/100)*25;
      mapCtx.fillStyle = '#6b4f2b'; mapCtx.fillRect(x+10, h-30-trunkH, 6, trunkH);
      mapCtx.beginPath();
      mapCtx.fillStyle = visible ? '#2f855a' : 'rgba(47,133,90,0.12)';
      mapCtx.arc(x+13, h-30-trunkH-10, 12, 0, Math.PI*2); mapCtx.fill();
    }
    const deerCount = Math.round((deer/100)*8);
    for(let i=0;i<deerCount;i++){
      const dx = 10 + (i%8)*34 + (turn%7)-3;
      const dy = h-18 + ((i%3)*3);
      mapCtx.fillStyle = '#a9745b'; mapCtx.beginPath(); mapCtx.ellipse(dx, dy, 8, 5, 0, 0, Math.PI*2); mapCtx.fill();
    }
    if(wolves>0){
      mapCtx.font = '12px sans-serif'; mapCtx.fillText('Wolves: '+wolves, w-110, 20);
    }
  }
  function downloadCSV(){
    let rows = [['turn','wolves','deer','plants','redwoods','logging','protected']];
    for(let i=0;i<history.wolves.length;i++){
      rows.push([i+1, history.wolves[i], history.deer[i], history.plants[i], history.redwoods[i], history.logging[i], history.protected[i]]);
    }
    const csv = rows.map(r => r.join(',')).join('\\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'redwood_history.csv'; a.click();
    URL.revokeObjectURL(url);
  }
  startBtn.addEventListener('click', ()=>{
    running = !running; startBtn.textContent = running ? 'Pause' : 'Start';
    if(running){ timer = setInterval(step, 700); } else { clearInterval(timer); timer = null; }
  });
  stepBtn.addEventListener('click', ()=> { step(); });
  resetBtn.addEventListener('click', ()=> {
    wolves=5; deer=20; plants=50; redwoods=10; logging=10; protectedArea=20; turn=0; history={wolves:[],deer:[],plants:[],redwoods:[],logging:[],protected:[]}; updateUI();
  });
  addWolf.addEventListener('click', ()=> { wolves = clamp(wolves+1); updateUI(); });
  addDeer.addEventListener('click', ()=> { deer = clamp(deer+2); updateUI(); });
  plantShrubs.addEventListener('click', ()=> { plants = clamp(plants+5); updateUI(); });
  plantRedwood.addEventListener('click', ()=> { redwoods = clamp(redwoods+1); updateUI(); });
  downloadBtn.addEventListener('click', downloadCSV);
  loggingInput.addEventListener('input', (e)=> { logging = Number(e.target.value); loggingVal.textContent = logging; updateUI(); });
  protectedInput.addEventListener('input', (e)=> { protectedArea = Number(e.target.value); protectedVal.textContent = protectedArea; updateUI(); });
  pushHistory();
  updateUI();
  window._redwood_state = ()=> ({wolves,deer,plants,redwoods,logging,protectedArea,turn,history});
})();