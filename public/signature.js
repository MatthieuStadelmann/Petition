var canvas = document.getElementById('canv').getContext('2d');
var signed = false;
var draw = false;

$('#canv').on('click', function(e) {
  var signed = true;
});

$('#canv').on('mousedown', function(e) {
  draw = true;
  console.log('mousedown')
  canvas.lineWidth = 2;
  canvas.beginPath();
});

$('#canv').on('mousemove', function(e) {
  if (draw == true) {
    canvas.lineTo(e.pageX - $('#canv').offset().left, e.pageY - $('#canv').offset().top);
    canvas.strokeStyle = '#00FF7F';
    canvas.stroke();
      console.log('mousemove')
  }
});

$('#canv').on('mouseup', function(e) {
  draw = false;
  var data = document.getElementById('canv').toDataURL();
  $("input[name=signature]").val(data);
});
