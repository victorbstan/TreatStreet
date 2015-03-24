$(function(){
  $("body").on("click", ".carousel-control", function(e) {
    // prevent event bubling to AngularJS,
    // as it thinks we're trying to change routes
    e.preventDefault();
  });

  $('.nav-tabs a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
});
