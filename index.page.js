(function(){
  var rail=document.querySelectorAll('.irail button');
  function show(k){
    rail.forEach(function(b){b.classList.toggle('on',b.dataset.i===k)});
    document.querySelectorAll('.ist,.ipn').forEach(function(e){e.hidden=e.dataset.i!==k});
  }
  rail.forEach(function(b){
    b.addEventListener('click',function(){show(b.dataset.i)});
    b.addEventListener('mouseenter',function(){show(b.dataset.i)});
  });
})();
