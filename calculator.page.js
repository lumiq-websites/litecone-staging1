(function(){
  var STEPS=[
    {id:"intake",   name:"Reading what arrived",    what:"The application, the statements and every attachment, in whatever form they turned up in", min:12, on:true},
    {id:"chase",    name:"Chasing what is missing", what:"The call back, the second email, the file that waited a week on one document",              min:9,  on:true},
    {id:"gather",   name:"Pulling and spreading",   what:"Bureau, financials, medical evidence, valuations, rekeyed into your template",              min:16, on:true},
    {id:"assess",   name:"Applying the policy",     what:"Reading the manual and working out which rule this particular case falls under",             min:14, on:true},
    {id:"decide",   name:"Making the call",         what:"Approve, decline, refer or price, and moving it in the system",                              min:6,  on:true},
    {id:"reason",   name:"Writing the reason",      what:"The memo, the adverse action reason, the note that explains why",                            min:11, on:true},
    {id:"check",    name:"Checking it",             what:"The second pair of eyes, the QC sample, the compliance read before it goes out",             min:7,  on:false},
    {id:"evidence", name:"Recording the evidence",  what:"Assembling what an examiner would ask for, usually put together after the fact",             min:6,  on:false}
  ];
  var $=function(s){return document.querySelector(s)};
  var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
  var fx={USD:{sym:"$",rate:1},INR:{sym:"\u20B9",rate:88}};

  function cur(){return $("#cur").value}
  function money(v){
    var f=fx[cur()], n=Math.round(v*f.rate), s=n<0?"-":"";
    return s+f.sym+Math.abs(n).toLocaleString("en-US");
  }
  function money2(v){
    var f=fx[cur()];
    return f.sym+(v*f.rate).toFixed(2);
  }
  function num(id,d){var e=$("#"+id);var v=parseFloat(e&&e.value);return isNaN(v)?d:v}
  function chosen(){return STEPS.filter(function(s){var i=$('input[data-id="'+s.id+'"]');return i&&i.checked})}

  // the tiles
  $("#apps").innerHTML=STEPS.map(function(s){
    return '<label class="apptile"><input type="checkbox" data-id="'+s.id+'"'+(s.on?" checked":"")+'>'+
           '<span class="tick">&#10003;</span><b>'+s.name+'</b>'+
           '<span class="what">'+s.what+'</span></label>';
  }).join("");

  function build(){
    var box=$("#lines"); box.innerHTML="";
    chosen().forEach(function(s){
      var row=document.createElement("div");
      row.className="line";
      row.innerHTML='<span>'+s.name+'</span>'+
        '<input class="amt" type="number" min="0" step="1" data-min="'+s.id+'" value="'+s.min+'">';
      box.appendChild(row);
    });
    if(!box.children.length){box.innerHTML='<p class="none">Nothing selected. Tick the work that happens on a case.</p>';}
    $$(".amt").forEach(function(i){i.addEventListener("input",calc)});
    strip();
    calc();
  }

  function strip(){
    var c=chosen();
    var html=c.map(function(s,i){
      return '<div class="ps"><em>Step '+String(i+1).padStart(2,"0")+'</em><b>'+s.name+'</b></div>';
    }).join("");
    html+='<div class="ps one"><em>With LiteCone</em><b>One pass, no handoff</b></div>';
    $("#pass").innerHTML=html;
    var n=c.length;
    $("#passnote").textContent = n<2
      ? "Select the work above to see how many hands a case passes through."
      : n+" steps today, and "+(n-1)+" handoff"+(n>2?"s":"")+" between them. Each handoff is a queue, and the queue is where the elapsed time actually goes.";
  }

  function calc(){
    var c=chosen();
    var mins=0;
    c.forEach(function(s){
      var i=$('input[data-min="'+s.id+'"]');
      mins += i?(parseFloat(i.value)||0):s.min;
    });

    var cases=num("cases",2000)*12;
    var loaded=num("loaded",140000);
    var hrs=Math.max(1,num("hrs",1880));
    var perHour=loaded/hrs;

    var hoursYear=cases*mins/60;
    var before=hoursYear*perHour;

    var resid=num("resid",15)/100;
    var ovs=num("ovs",2);
    var afterMins=resid*mins+(1-resid)*ovs;
    var afterHours=cases*afterMins/60;
    var lcpeople=afterHours*perHour;
    var lcsub=num("plat",96000)+cases*num("rate",0.45);
    var after=lcsub+lcpeople;

    var backHours=hoursYear-afterHours;
    var backMoney=before-after;

    $("#mins").textContent=Math.round(mins)+" min";
    $("#hmo").textContent=Math.round(hoursYear/12).toLocaleString("en-US");
    $("#hyr").textContent=Math.round(hoursYear).toLocaleString("en-US");
    $("#before").textContent=money(before);
    $("#lcsub").textContent=money(lcsub);
    $("#lcpeople").textContent=money(lcpeople);
    $("#after").textContent=money(after);

    $("#save").textContent=Math.round(backHours).toLocaleString("en-US")+" hrs";
    $("#save").className = backHours>=0 ? "big" : "big neg";
    $("#savenote").textContent = backMoney>=0
      ? "And "+money(backMoney)+" a year, on your own numbers."
      : "On these numbers the workforce costs "+money(-backMoney)+" a year more. Worth saying so.";

    $("#nsteps").textContent=c.length;
    $("#nhand").textContent=Math.max(0,c.length-1);
    $("#minsba").textContent=Math.round(mins)+" to "+(afterMins<10?afterMins.toFixed(1):Math.round(afterMins));
    $("#costba").textContent=(cases>0? money2(before/cases)+" to "+money2(after/cases) : "-");
  }

  $$('.apptile input').forEach(function(i){i.addEventListener("change",build)});
  $$('#assump input').forEach(function(i){i.addEventListener("input",calc)});
  $$('#lc input').forEach(function(i){i.addEventListener("input",calc)});
  $("#cur").addEventListener("change",calc);
  build();
})();
